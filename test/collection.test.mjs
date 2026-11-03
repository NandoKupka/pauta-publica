import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allCamPages, collectSnapshot, createCollectors } from '../collect.mjs';
import { resultStatus, ballotSummary, jobHealth } from '../data-quality.mjs';
const now=new Date('2026-11-03T12:00:00Z');
const at=now.toISOString();
const empty={version:2,jobs:{}};

test('não aprovado não implica rejeição; resultado desconhecido permanece desconhecido',()=>{
  assert.equal(resultStatus(0,'Não houve quórum para deliberação.'),'Não aprovado');
  assert.equal(resultStatus(0,'Rejeitado o requerimento.'),'Rejeitado');
  assert.equal(resultStatus(null,'Mantido o texto.'),'Resultado publicado');
});
test('ausência, licença, presidência e obstrução ficam fora dos totais Sim/Não/Abstenção',()=>{
  const result=ballotSummary(['Sim','Não','Abstenção','Não Compareceu','Licença saúde','Presidente (art. 51 RISF)','Obstrução'].map(vote=>({vote})));
  assert.equal(result.votes,3);assert.equal(result.other,4);
});
test('paginação coleta todas as páginas, inclusive resultados além da primeira amostra',async()=>{
  const first='https://dadosabertos.camara.leg.br/api/v2/votacoes?pagina=1';
  const rows=await allCamPages(first,async url=>url===first?{dados:[{id:'1'}],links:[{rel:'next',href:first.replace('1','2')}]}:{dados:[{id:'2'}]});
  assert.deepEqual(rows.map(r=>r.id),['1','2']);
  await assert.rejects(allCamPages(first,async()=>({dados:[],links:[{rel:'next',href:first}]})),/Paginação/);
});
test('falha de paginação preserva a lista anterior e sua data, sem fingir sucesso',async()=>{
  const previous={jobs:{camVotes:{at:'2026-11-02T12:00:00Z',entries:[{id:'old',title:'Registro anterior'}]}}};
  const result=await collectSnapshot(previous,{now,collectors:{camVotes:async()=>{throw new Error('fetch failed');}}});
  assert.equal(result.jobs.camVotes.status,'error');
  assert.equal(result.jobs.camVotes.at,previous.jobs.camVotes.at);
  assert.equal(result.jobs.camVotes.checkedAt,at);
  assert.deepEqual(result.jobs.camVotes.entries,previous.jobs.camVotes.entries);
});
test('falha nos votos é sinalizada e conserva registros anteriores, sem associar um ID inventado à proposta',async()=>{
  const previous={jobs:{camVotes:{entries:[{id:'camara-voto-123-1',ballots:[{name:'A',vote:'Sim'}],ballotsAt:'2026-11-02T12:00:00Z'}]}}};
  const mock=async url=>{
    if(url.includes('?'))return {dados:[{id:'123-1',data:'2026-11-02',descricao:'Rejeitado o Requerimento.',aprovacao:0}]};
    if(url.endsWith('/votos'))throw new Error('fetch failed');
    return {dados:{proposicoesAfetadas:[]}};
  };
  const rows=await createCollectors(mock).camVotes('2026-11-03',previous,at);
  assert.equal(rows[0].title,'Rejeitado o Requerimento.');
  assert.equal(rows[0].ballotsState,'cached');
  assert.equal(rows[0].ballots[0].name,'A');
  assert.equal(rows[0].ballotsAt,'2026-11-02T12:00:00Z');
  const result=await collectSnapshot(empty,{now,collectors:{camVotes:async()=>rows}});
  assert.equal(result.jobs.camVotes.status,'partial');
  assert.equal(result.jobs.camVotes.ok,false);
});
test('resposta vazia de votos é diferente de consulta que falhou',async()=>{
  const get=async url=>url.includes('?')?{dados:[{id:'123-1',data:'2026-11-02',descricao:'Resultado publicado',aprovacao:null}]}:url.endsWith('/votos')?{dados:[]}:{dados:{}};
  const [row]=await createCollectors(get).camVotes('2026-11-03',empty,at);
  assert.equal(row.ballotsState,'unpublished');
  assert.equal(row.status,'Resultado publicado');
});
test('a pauta inteira é preservada, sem truncar em oito itens',async()=>{
  const get=async url=>url.includes('?')?{dados:[{id:1,dataHoraInicio:'2026-11-04T14:00',descricaoTipo:'Reunião Deliberativa',descricao:'Pauta'}]}:
    {dados:Array.from({length:19},(_,i)=>({titulo:'Item '+i}))};
  const [row]=await createCollectors(get).camAgenda('2026-11-03',empty,at);
  assert.equal(row.items.length,19);
});
test('fonte com dados antigos fica desatualizada mesmo após antiga coleta bem-sucedida',()=>{
  assert.equal(jobHealth({at:'2026-11-03T08:00:00Z',status:'ready',ok:true},now),'stale');
});
test('resposta vazia da pauta do Senado é distinta de erro na conexão',async()=>{
  const ics='BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:1\nORGANIZER:SF\nDTSTART:20261104T140000\nSUMMARY:Sessão deliberativa\nEND:VEVENT\nEND:VCALENDAR';
  const get=async url=>url.endsWith('/iCal')?ics:null;
  const [row]=await createCollectors(get).senAgenda('2026-11-03',empty,at);
  assert.equal(row.agendaState,'unpublished');
  assert.equal(row.collectionIssue,undefined);
});
