import { day, shift, sources } from './sources.mjs';
import { jobs, jobHealth, ballotSummary, pautaHealth } from './data-quality.mjs';
import { pautaPath, topicTitle, topicThemes, searchText, upcomingRecords, primaryPautas, matchesSearch } from './pautas.mjs';
import { explanationFor } from './explanations.mjs';
import { stageSummary, kindGuide } from './reading.mjs';
const paths={
 mark:'<path d="M3 18h18M4 15h16M6 15V9m4 6V9m4 6V9m4 6V9M3 8l9-5 9 5H3Z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5h2m4 0h2"/>',
 check:'<path d="m9 11 3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 news:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8m-8 5h8m-8 5h5"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 external:'<path d="M13 5h6v6m0-6-9 9m7-1v6H5V7h6"/>',
 chevron:'<path d="m9 6 6 6-6 6"/>',
 search:'<circle cx="10.8" cy="10.8" r="5.8"/><path d="m15 15 4 4"/>',
 clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
 info:'<circle cx="12" cy="12" r="8"/><path d="M12 11v5m0-8h.01"/>',
 scale:'<path d="M12 3v17m-5 0h10M4 7h16M6 7l-4 8h8L6 7Zm12 0-4 8h8l-4-8Z"/>'
};
const icon=(name,size=18)=>`<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const normalize=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const tabs={pautas:['Pautas','news'],agenda:['Agenda','calendar'],votacoes:['Votações','check'],decisoes:['Decisões','scale'],noticias:['Notícias','news']};
const dt=(date,options)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',...options}).format(new Date(date+'T12:00:00Z')).replace(/\.$/,'');
const fullDate=date=>dt(date,{day:'numeric',month:'long',year:'numeric'});
const stamp=value=>value&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'Não disponível';
const clip=(value,n=200)=>value?.length>n?value.slice(0,n).replace(/\s+\S*$/,'')+'…':value;
const external=(url,label,cls='')=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ${icon('external',15)}<span class="sr"> (abre em outra aba)</span></a>`;
const current=value=>value?' aria-current="true"':'';
const political=org=>['camara','senado','congresso'].includes(org);
const isOpen=row=>!/cancelad|encerrad|realizad|transferid/i.test(row.status);
const ongoing=(row,today)=>row.endDate&&row.date<today&&row.endDate>=today;
const decisionHeadline=row=>/^(?:(?:a |o )?(?:stf|stj|tse|supremo(?: tribunal federal)?|plenário|[\p{L}]+ turma|ministro(?:\s+[\p{L}]+){0,4}))\s+(?:acolhe|anula|aprova|autoriza|concede|condena|confirma|declara|decide|defere|define|determina|derruba|extingue|fixa|garante|impede|indefere|invalida|julga|libera|mantém|nega|proíbe|reconhece|rejeita|restabelece|revoga|suspende|valida)\b/iu.test(row.title);
const query=values=>{
 const p=new URLSearchParams();
 for(const [k,v]of Object.entries(values))if(v!==''&&v!=null&&!(k==='semana'&&v===0))p.set(k,v);
 return '/'+(p.size?'?'+p:'')+'#painel';
};
const healthLabels={ready:'Consulta atualizada',partial:'Consulta parcial',error:'Falha na atualização',stale:'Dados desatualizados',unavailable:'Sem dados disponíveis'};
const numberLabel=(n,one,many)=>n+' '+(n===1?one:many);
function sourceDetails(keys,snapshot,now) {
 return keys.map(key=>{
  const meta=jobs[key],job=snapshot.jobs[key],health=jobHealth(job,now);
  return `<li><div class="source-title"><strong>${esc(meta.name.replace(' · ',' — '))}</strong><span class="health ${health}">${healthLabels[health]}</span></div><p>${esc(meta.scope)}</p><dl><div><dt>Dados consultados</dt><dd>${stamp(job?.at)}</dd></div><div><dt>Última tentativa</dt><dd>${stamp(job?.checkedAt||snapshot.checkedAt)}</dd></div></dl>${job?.issues?.length?`<p class="source-issue">${esc(job.issues.join(' '))}</p>`:''}</li>`;
 }).join('');
}
export function render(snapshot,params=new URLSearchParams(),now=new Date()) {
 const today=day(now),tab=Object.hasOwn(tabs,params.get('aba'))?params.get('aba'):params.has('dia')||params.has('semana')?'agenda':'pautas';
 const org=Object.hasOwn(sources,params.get('orgao'))?params.get('orgao'):'',search=(params.get('q')??'').trim().slice(0,120);
 const rawDate=params.get('dia'),date=tab==='agenda'&&/^\d{4}-\d{2}-\d{2}$/.test(rawDate??'')&&rawDate>=today&&rawDate<=shift(today,20)?rawDate:'';
 const week=Math.min(2,Math.max(0,Math.floor(Number(params.get('semana')))||0));
 const inAgenda=tab==='pautas'&&params.get('em')==='agenda';
 const values={aba:tab,orgao:org,q:search,dia:date,semana:week,em:inAgenda?'agenda':'',pagina:params.get('pagina')||''};
 const link=updates=>esc(query({...values,...(Object.keys(updates).length&&!Object.hasOwn(updates,'pagina')?{pagina:''}:{}),...updates}));
 const all=[...new Map(Object.entries(snapshot.jobs).flatMap(([key,job])=>(job.entries??[]).map(row=>({...row,sourceJob:row.sourceJob||key,fetchedAt:row.fetchedAt||job.at}))).filter(row=>row.date&&sources[row.org]).map(row=>[row.id,row])).values()];
 if(tab==='pautas')for(const p of primaryPautas(snapshot)){
  const next=upcomingRecords(p,snapshot,today)[0];
  all.push({id:p.id,org:p.org,type:'pautas',title:topicTitle(p),date:next?.date||p.details?.history?.[0]?.date||p.lastSeen.slice(0,10),pauta:p,next});
 }
 const words=normalize(search).split(/\s+/).filter(Boolean);
 const scopeMatches=row=>(!org||row.org===org||row.pauta?.orgs?.includes(org))&&matchesSearch([row.title,row.body,row.context,row.reference,row.items?.join(' '),sources[row.org].name,sources[row.org].short,row.decisionMaker,row.pauta?searchText(row.pauta):'',...(row.subjects??[]).map(p=>searchText(snapshot.pautas?.[p.id]||p))].join(' '),words);
 const agenda=all.filter(row=>row.type==='agenda'&&(row.endDate||row.date)>=today&&row.date<=shift(today,20)&&scopeMatches(row));
 const relevant=Object.keys(jobs).filter(key=>(jobs[key].tabs.includes(tab)||tab==='pautas'&&jobs[key].tabs.some(t=>['agenda','votacoes'].includes(t)))&&(!org||jobs[key].orgs.includes(org)));
 const filtered=all.filter(row=>{
  if(!scopeMatches(row)||(tab==='decisoes'?row.type!=='noticias'||!decisionHeadline(row):row.type!==tab))return false;
  if(tab==='pautas')return !inAgenda||row.next;
  return tab!=='agenda'||(agenda.includes(row)&&(!date||row.date<=date&&(row.endDate||row.date)>=date));
 }).sort((a,b)=>tab==='pautas'?Number(!!b.next)-Number(!!a.next)||(a.next&&b.next?a.date.localeCompare(b.date)||(a.next.time??'').localeCompare(b.next.time??''):b.date.localeCompare(a.date))||a.id.localeCompare(b.id):tab==='agenda'?
  Number(!!ongoing(b,today))-Number(!!ongoing(a,today))||a.date.localeCompare(b.date)||(a.time??'').localeCompare(b.time??''):
  b.date.localeCompare(a.date)||(b.registeredAt??'').localeCompare(a.registeredAt??''));
 const size=12,pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.max(1,Math.min(pages,Math.floor(Number(params.get('pagina')))||1));
 const rows=filtered.slice((page-1)*size,page*size);
 const needsAttention=relevant.filter(key=>jobHealth(snapshot.jobs[key],now)!=='ready');
 const title=tab==='pautas'?'Entenda cada pauta'+(org?' — '+sources[org].short:''):tab==='agenda'?'Agenda'+(org?' — '+sources[org].short:' federal'):tab==='votacoes'?'Resultados de votação':tab==='decisoes'?'Decisões noticiadas':'Notícias oficiais';
 const days=Array.from({length:7},(_,i)=>shift(today,week*7+i));
 const totalToday=agenda.filter(row=>isOpen(row)&&row.date<=today&&(row.endDate||row.date)>=today).length;
 let group='';
 const records=rows.map(row=>{
  if(row.pauta)return renderPautaCard(row,query(values),today,now);
  const key=tab==='agenda'&&ongoing(row,today)?'Em andamento':row.date;
  const label=key==='Em andamento'?key:(row.date===today?'Hoje, ':'')+dt(row.date,{day:'numeric',month:'long'});
  const separator=key!==group?`<li class="day-heading"><h3>${esc(label)}</h3></li>`:'';
  group=key;
  return separator+renderRow(row,today,snapshot,now,query(values));
 }).join('');
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Agenda, votações e decisões federais, com fontes e cobertura transparentes."><title>${esc(title)} | Pauta Pública</title><link rel="icon" href="/marca.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><script type="module" src="/client.js"></script></head><body>
 <a class="skip" href="#painel">Pular para o painel</a>
 <header class="top"><div class="wrap top-inner"><a class="brand" href="/"><span class="brand-icon">${icon('mark',24)}</span><span>Pauta Pública<small>Informação para acompanhar o poder</small></span></a><nav aria-label="Navegação principal"><a href="${link({})}">Painel</a><a href="#fontes">Fontes e cobertura</a></nav><span class="country">${icon('clock',16)} Horário de Brasília</span></div></header>
 <main class="wrap">
  <div class="intro"><div><span class="intro-label">Câmara · Senado · Congresso · STF · STJ · TSE</span><h1>O que está em decisão.<br>O que pode mudar para você.</h1><p>Entenda as pautas, acompanhe as etapas e confira quem decide.</p></div><div class="today"><strong>${dt(today,{day:'2-digit',month:'long'})}</strong><span>${dt(today,{weekday:'long',year:'numeric'})}</span></div></div>
  <div class="workspace">
   <aside class="institutions" aria-labelledby="instituicoes-titulo"><h2 id="instituicoes-titulo">Instituições</h2><nav class="directory" aria-label="Filtrar por instituição"><a class="all-orgs" href="${link({orgao:'',dia:''})}"${current(!org)}>${icon('mark',19)}<span><strong>Visão geral</strong><small>Todas as instituições</small></span></a>
    ${Object.entries(sources).map(([key,s])=>`<a href="${link({aba:tab==='pautas'?'pautas':political(key)?(tab==='votacoes'?tab:'agenda'):key==='stf'&&tab==='agenda'?'agenda':tab==='decisoes'?'decisoes':'noticias',orgao:key,dia:''})}"${current(key===org)}>${icon(political(key)?'mark':'scale',19)}<span><strong>${s.short}</strong><small>${s.label}</small></span></a>`).join('')}
   </nav><div class="rail-note">${icon('info',20)}<p>Um resultado pode ser uma etapa da tramitação. O registro oficial esclarece o que foi decidido.</p></div></aside>
   <section class="panel" id="painel" aria-labelledby="painel-titulo">
    <nav class="tabs" aria-label="Tipo de registro">${Object.entries(tabs).map(([key,[name,ico]])=>`<a class="${key===tab?'active':''}" href="${link({aba:key,dia:''})}"${current(key===tab)}>${icon(ico,18)} ${name}</a>`).join('')}</nav>
    <div class="panel-heading"><div><h2 id="painel-titulo" tabindex="-1">${esc(title)}</h2><p>${tab==='pautas'?'Comece pelo assunto. Abra uma pauta para entender o que está em jogo.':tab==='agenda'?'O que está previsto e o que já está em andamento.':tab==='votacoes'?'O resultado de cada ato e os registros individuais disponíveis.':tab==='decisoes'?'Seleção pelo título das notícias. A data é a da publicação.':'Publicações dos canais oficiais das instituições.'}</p></div>${tab==='agenda'?`<span class="count-pill">${totalToday} sessões hoje</span>`:''}</div>
    <form class="filters" action="/#painel" method="get"><input type="hidden" name="aba" value="${tab}">${inAgenda?'<input type="hidden" name="em" value="agenda">':''}${date?`<input type="hidden" name="dia" value="${date}">`:''}<input type="hidden" name="semana" value="${week}">
     <label class="search"><span class="sr">Buscar assunto</span>${icon('search',20)}<input type="search" name="q" maxlength="120" value="${esc(search)}" placeholder="Busque um assunto, projeto ou processo"></label>
     <label class="select"><span class="sr">Filtrar por instituição</span><select name="orgao"><option value="">Todas as instituições</option>${Object.entries(sources).map(([key,s])=>`<option value="${key}"${key===org?' selected':''}>${s.short}</option>`).join('')}</select></label><button type="submit">Buscar</button>
    </form>
    ${tab==='pautas'&&!search?`<nav class="topic-shortcuts" aria-label="Explorar assuntos"><span>Explore</span>${['Saúde','Trabalho e renda','Segurança e justiça','Apostas e loterias'].map(theme=>`<a href="${link({q:theme,pagina:''})}">${esc(theme)}</a>`).join('')}</nav>`:''}
    ${tab==='agenda'?`<section class="calendar" aria-label="Selecionar data"><div class="calendar-top"><span>${dt(days[0],{day:'numeric',month:'short'})} a ${dt(days[6],{day:'numeric',month:'short'})} <small>— sessões encontradas</small></span><nav aria-label="Semanas">${week>0?`<a href="${link({semana:week-1,dia:''})}" aria-label="Semana anterior">‹</a>`:''}${week<2?`<a href="${link({semana:week+1,dia:''})}" aria-label="Próxima semana">›</a>`:''}</nav></div><div class="week-days">${days.map(d=>{
      const count=agenda.filter(row=>isOpen(row)&&row.date<=d&&(row.endDate||row.date)>=d).length;
      return `<a href="${link({dia:d})}" class="week-day${date===d?' selected':''}${today===d?' today-day':''}" aria-label="${esc(fullDate(d))}, ${count} sessões"${current(date===d)}><span>${dt(d,{weekday:'short'})}</span><strong>${d.slice(-2)}</strong><small>${count}<span> ${count===1?'sessão':'sessões'}</span></small></a>`;
    }).join('')}</div></section>`:''}
    ${relevant.length?`<details class="freshness ${needsAttention.length?'attention':'healthy'}"><summary><span>${icon(needsAttention.length?'info':'check',18)} ${needsAttention.length?numberLabel(needsAttention.length,'fonte precisa de atenção','fontes precisam de atenção'):tab==='pautas'?'Fontes da agenda atualizadas':'Consultas atualizadas'}<small>${needsAttention.length?'Confira a idade dos dados antes de acompanhar a pauta.':'A cobertura varia por instituição.'}</small></span><span class="summary-action">Ver detalhes ${icon('chevron',15)}</span></summary><ul class="source-list">${sourceDetails(relevant,snapshot,now)}</ul></details>`:''}
    ${tab==='pautas'?`<div class="pauta-tools"><nav aria-label="Situação das pautas"><a href="${link({em:'',pagina:''})}"${current(!inAgenda)}>Todas as pautas</a><a href="${link({em:'agenda',pagina:''})}"${current(inAgenda)}>Na agenda</a></nav>${org==='stj'||org==='tse'?'<p>Esta instituição tem apenas notícias nesta versão.</p>':''}</div>`:''}
    <div class="list-top"><span>${numberLabel(filtered.length,tab==='pautas'?'pauta':'registro',tab==='pautas'?'pautas':'registros')}${date?' em '+esc(dt(date,{day:'numeric',month:'long'})):''}</span>${search||org||date?`<a href="${link({orgao:'',q:'',dia:''})}">Limpar filtros</a>`:`<span>${tab==='pautas'?'Na agenda primeiro':tab==='agenda'?'Próximos 21 dias':'Mais recentes primeiro'}</span>`}</div>
    ${rows.length?`<ol class="records${tab==='pautas'?' pauta-grid':''}">${records}</ol>`:`<div class="empty">${icon(tabs[tab][1],32)}<h3>${relevant.length?'Nenhum registro encontrado':'Esta seção ainda não cobre '+esc(sources[org]?.short??'a instituição')}</h3><p>${!relevant.length?'Veja as notícias ou consulte diretamente a instituição.':needsAttention.length?'Uma consulta está indisponível ou incompleta. Confira os detalhes da fonte acima.':'Tente outro assunto, instituição ou data.'}</p>${org?external(sources[org].url,'Consultar fonte oficial'):''}</div>`}
    ${pages>1?`<nav class="pagination" aria-label="Páginas de resultados">${page>1?`<a href="${link({pagina:page-1})}">Anterior</a>`:''}<span>Página ${page} de ${pages}</span>${page<pages?`<a href="${link({pagina:page+1})}">Próxima ${icon('arrow',16)}</a>`:''}</nav>`:''}
   </section>
  </div>
  <section class="sources-section" id="fontes" aria-labelledby="fontes-titulo"><div><h2 id="fontes-titulo">Fontes e cobertura</h2><p>Consulte o alcance e o horário de cada fonte. Pautas podem mudar; notícias não substituem o processo ou a ata.</p></div><details><summary>Ver as 8 consultas oficiais ${icon('chevron',16)}</summary><ul class="source-list">${sourceDetails(Object.keys(jobs),snapshot,now)}</ul><div class="source-links">${Object.values(sources).map(s=>external(s.url,s.short)).join('')}</div></details></section>
 </main><footer class="wrap footer"><span>Pauta Pública</span><p>Projeto independente de acompanhamento cívico.</p><span>Fontes oficiais, contexto transparente.</span></footer></body></html>`;
}
function renderPautaCard(row,returnTo,today,now){
 const p=row.pauta,href=esc(pautaPath(p.id)+'?retorno='+encodeURIComponent(returnTo));
 const health=pautaHealth(p,now),explanation=/transformad[oa] em norma/i.test(p.details?.status||'')?null:explanationFor(p),state=stageSummary(p),kind=kindGuide(p);
 const title=topicTitle(p),subject=title===p.reference?'Contexto ainda não disponível':clip(title,160);
 return `<li class="pauta-card"><article><div class="meta"><span>${sources[p.org].short}</span><span class="pauta-reference">${esc(p.reference)}</span>${row.next?'<span class="status positive">Na agenda</span>':''}${health!=='ready'?`<span class="stale-label">${health==='stale'?'Detalhes antigos':'Detalhes incompletos'}</span>`:''}</div><h3><a href="${href}">${esc(subject)}</a></h3>${explanation?`<p class="card-explanation">${esc(clip(explanation.text,220))}</p><span class="card-method">Resumo com auxílio de IA · fonte na pauta</span>`:''}<p class="pauta-stage"><span>${esc(kind.label)}</span> · ${esc(state.label)}</p>${row.next?`<p class="pauta-next">${icon('calendar',16)}<span><strong>${row.next.date===today?'Hoje':esc(fullDate(row.next.date))}${row.next.time?' · '+esc(row.next.time):''}</strong><span>${esc(row.next.body||row.next.decisionMaker||sources[row.next.org].short)}</span></span></p>`:'<p class="no-session">Próxima sessão não encontrada na coleta.</p>'}<div class="pauta-card-bottom"><div class="topic-tags">${topicThemes(p).slice(0,1).map(theme=>`<span>${esc(theme)}</span>`).join('')}</div><a class="pauta-cta" href="${href}">Entender pauta ${icon('arrow',17)}</a></div></article></li>`;
}

function renderRow(row,today,snapshot,now,returnTo){
 const s=sources[row.org],agenda=row.type==='agenda',news=row.type==='noticias',active=ongoing(row,today);
 const status=active?'Em andamento':row.status;
 const quality=jobHealth(snapshot.jobs[row.sourceJob],now),stale=quality==='error'||quality==='stale'||quality==='unavailable';
 const headline=agenda&&row.org==='camara'&&row.body?row.body:row.title;
 const supporting=agenda&&row.org==='camara'?row.title:row.body&&row.body!==row.title?row.body:'';
 const records=ballotSummary(row.ballots);
 const label=agenda?(row.agendaState==='unsupported'?'Sobre esta sessão':row.items?.length?'Ver pauta ('+row.items.length+')':'Detalhes da pauta'):row.ballots?.length?'Ver registros individuais':'Ver resultado';
 return `<li class="record"><div class="datebox"><time datetime="${esc(row.date)}" aria-label="${esc(fullDate(row.date))}"><strong>${row.date.slice(-2)}</strong><span>${dt(row.date,{month:'short'})}</span></time>${row.time?`<span class="time">${esc(row.time)}</span>`:''}</div><article>
 <div class="meta"><span>${s.short}</span><span class="status ${/rejeitad|não aprovado/i.test(status)?'negative':/aprovado|em andamento/i.test(status)?'positive':''}">${esc(status)}</span>${stale?'<span class="stale-label">Cópia anterior</span>':''}</div>
 <h4>${news?external(row.url,esc(row.title),'news-link'):esc(clip(headline,230))}</h4>
 ${supporting?`<p class="row-body">${esc(clip(supporting,240))}</p>`:''}
 ${!news?`<p class="row-details">${esc(row.decisionMaker||s.power)}${row.reference?' — '+esc(row.reference):''}${row.endDate?' — até '+esc(dt(row.endDate,{day:'numeric',month:'short'})):''}</p>`:''}
 ${row.collectionIssue?`<p class="inline-warning">${icon('info',15)} ${esc(row.collectionIssue)}</p>`:''}
 ${news?`<p class="record-freshness">Consultado em ${stamp(row.fetchedAt)}</p>`:`<details class="disclosure"><summary><span>${label} ${icon('chevron',15)}</span>${!agenda&&row.ballots?.length?`<small>${numberLabel(records.votes,'voto','votos')} e ${numberLabel(records.other,'outro registro','outros registros')}</small>`:''}</summary><div class="detail-body">
 ${agenda?renderAgenda(row,returnTo):renderBallots(row,returnTo)}
 <div class="detail-footer"><span>Consultado em ${stamp(row.fetchedAt)}</span>${external(row.url,agenda?'Abrir agenda oficial':'Consultar registro oficial')}${row.eventUrl?external(row.eventUrl,'Sessão na Câmara'):''}</div>
 </div></details>`}
 </article></li>`;
}
function renderAgenda(row,returnTo){
 const warning=row.agendaState==='cached'?`<p class="inline-warning">Pauta preservada de ${stamp(row.agendaAt)}. A atualização dos itens falhou.</p>`:'';
 if(row.agendaState==='unsupported')return `<p>${esc(row.agendaNote)}</p>`;
 if(row.items?.length)return warning+`<ol class="agenda-items">${row.items.map((item,i)=>`<li>${row.itemPautaIds?.[i]?`<a class="pauta-item" href="${esc(pautaPath(row.itemPautaIds[i])+'?retorno='+encodeURIComponent(returnTo))}">${esc(item)}<span>Entender esta pauta ${icon('arrow',15)}</span></a>`:esc(item)}</li>`).join('')}</ol>`;
 return `<p>${row.agendaState==='error'?'Não foi possível consultar os itens desta pauta. A ausência da lista não significa que a sessão esteja sem assuntos.':row.agendaState==='unverified'?'Os detalhes desta cópia ainda não foram verificados.':'A consulta oficial não retornou itens de pauta para esta sessão.'}</p>`;
}
function renderBallots(row,returnTo='/?aba=votacoes#painel'){
 const intro=`${row.subjects?.length?`<div class="related-pautas">${row.subjects.map(p=>`<a href="${esc(pautaPath(p.id)+'?retorno='+encodeURIComponent(returnTo))}">Entender ${esc(p.reference)} ${icon('arrow',15)}</a>`).join('')}</div>`:''}<p class="official-description">${esc(row.body||row.title)}</p>${row.related?.length?`<p>Propostas afetadas por este ato: ${row.related.map(item=>external(item.url.replace(/^https:\/\/dadosabertos\.camara\.leg\.br\/api\/v2\/proposicoes\/(\d+)$/,'https://www.camara.leg.br/propostas-legislativas/$1'),esc(item.title))).join(', ')}.</p>`:''}${row.context?`<p>${esc(row.context)}</p>`:''}${row.voteKind?`<p>Método: <strong>${esc(row.voteKind)}</strong>.</p>`:''}`;
 if(!row.ballots?.length){
  const text=row.secret||row.ballotsState==='secret'?'Votação secreta: os votos individuais não são exibidos.':row.ballotsState==='error'?'A consulta aos registros individuais falhou. Não é possível afirmar que eles não existem.':row.ballotsState==='unverified'?'Esta cópia ainda não permite confirmar os registros individuais.':'A resposta oficial não trouxe registros individuais. Isso, por si só, não identifica o método da votação.';
  return intro+`<p>${text}</p>`;
 }
 const summary=ballotSummary(row.ballots);
 return intro+`${row.ballotsState==='cached'?`<p class="inline-warning">Registros preservados de ${stamp(row.ballotsAt)}; a última consulta falhou.</p>`:''}
 <div class="tally">${Object.entries(summary.totals).map(([vote,n])=>`<span><strong>${n}</strong> ${vote}</span>`).join('')}<span class="other"><strong>${summary.other}</strong> Outros registros</span></div>
 <p class="ballot-note">Contagem dos registros publicados. Ausências, licenças, presidência e obstrução ficam em “Outros registros”. Esta contagem não determina quórum ou aprovação.</p>
 <label class="ballot-search" hidden>Buscar parlamentar<input type="search" placeholder="Nome, partido ou UF"></label><p class="ballot-count sr" aria-live="polite"></p>
 <div class="ballot-table" tabindex="0" role="region" aria-label="Registros individuais de parlamentares"><table><caption class="sr">Votos e outros registros individuais</caption><thead><tr><th scope="col">Parlamentar</th><th scope="col">Partido / UF</th><th scope="col">Registro</th></tr></thead><tbody>${row.ballots.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(b=>`<tr><th scope="row">${esc(b.name)}</th><td>${esc([b.party,b.state].filter(Boolean).join(' / '))}</td><td>${esc(b.vote)}</td></tr>`).join('')}</tbody></table></div><p>Registros consultados em ${stamp(row.ballotsAt||row.fetchedAt)}. ${external(row.votesUrl||row.url,'Ver dados oficiais')}</p>`;
}


export { icon, esc, external, fullDate, stamp, clip, renderBallots };
