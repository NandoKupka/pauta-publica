import { asList, shift, plain, sources } from './sources.mjs';
import { safeError } from './data-quality.mjs';
import { stfSubject } from './pautas.mjs';
const base = 'https://portal.stf.jus.br/pauta/services/calendario-service.asp?';
const iso = value => /^(\d{2})\/(\d{2})\/(\d{4})/.test(value ?? '') ? value.slice(0,10).split('/').reverse().join('-') : '';

export async function collectStf(today,get,previous=new Map(),at=new Date().toISOString()) {
  const end = shift(today,20);
  const months = [...new Set([today.slice(0,7),end.slice(0,7)])];
  const calendars = await Promise.all(months.map(async month=>{
    const [y,m] = month.split('-');
    const data = await get(base+'dados=calendarios&mes='+Number(m)+'&ano='+y,true);
    if (!Array.isArray(data.diasPresenciais) || !Array.isArray(data.julgamentosVirtuais)) throw new Error('Calendário STF em formato inesperado');
    return { month,data };
  }));
  const events = new Map();
  const days = [];
  for (const {month,data} of calendars) {
    for (const d of data.diasPresenciais) {
      const date = month+'-'+String(d).padStart(2,'0');
      if (date>=today && date<=end) days.push(date);
    }
    for (const v of data.julgamentosVirtuais) {
      const date = iso(v.dataInicial), endDate = iso(v.dataFinal);
      if (!date || !endDate || date>end || endDate<today) continue;
      for (const [group,key] of [['Plenário','qtdProcessosPlenario'],['Primeira Turma','qtdPrimeiraTurma'],['Segunda Turma','qtdSegundaTurma']]) {
        const n = Number(v[key]);
        if (!n) continue;
        const id = 'stf-virtual-'+date+'-'+key;
        events.set(id,{ id, org:'stf', type:'agenda', date, endDate, title:'Julgamento virtual '+(group==='Plenário'?'do ':'da ')+group, body:n+' '+(n===1?'processo na pauta oficial':'processos na pauta oficial'), status:'Sessão virtual', url:sources.stf.url, decisionMaker:'Ministros do STF ('+group+')',agendaState:'unsupported',agendaNote:'A lista de processos desta sessão virtual está disponível no portal do STF. A coleta local inclui somente o calendário e a quantidade de processos.' });
      }
    }
  }
  await Promise.all(days.map(async date=>{
    let detail,error;
    try {
      detail=await get(base+'dados=sessao-presencial&data='+date.split('-').reverse().join('/'),true);
      if(!Array.isArray(detail.colegiados))throw new Error('Sessão em formato inesperado');
    }catch(e){error=e;}
    if(error){
      const cached=[...previous.values()].filter(row=>row.date===date&&!row.endDate);
      for(const row of cached)events.set(row.id,{...row,agendaState:row.items?.length?'cached':'error',agendaAt:row.agendaAt||row.fetchedAt,collectionIssue:safeError(error)});
      if(cached.length)return;
    }
    let count = 0;
    for (const group of asList(detail?.colegiados)) {
      for (const session of asList(group.sessoes)) {
        const id = 'stf-presencial-'+session.id;
        const items = asList(session.incidentes).map(x=>[plain([x.classe,x.numero].filter(Boolean).join(' ')),plain(x.relator),plain(x.resumoTema)].filter(Boolean).join(' — ')).filter(Boolean);
        const subjects=asList(session.incidentes).map(stfSubject).filter(Boolean);
        events.set(id,{ id, org:'stf', type:'agenda', date, time:session.dataInicio?.slice(11,16), title:'Julgamento presencial: '+group.descricao, status:'Sessão presencial', url:sources.stf.url, items, subjects, itemPautaIds:asList(session.incidentes).map(x=>stfSubject(x)?.id||null), decisionMaker:'Ministros do STF ('+group.descricao+')',agendaState:items.length?'ready':'unpublished',agendaAt:at });
        count++;
      }
    }
    if (!count) {
      const id = 'stf-presencial-'+date;
      events.set(id,{id,org:'stf',type:'agenda',date,title:'Julgamento presencial',status:'Sessão presencial',url:sources.stf.url,agendaState:error?'error':'unpublished',agendaAt:error?null:at,...(error?{collectionIssue:safeError(error)}:{})});
    }
  }));
  return [...events.values()];
}
