import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stageSummary,kindGuide,decisionFor,milestoneTitle,nextGuidance,effectContext} from '../reading.mjs';
import {explanationFor} from '../explanations.mjs';
import {readFileSync} from 'node:fs';
import {render} from '../view.mjs';
const now=new Date('2026-11-03T12:00:00Z');

test('próximos passos respeitam a etapa atual e não inventam uma votação futura',()=>{
 const p=status=>({provider:'camara',kind:'PL',details:{status}});
 assert.match(nextGuidance(p('Aguardando Apreciação pelo Senado Federal'),{org:'camara'}).action,/Senado/);
 assert.match(nextGuidance(p('Transformado em Norma Jurídica'),{}).action,/publicação da norma/);
 assert.match(nextGuidance(p('Arquivada'),{}).action,/arquivamento/);
 assert.match(nextGuidance(p('Estado desconhecido')).watch,/não permite identificar/);
 assert.match(nextGuidance({kind:'REQ'},{}).watch,/pedido/);
 assert.match(nextGuidance({provider:'stf'},{}).watch,/adiado/);
 assert.match(effectContext({kind:'MPV'}),/antes da conclusão/);
 assert.match(effectContext({kind:'REQ'}),/Não aprova automaticamente/);
});

test('novo resumo e público afetado deixam de aparecer quando a ementa muda',()=>{
 const s=JSON.parse(readFileSync(new URL('../data/snapshot.json',import.meta.url),'utf8'));
 const p=s.pautas['camara-2602554'];
 assert.match(explanationFor(p).affected,/vendedores/);
 assert.equal(explanationFor({...p,details:{...p.details,summary:'Texto substituído'}}),null);
});

test('linguagem simples conserva o significado e a incerteza do registro oficial',()=>{
 const pauta=status=>({provider:'camara',kind:'PL',details:{status}});
 assert.match(stageSummary(pauta('Aguardando Parecer')).text,/não é a decisão final/);
 assert.match(stageSummary(pauta('Aguardando Deliberação')).label,/nesta etapa/);
 assert.equal(stageSummary(pauta('Aguardando Sanção')).original,'Aguardando Sanção');
 assert.equal(stageSummary(pauta('Situação desconhecida')).label,'Situação desconhecida');
 assert.match(stageSummary(pauta('')).label,/não informada/);
 assert.match(kindGuide({kind:'REQ'}).text,/não cria/);
 assert.match(kindGuide({kind:'PRL'}).text,/não significa aprovação final/);
 assert.match(kindGuide({kind:'MPV'}).text,/vigência/);
 assert.equal(milestoneTitle({title:'Abertura de Prazo',body:'Prazo para recurso'}),'Abertura de Prazo');
 assert.match(milestoneTitle({title:'Abertura de Prazo',body:'Prazo para emendas'}),/sugestões/);
});

test('quem decide usa a etapa atual e não confunde unidade administrativa ou parecer com votação',()=>{
 const p={provider:'camara',details:{status:'Aguardando Apreciação pelo Senado Federal',location:'Mesa Diretora'}};
 assert.equal(decisionFor(p,{org:'camara',body:'Comissão anterior'}),'Senado Federal');
 assert.equal(decisionFor({provider:'camara',details:{location:'Mesa Diretora'}}),'Colegiado ainda não identificado nesta coleta');
 assert.equal(decisionFor({provider:'camara'},{org:'camara',body:'Comissão de Saúde'}),'Comissão de Saúde');
 assert.equal(decisionFor({provider:'stf'},{org:'stf',body:'Julgamento presencial',decisionMaker:'Ministros do STF (Plenário)'}),'Ministros do STF (Plenário)');
});

test('entrada prioriza pautas, links antigos com dia mantêm agenda, e mudar filtros reinicia paginação sem apagar busca',()=>{
 const snapshot={jobs:{},pautas:{}};
 assert.match(render(snapshot,new URLSearchParams(),now),/<title>Entenda cada pauta/);
 assert.match(render(snapshot,new URLSearchParams('dia=2026-11-04'),now),/<title>Agenda federal/);
 const html=render(snapshot,new URLSearchParams('aba=pautas&q=saude&pagina=9'),now);
 const match=html.match(/<nav class="directory"[\s\S]*?<\/nav>/)[0];
 assert.match(match,/orgao=senado&amp;q=saude/);
 assert.doesNotMatch(match,/pagina=9/);
 assert.match(html,/aba=agenda/);
});
