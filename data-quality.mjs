export const jobs = {
  camAgenda:{name:'Câmara · agenda',orgs:['camara'],tabs:['agenda'],scope:'Sessões e reuniões deliberativas nos próximos 21 dias, com os itens publicados.'},
  camVotes:{name:'Câmara · votações',orgs:['camara'],tabs:['votacoes'],scope:'Resultados do Plenário nos últimos 60 dias. Comissões não incluídas.'},
  senAgenda:{name:'Senado e Congresso · agenda',orgs:['senado','congresso'],tabs:['agenda'],scope:'Sessões do calendário de Plenário nos próximos 21 dias.'},
  senVotes:{name:'Senado e Congresso · votações',orgs:['senado','congresso'],tabs:['votacoes'],scope:'Votações nominais publicadas na API nos últimos 60 dias.'},
  stfAgenda:{name:'STF · agenda',orgs:['stf'],tabs:['agenda'],scope:'Calendário presencial e virtual nos próximos 21 dias. Processos coletados apenas nas pautas presenciais.'},
  stf:{name:'STF · notícias',orgs:['stf'],tabs:['noticias','decisoes'],scope:'Até 100 notícias mais recentes do canal oficial de notícias.'},
  stj:{name:'STJ · notícias',orgs:['stj'],tabs:['noticias','decisoes'],scope:'Notícias disponíveis no feed oficial. Agenda e votos não incluídos.'},
  tse:{name:'TSE · notícias',orgs:['tse'],tabs:['noticias','decisoes'],scope:'Notícias disponíveis no feed oficial. Agenda e votos não incluídos.'}
};
export const jobOrgs=Object.fromEntries(Object.entries(jobs).map(([id,job])=>[id,job.orgs]));
export function resultStatus(approval, description='') {
  if (/^rejeitad[oa]\b/i.test(description.trim())) return 'Rejeitado';
  if (approval===1) return 'Aprovado';
  if (approval===0) return 'Não aprovado';
  return 'Resultado publicado';
}
export function ballotSummary(ballots=[]) {
  const totals={Sim:0,'Não':0,'Abstenção':0};
  let other=0;
  for(const b of ballots) {
    const value=String(b.vote).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
    const canonical=({sim:'Sim',nao:'Não',abstencao:'Abstenção',abst:'Abstenção'})[value];
    if(canonical)totals[canonical]++;else other++;
  }
  return {totals,votes:Object.values(totals).reduce((a,b)=>a+b,0),other};
}
export function jobHealth(job,now=new Date()) {
  if(!job?.at) return 'unavailable';
  if(job.status==='error'||job.ok===false&&job.status!=='partial')return 'error';
  if(Date.parse(job.at)<+now-60*60*1000)return 'stale';
  return job.status==='partial'?'partial':'ready';
}
export function pautaHealth(pauta,now=new Date()) {
  const d=pauta.details;
  return jobHealth(d?{at:d.at,status:d.quality,ok:d.quality==='ready'}:null,now);
}
export function safeError(error) {
  if(error?.name==='TimeoutError'||error?.name==='AbortError')return 'A fonte demorou para responder.';
  if(error?.message?.startsWith('HTTP '))return 'A fonte respondeu com '+error.message+'.';
  if(error?.message==='fetch failed')return 'Não foi possível conectar à fonte.';
  return 'A resposta não pôde ser validada.';
}
export function migrateSnapshot(snapshot) {
  if(!snapshot||typeof snapshot.jobs!=='object'||!snapshot.jobs)throw new Error('Cópia inválida');
  if(snapshot.version===2) return snapshot;
  const migrated={version:2,checkedAt:snapshot.checkedAt,jobs:{}};
  for(const [key,job] of Object.entries(snapshot.jobs)) {
    if(!jobs[key]||!Array.isArray(job.entries))continue;
    migrated.jobs[key]={...job,status:'partial',ok:false,checkedAt:snapshot.checkedAt,
      issues:['Cópia anterior: cobertura e detalhes ainda não verificados.'],
      entries:job.entries.map(row=>{
        const result={...row,fetchedAt:job.at,sourceJob:key};
        if(row.type==='votacoes'){
          result.title=row.body||row.title;
          if(row.org==='camara')result.status=resultStatus(row.status==='Aprovado'?1:row.status==='Rejeitado'?0:null,row.body);
          result.ballotsState=row.secret?'secret':row.ballots?.length?'cached':'unverified';
          result.ballotsAt=job.at;
        }
        if(row.type==='agenda')result.agendaState=row.items?.length?'cached':'unverified';
        return result;
      })};
  }
  return migrated;
}
