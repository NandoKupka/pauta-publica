import { mkdir, readFile, rename, writeFile, unlink, open, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { day, shift, asList, plain, official, sources, parseFeed, parseCalendar } from './sources.mjs';
import { jobOrgs, resultStatus, safeError, migrateSnapshot } from './data-quality.mjs';
import { collectStf } from './stf.mjs';
import { camSubject, senateSubject, syncPautas, reportKinds } from './pautas.mjs';
import { enrichPautas } from './pauta-sources.mjs';
export { jobOrgs };
const dir=new URL('./data/',import.meta.url);
const cam='https://dadosabertos.camara.leg.br/api/v2',sen='https://legis.senado.leg.br/dadosabertos';
const feeds={stj:['https://res.stj.jus.br/hrestp-c-portalp/RSS.xml','https://www.stj.jus.br/hrestp-c-portalp/RSS.xml'],tse:['https://www.tse.jus.br/rss']};
const list=value=>{if(!Array.isArray(value))throw new Error('Lista ausente');return value;};
const eventUrl=id=>'https://www.camara.leg.br/evento-legislativo/'+id;
const unique=rows=>[...new Map(rows.map(row=>[row.id,row])).values()];
const query=(path,params)=>cam+'/'+path+'?'+new URLSearchParams(params);
export async function mapLimit(items,fn,limit=4) {
  const results=new Array(items.length);let next=0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
    for(;;){const i=next++;if(i>=items.length)return;results[i]=await fn(items[i],i);}
  }));
  return results;
}
let active=0;
const queue=[];
export async function request(url,json=false,accept='*/*') {
  if(active>=8)await new Promise(resolve=>queue.push(resolve));else active++;
  try {
    for(let attempt=0;attempt<2;attempt++){
      try{
        const res=await fetch(url,{headers:{accept:json?'application/json':accept},signal:AbortSignal.timeout(15000)});
        if(!res.ok)throw new Error('HTTP '+res.status);
        if(json){const body=await res.text();return body.trim()?JSON.parse(body):null;}
        return new TextDecoder(/iso-8859-1|windows-1252/i.test(res.headers.get('content-type'))?'windows-1252':'utf-8').decode(await res.arrayBuffer());
      }catch(error){
        if(attempt||/^HTTP 4(?!29)/.test(error.message))throw error;
        await new Promise(resolve=>setTimeout(resolve,750));
      }
    }
  }finally{const resume=queue.shift();if(resume)resume();else active--;}
}
export async function allCamPages(url,get=request) {
  const first=new URL(url),seen=new Set(),rows=[];
  while(url){
    const current=new URL(url);
    if(current.origin!==first.origin||current.pathname!==first.pathname||seen.has(url)||seen.size>=100)throw new Error('Paginação incompleta ou inválida');
    seen.add(url);
    const payload=await get(url,true);
    rows.push(...list(payload.dados));
    url=payload.links?.find(link=>link.rel==='next')?.href;
    if(url)url=new URL(url,current).href;
  }
  return unique(rows);
}
function oldRows(previous,id){return new Map((previous.jobs[id]?.entries??[]).map(row=>[row.id,row]));}
async function withAgenda(row,run,old,at) {
  try{
    const result=await run();
    row.items=result.map(item=>typeof item==='string'?item:item.text);
    row.itemPautaIds=result.map(item=>typeof item==='object'?item.subject?.id||null:null);
    row.subjects=result.filter(item=>typeof item==='object'&&item.subject).map(item=>item.subject);
    row.documents=result.flatMap(item=>typeof item==='object'?item.documents??[]:[]);
    row.agendaState=row.items.length?'ready':'unpublished';row.agendaAt=at;
  }catch(error){
    row.items=old?.items??[];row.itemPautaIds=old?.itemPautaIds??[];row.subjects=old?.subjects??[];row.documents=old?.documents??[];row.agendaState=row.items.length?'cached':'error';
    row.agendaAt=old?.agendaAt||old?.fetchedAt||null;row.collectionIssue=safeError(error);
  }
  return row;
}
export function createCollectors(get=request) {
  return {
    camAgenda:async(today,previous,at)=>{
      const weeks=await mapLimit([0,7,14],offset=>allCamPages(query('eventos',{dataInicio:shift(today,offset),dataFim:shift(today,offset+6),itens:100,ordem:'ASC',ordenarPor:'dataHoraInicio'}),get),3);
      const events=unique(weeks.flat()).filter(e=>/deliberativ/i.test(e.descricaoTipo)&&!/não deliberativ/i.test(e.descricaoTipo)&&e.dataHoraInicio);
      const old=oldRows(previous,'camAgenda');
      return mapLimit(events,async e=>{
        const row={id:'camara-evento-'+e.id,org:'camara',type:'agenda',dataShape:2,date:e.dataHoraInicio.slice(0,10),time:e.dataHoraInicio.slice(11,16),
          title:plain(e.descricao?.split(/\r?\n/)[0])||e.descricaoTipo,status:e.situacao||'Sessão prevista',url:eventUrl(e.id),
          body:e.orgaos?.map(o=>o.nomePublicacao||o.nome).filter(Boolean).join(' / ')||'',eventId:e.id};
        return withAgenda(row,async()=>list((await get(cam+'/eventos/'+e.id+'/pauta',true)).dados).map(x=>{
          const p=x.proposicao_??{};
          const document=camSubject(p),related=camSubject(x.proposicaoRelacionada_??{});
          const isReport=reportKinds.has(p.siglaTipo)&&document&&related&&!reportKinds.has(related.kind)&&document.id!==related.id;
          const subject=isReport?related:document;
          return {text:[subject?.reference,plain((isReport?related.summary:p.ementa)||x.titulo||x.descricao),isReport?'Parecer: '+plain(x.textoParecer||p.ementa):''].filter(Boolean).join(' — '),subject,
            documents:isReport?[{...document,parentId:related.id,parentReference:related.reference}]:[]};
        }).filter(x=>x.text),old.get(row.id),at);
      });
    },
    camVotes:async(today,previous,at)=>{
      const votes=await allCamPages(query('votacoes',{dataInicio:shift(today,-59),dataFim:today,idOrgao:180,itens:100,ordem:'DESC',ordenarPor:'dataHoraRegistro'}),get);
      const old=oldRows(previous,'camVotes');
      return mapLimit(votes.filter(v=>v.descricao),async v=>{
        if(!/^[\d-]+$/.test(v.id))throw new Error('ID de votação inesperado');
        const id='camara-voto-'+v.id,prior=old.get(id),endpoint=cam+'/votacoes/'+v.id;
        const row={id,org:'camara',type:'votacoes',date:v.data,title:plain(v.descricao),body:plain(v.descricao),
          status:resultStatus(v.aprovacao,v.descricao),url:endpoint,votesUrl:endpoint+'/votos',ballots:[],
          registeredAt:v.dataHoraRegistro,reference:'',voteKind:/\bnominal\b/i.test(v.descricao)?'Nominal':/\bsimbólic[ao]\b/i.test(v.descricao)?'Simbólica':'Método não identificado'};
        const eventId=v.uriEvento?.match(/\/(\d+)$/)?.[1];if(eventId)row.eventUrl=eventUrl(eventId);
        const [detail,ballots]=await Promise.allSettled([get(endpoint,true),get(endpoint+'/votos',true).then(x=>list(x.dados))]);
        if(detail.status==='fulfilled'&&detail.value.dados){
          row.subjects=asList(detail.value.dados.proposicoesAfetadas).map(camSubject).filter(Boolean);
          row.related=row.subjects.map(p=>({title:p.reference,url:p.url,pautaId:p.id}));
          row.detailsState='ready';
        }else{
          row.related=prior?.related??[];row.subjects=prior?.subjects??[];row.detailsState='error';row.collectionIssue='Os detalhes do resultado não puderam ser consultados.';
        }
        row.context='O resultado se refere ao ato descrito acima. Uma votação pode tratar de requerimento, emenda ou outra etapa, sem concluir a tramitação da proposta.';
        if(ballots.status==='fulfilled'){
          const raw=ballots.value;
          row.ballots=raw.filter(x=>x.deputado_?.nome&&x.tipoVoto).map(x=>({id:x.deputado_.id,name:x.deputado_.nome,party:x.deputado_.siglaPartido,state:x.deputado_.siglaUf,vote:x.tipoVoto}));
          row.ballotsState=raw.length?'ready':'unpublished';row.ballotsAt=at;
          if(row.ballots.length!==raw.length){row.ballotsState='partial';row.collectionIssue='Há registros individuais incompletos na fonte.';}
        }else{
          row.ballots=prior?.ballots??[];row.ballotsAt=prior?.ballotsAt||prior?.fetchedAt||null;
          row.ballotsState=row.ballots.length?'cached':'error';row.collectionIssue='A consulta aos registros individuais falhou.';
        }
        return row;
      });
    },
    senAgenda:async(today,previous,at)=>{
      const events=parseCalendar(await get(sen+'/plenario/agenda/atual/iCal')).filter(e=>e.date>=today&&e.date<=shift(today,20))
        .filter(e=>e.org==='congresso'||e.items.length||(/deliberativ/i.test(e.title)&&!/não deliberativ/i.test(e.title)));
      const old=oldRows(previous,'senAgenda');
      return mapLimit(events,e=>withAgenda(e,async()=>{
        const data=await get(sen+'/plenario/encontro/'+e.uid+'/pauta',true);
        if(data===null)return [];
        if(!data.ServicoPlenario)throw new Error('Pauta em formato inesperado');
        return asList(data.ServicoPlenario.itensPauta?.itemPauta).filter(x=>x.pauta==='S'&&x.retirado!=='S')
          .map(x=>({text:[plain(x.materiaLegislativa?.identificacao||x.identificacao),plain(x.cabecalho||x.ementa)].filter(Boolean).join(' — '),subject:senateSubject(x,e.org)}));
      },old.get(e.id),at));
    },
    senVotes:async(today)=>{
      const years=[...new Set([today.slice(0,4),shift(today,-59).slice(0,4)])];
      const payloads=await Promise.all(years.map(year=>get(sen+'/plenario/votacao/nominal/'+year,true)));
      if(payloads.some(j=>!j.ListaVotacoes))throw new Error('Lista nominal ausente');
      return payloads.flatMap(x=>asList(x.ListaVotacoes.Votacoes?.Votacao)).filter(x=>x.DataSessao<=today&&x.DataSessao>=shift(today,-59)).map(v=>{
        const org=v.SiglaCasa==='CN'?'congresso':'senado',secret=v.Secreta==='S';
        const ballots=secret?[]:asList(v.Votos?.VotoParlamentar).filter(x=>x.NomeParlamentar&&x.Voto).map(x=>({id:x.CodigoParlamentar,name:x.NomeParlamentar,party:x.SiglaPartido,state:x.SiglaUF,vote:x.DescricaoVoto||x.Voto}));
        return {id:org+'-voto-'+v.CodigoSessaoVotacao,org,type:'votacoes',date:v.DataSessao,title:plain(v.DescricaoVotacao)||v.DescricaoIdentificacaoMateria,
          reference:v.DescricaoIdentificacaoMateria,body:plain(v.DescricaoVotacao),status:({A:'Aprovado',R:'Rejeitado'})[v.Resultado]||'Resultado publicado',
          url:v.CodigoMateria?'https://www25.senado.leg.br/web/atividade/materias/-/materia/'+v.CodigoMateria:sources[org].url,
          subjects:[senateSubject({codMateria:v.CodigoMateria,identificacao:v.DescricaoIdentificacaoMateria},org)].filter(Boolean),
          votesUrl:sen+'/plenario/votacao/nominal/'+v.DataSessao.slice(0,4),ballots,secret,voteKind:secret?'Secreta':'Nominal',ballotsState:secret?'secret':ballots.length?'ready':'unpublished'};
      });
    },
    stfAgenda:async(today,previous,at)=>collectStf(today,get,oldRows(previous,'stfAgenda'),at),
    stf:async()=>{
      const data=list(await get('https://noticias.stf.jus.br/wp-json/wp/v2/postsnoticias?per_page=100&_fields=id,date_gmt,date,link,title',true));
      const rows=data.map(p=>{
        const date=p.date_gmt?new Date(p.date_gmt+'Z'):new Date(p.date+'-03:00');
        return {id:'stf-noticia-'+p.id,org:'stf',type:'noticias',title:plain(p.title?.rendered),date:Number.isFinite(+date)?day(date):'',status:'Notícia oficial',url:official(p.link)};
      });
      if(rows.some(x=>!x.title||!x.date||!x.url))throw new Error('Notícias incompletas');
      return rows;
    },
    ...Object.fromEntries(Object.entries(feeds).map(([org,urls])=>[org,async()=>{
      let last;
      for(const url of urls)try{return parseFeed(await get(url,false,'application/rss+xml, application/xml, */*'),org);}catch(error){last=error;}
      throw last;
    }]))
  };
}
export async function collectSnapshot(previous,{get=request,today=day(),now=new Date(),collectors=createCollectors(get)}={}) {
  const checkedAt=now.toISOString();
  const results=await Promise.all(Object.entries(collectors).map(async([id,run])=>{
    try{
      const entries=unique(await run(today,previous,checkedAt)).map(row=>({...row,sourceJob:id,fetchedAt:checkedAt,
        ...(row.type==='votacoes'&&!row.ballotsAt&&row.ballotsState==='ready'?{ballotsAt:checkedAt}:{})}));
      const issues=[...new Set(entries.map(row=>row.collectionIssue).filter(Boolean))];
      return [id,{at:checkedAt,checkedAt,status:issues.length?'partial':'ready',ok:!issues.length,issues,entries}];
    }catch(error){
      return [id,{at:previous.jobs[id]?.at??null,checkedAt,status:'error',ok:false,issues:[safeError(error)],entries:previous.jobs[id]?.entries??[]}];
    }
  }));
  return syncPautas(previous,{version:2,checkedAt,jobs:Object.fromEntries(results)});
}
export async function readSnapshot() {
  for(const name of ['live.json','snapshot.json']){
    try{return migrateSnapshot(JSON.parse(await readFile(new URL(name,dir),'utf8')));}catch{}
  }
  return {version:2,checkedAt:null,jobs:{}};
}
let running;
export function collect(){return running??=update().finally(()=>{running=null;});}
async function update(){
  await mkdir(dir,{recursive:true});
  const lockPath=new URL('collect.lock',dir);
  let lock;
  for(let attempt=0;attempt<2;attempt++){
    try{lock=await open(lockPath,'wx');await lock.writeFile(String(process.pid));break;}
    catch(error){
      if(error.code!=='EEXIST')throw error;
      try{
        const pid=Number(await readFile(lockPath,'utf8'));
        if(!Number.isInteger(pid)||pid<=0){
          if(Date.now()-(await stat(lockPath)).mtimeMs<60000)return readSnapshot();
          await unlink(lockPath);continue;
        }
        try{process.kill(pid,0);return readSnapshot();}
        catch(cause){if(cause.code!=='ESRCH')return readSnapshot();}
        await unlink(lockPath);
      }catch{return readSnapshot();}
    }
  }
  if(!lock)return readSnapshot();
  const temp=new URL('live-'+process.pid+'.tmp',dir);
  try{
    const snapshot=await collectSnapshot(await readSnapshot());
    snapshot.pautas=await enrichPautas(snapshot.pautas,request,snapshot.checkedAt);
    await writeFile(temp,JSON.stringify(snapshot));await rename(temp,new URL('live.json',dir));
    return snapshot;
  }finally{await unlink(temp).catch(()=>{});await lock.close();await unlink(lockPath).catch(()=>{});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const snapshot=await collect();
  for(const [name,data] of Object.entries(snapshot.jobs))console.log(name+': '+data.entries.length+' / '+data.status+(data.issues.length?' / '+data.issues.join(' '):''));
  const pautas=Object.values(snapshot.pautas??{}),incomplete=pautas.filter(p=>p.details?.quality!=='ready');
  console.log('pautas: '+pautas.length+' / '+incomplete.length+' com detalhes incompletos');
  if(Object.values(snapshot.jobs).some(job=>!job.ok)||incomplete.length)process.exitCode=1;
}

