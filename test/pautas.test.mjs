import { test } from 'node:test';
import assert from 'node:assert/strict';
import { camSubject, senateSubject, stfSubject, syncPautas, relatedRecords, upcomingRecords, safeReturn, searchText, brief, nextStage, primaryPautas, matchesSearch } from '../pautas.mjs';
import { createCollectors } from '../collect.mjs';
import { hydratePauta, enrichPautas } from '../pauta-sources.mjs';
import { renderPauta, renderMissingPauta } from '../pauta-view.mjs';
import { render } from '../view.mjs';
import { official } from '../sources.mjs';
import { explanationFor } from '../explanations.mjs';

const at='2026-11-03T12:00:00.000Z',now=new Date(at),later='2026-11-03T12:30:00.000Z';
const subject=camSubject({id:123,siglaTipo:'PL',numero:1,ano:2026,ementa:'Define regras para loterias municipais.'});
const event={id:'event-1',sourceJob:'camAgenda',type:'agenda',org:'camara',date:'2026-11-04',time:'14:00',title:'Reunião deliberativa',body:'Comissão de Finanças',status:'Convocada',url:'https://www.camara.leg.br/evento-legislativo/1',subjects:[subject],items:['PL 1/2026'],itemPautaIds:[subject.id]};
const snapshot=(rows,checkedAt=at)=>({version:2,checkedAt,jobs:{camAgenda:{entries:rows,at:checkedAt,checkedAt,ok:true,status:'ready'}}});
const seeded=()=>syncPautas({jobs:{}},snapshot([event]));
const camMock=async url=>url.includes('/tramitacoes')?{dados:[{sequencia:1,dataHora:'2026-11-02T14:00',descricaoTramitacao:'Apresentação',despacho:'Proposta apresentada.'}]}:url.endsWith('/autores')?{dados:[{nome:'Autora A',proponente:1}]}:{dados:{id:123,siglaTipo:'PL',ementa:subject.summary,statusProposicao:{descricaoSituacao:'Aguardando Parecer',dataHora:'2026-11-02T14:00'}}};

test('identidade oficial separa propostas homônimas e preserva a classe exigida pelo STF',()=>{
  const senate=senateSubject({codMateria:'123',identificacao:'PL 1/2026'});
  assert.notEqual(subject.id,senate.id);assert.equal(camSubject({siglaTipo:'PL',numero:1,ano:2026}),null);
  assert.equal(stfSubject({classe:'Rcl',numero:'78354'}).apiClass,'Rcl');
  assert.equal(stfSubject({classe:'Rcl',numero:'78354'}).id,'stf-rcl-78354');
});
test('parecer da agenda abre o assunto relacionado, mantendo o documento e sem confundir recomendações com aprovação',async()=>{
  const get=async url=>url.includes('?')?{dados:[{id:1,dataHoraInicio:'2026-11-04T14:00',descricaoTipo:'Reunião Deliberativa'}]}:{dados:[
    {titulo:'PL 1/2026',proposicao_:{id:456,siglaTipo:'PRL',numero:1,ano:0,ementa:'Parecer pela aprovação.'},proposicaoRelacionada_:{id:123,siglaTipo:'PL',numero:1,ano:2026,ementa:subject.summary}}
  ]};
  const rows=await createCollectors(get).camAgenda('2026-11-03',{jobs:{}},at);
  assert.equal(rows[0].subjects[0].id,subject.id);assert.equal(rows[0].itemPautaIds[0],subject.id);
  assert.equal(rows[0].documents[0].parentId,subject.id);assert.equal(rows[0].documents[0].reference,'PRL 1');
  const s=syncPautas({jobs:{}},snapshot(rows));assert.equal(primaryPautas(s).length,1);
  const p=s.pautas[subject.id];const html=renderPauta(p,s,new URLSearchParams(),now);
  assert.match(html,/Pareceres e documentos relacionados \(1\)/);assert.match(html,/pauta\/camara-456/);
  assert.match(brief(s.pautas['camara-456']).lead,/não equivale/);
});
test('requerimento relacionado a outra proposta continua com identidade e efeito próprios',async()=>{
  const get=async url=>url.includes('?')?{dados:[{id:1,dataHoraInicio:'2026-11-04T14:00',descricaoTipo:'Reunião Deliberativa'}]}:{dados:[
    {proposicao_:{id:456,siglaTipo:'REQ',numero:2,ano:2026,ementa:'Pedido de audiência'},proposicaoRelacionada_:{id:123,siglaTipo:'PL',numero:1,ano:2026,ementa:subject.summary}}
  ]};
  const [row]=await createCollectors(get).camAgenda('2026-11-03',{jobs:{}},at);
  assert.equal(row.subjects[0].id,'camara-456');assert.deepEqual(row.documents,[]);
});
test('links e histórico local sobrevivem à saída da janela de agenda, sem fingir sessão futura',()=>{
  const first=seeded(),second=syncPautas(first,snapshot([],later)),p=second.pautas[subject.id];
  assert.equal(p.firstSeen,at);assert.equal(relatedRecords(p,second).length,1);
  assert.equal(upcomingRecords(p,second,'2026-11-03').length,0);
  assert.equal(relatedRecords(p,second)[0].current,false);
});
test('mudanças de horário são registradas uma vez; desaparecimento não é tratado como cancelamento',()=>{
  const first=seeded(),second=syncPautas(first,snapshot([{...event,time:'16:00'}],later));
  const third=syncPautas(second,snapshot([{...event,time:'16:00'}],'2026-11-03T13:00:00.000Z'));
  assert.equal(third.pautas[subject.id].changes.length,1);assert.match(third.pautas[subject.id].changes[0].after,/16:00/);
  const fourth=syncPautas(third,snapshot([{...event,subjects:[],items:[]}],'2026-11-03T13:30:00.000Z'));
  const p=fourth.pautas[subject.id];assert.match(p.changes.at(-1).after,/não confirma retirada/);
  assert.equal(relatedRecords(p,fourth).length,1);assert.equal(upcomingRecords(p,fourth,'2026-11-03').length,0);
});
test('histórico com falha mantém registros e data anteriores enquanto o texto pode atualizar',async()=>{
  const first=await hydratePauta(subject,camMock,at);
  const next=await hydratePauta(first,async url=>{if(url.includes('/tramitacoes'))throw new Error('HTTP 503');return camMock(url);},later);
  assert.equal(next.details.quality,'partial');assert.equal(next.details.history.length,1);
  assert.equal(next.details.parts.history.at,at);assert.equal(next.details.parts.history.checkedAt,later);
  assert.equal(next.details.parts.overview.at,later);
  const empty=await hydratePauta(next,async url=>url.includes('/tramitacoes')?{dados:[]}:camMock(url),later);
  assert.equal(empty.details.history.length,0);assert.equal(empty.details.quality,'ready');
});
test('histórico pagina sem exigir id por movimento e ordena registros do mesmo dia',async()=>{
  const p=await hydratePauta(subject,async url=>{
    if(url.endsWith('/tramitacoes'))return {dados:[{sequencia:1,dataHora:'2026-11-02T10:00'}],links:[{rel:'next',href:url+'?pagina=2'}]};
    if(url.includes('?pagina=2'))return {dados:[{sequencia:2,dataHora:'2026-11-02T15:00'}]};
    return camMock(url);
  },at);
  assert.deepEqual(p.details.history.map(h=>h.id),['cam-2','cam-1']);
});
test('vínculo do Senado usa o id de processo oficial e rejeita matéria divergente',async()=>{
  const p=senateSubject({codMateria:'55',identificacao:'PL 1/2026'}),calls=[];
  const get=async url=>{calls.push(url);return url.includes('/materia/')?{DetalheMateria:{Materia:{IdentificacaoMateria:{IdentificacaoProcesso:'900'}}}}:{id:900,codigoMateria:55,conteudo:{ementa:'Uma proposta'},situacaoAtual:'Em análise',autuacoes:[{informesLegislativos:[{id:1,data:'2026-11-01 10:00',descricao:'Recebido no Senado.'}]}]};};
  const data=await hydratePauta(p,get,at);assert.equal(data.processId,'900');assert.equal(data.details.history.length,1);assert.ok(calls.at(-1).endsWith('/processo/900'));
  const wrong=await hydratePauta({...p,details:undefined},async()=>({id:900,codigoMateria:56,conteudo:{}}),later);
  assert.equal(wrong.details.quality,'error');
});
test('mudança de identificação do tema invalida o cache de detalhes do STF',async()=>{
  const p=stfSubject({classe:'Rcl',numero:'1',idInformacaoPautaProcesso:'9'});let count=0;
  const get=async url=>{count++;const id=new URL(url).searchParams.get('id');assert.equal(new URL(url).searchParams.get('classe'),'Rcl');return [{incidentes:[{numero:'1',idInformacaoPautaProcesso:id,relator:'Ministro A'}],conteudo:{tema:'Contexto do processo.',tese:'Saber se a regra é válida.'}}];};
  const first=await hydratePauta(p,get,at);
  await enrichPautas({[p.id]:first},get,'2026-11-03T12:05:00.000Z');assert.equal(count,1);
  const second=await enrichPautas({[p.id]:{...first,themeId:'10'}},get,'2026-11-03T12:06:00.000Z');
  assert.equal(count,2);assert.match(second[p.id].details.parts.overview.url,/id=10/);
});
test('página explica as quatro perguntas e preserva acesso às fontes e aos filtros sem JavaScript',async()=>{
  const s=seeded(),p=await hydratePauta(s.pautas[subject.id],camMock,at);s.pautas[p.id]=p;
  const html=renderPauta(p,s,new URLSearchParams({retorno:'/?aba=pautas&q=bet&orgao=camara#painel'}),now);
  for(const heading of ['O que pode mudar','Quem decide','O que já aconteceu','Próximos passos'])assert.ok(html.includes(heading));
  assert.match(html,/id="proximos"/);assert.match(html,/Comissão de Finanças/);assert.match(html,/Autora A/);assert.match(html,/q=bet&amp;orgao=camara/);
  assert.match(html,/4 de novembro de 2026/);assert.match(html,/Ficha oficial da pauta/);
});
test('dados sem histórico ou próxima sessão deixam a lacuna explícita e escapam texto externo',()=>{
  const p={...subject,title:'<script>alert(1)</script>',firstSeen:at,lastSeen:at};
  const html=renderPauta(p,{jobs:{},pautas:{[p.id]:p}},new URLSearchParams(),now);
  assert.match(html,/Não há próxima sessão confirmada/);assert.match(html,/não significa que o assunto não tenha histórico/);
  assert.ok(!html.includes('<script>alert(1)</script>'));assert.match(html,/&lt;script&gt;/);
  assert.match(renderMissingPauta(),/Explorar pautas/);
});
test('busca encontra linguagem cotidiana e só apresenta as pautas no filtro de agenda',()=>{
  const s=seeded();assert.match(searchText(subject),/bets/);
  assert.equal(matchesSearch('Tratamento de diabetes',['bet']),false);
  assert.equal(matchesSearch('Regras especiais',['pec']),false);
  assert.equal(matchesSearch(searchText(subject),['bet']),true);
  const html=render(s,new URLSearchParams('aba=pautas&q=bet&orgao=camara&em=agenda'),now);
  assert.match(html,/pauta\/camara-123/);assert.match(html,/1 pauta/);
  const removed=syncPautas(s,snapshot([],later));
  assert.match(render(removed,new URLSearchParams('aba=pautas&em=agenda'),now),/Nenhum registro encontrado/);
  assert.match(render(removed,new URLSearchParams('aba=pautas'),now),/pauta\/camara-123/);
});
test('retorno não admite redirecionamento externo e links oficiais aceitam apenas domínios esperados',()=>{
  for(const value of ['https://evil.example/','//evil.example/','/\\evil.example/','javascript:alert(1)'])assert.equal(safeReturn(value),'/?aba=pautas#painel');
  assert.equal(safeReturn('/?q=saude'), '/?q=saude#painel');
  assert.equal(official('https://legis.senado.gov.br/documento/1'),'https://legis.senado.gov.br/documento/1');
  assert.equal(official('https://senado.gov.br.evil.example/'),'');
});
test('resumo não apresenta norma publicada como proposta pendente nem atribui decisão à casa errada',()=>{
  assert.match(brief({...subject,details:{status:'Transformado em Norma Jurídica',summary:'Texto original'}}).lead,/transformada em norma/);
  assert.equal(nextStage({...subject,details:{status:'Aguardando Apreciação pelo Senado Federal'}}).who,'Senado Federal');
  assert.equal(nextStage({...subject,details:{status:'Aguardando Sanção'}}).who,'Presidência da República');
  assert.equal(explanationFor({id:'stf-adpf-1212',details:{summary:'Texto oficial alterado'}}),null);
});
