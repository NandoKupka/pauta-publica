import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendar, parseFeed, official } from '../sources.mjs';
import { collectStf } from '../stf.mjs';
import { render } from '../view.mjs';

test('a agenda distingue Senado e Congresso e recompõe linhas dobradas', () => {
  const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261103T140000\r\nUID:120\r\nORGANIZER:CN\r\nSUMMARY:Sessão Conjunta às 14:00h.\r\nDESCRIPTION:Situação: Convocada\\n1. Projeto de\r\n  lei\\, em pauta\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const [event] = parseCalendar(ics);
  assert.equal(event.org,'congresso');
  assert.equal(event.time,'14:00');
  assert.equal(event.title,'Sessão Conjunta');
  assert.deepEqual(event.items,['Projeto de lei, em pauta']);
});

test('o feed aceita data do STJ e descarta links que não são oficiais', () => {
  const xml = '<rss><channel><item><title><![CDATA[STJ mantém decisão]]></title><link>https://www.stj.jus.br/noticia</link><pubDate>Sex, out 30 2026 16:51:00</pubDate></item><item><title>Falso</title><link>https://stj.jus.br.exemplo.com/</link><pubDate>2026-10-30T18:00:00Z</pubDate></item></channel></rss>';
  const records = parseFeed(xml,'stj');
  assert.equal(records.length,1);
  assert.equal(records[0].date,'2026-10-30');
  assert.equal(records[0].title,'STJ mantém decisão');
  assert.equal(official('javascript:alert(1)'), '');
});

test('o calendário do STF conserva sessões virtuais em curso e filtra sessões encerradas', async () => {
  const [event] = await collectStf('2026-11-03',async()=>({
    diasPresenciais:[],
    julgamentosVirtuais:[
      {dataInicial:'30/10/2026',dataFinal:'10/11/2026',qtdProcessosPlenario:'2'},
      {dataInicial:'28/10/2026',dataFinal:'02/11/2026',qtdProcessosPlenario:'1'}
    ]
  }));
  assert.equal(event.date,'2026-10-30');
  assert.equal(event.endDate,'2026-11-10');
});

const now = new Date('2026-11-03T08:00:00Z');
const testData = {jobs:{ test: {ok:true,at:now.toISOString(),entries:[
  {id:'a',org:'senado',type:'agenda',title:'Sessão de educação',date:'2026-11-04',status:'Convocada',url:'https://senado.leg.br/',items:['PL 99/2026 — merenda escolar']},
  {id:'b',org:'camara',type:'agenda',title:'Sessão da Câmara',date:'2026-11-04',status:'Convocada',url:'https://camara.leg.br/'},
  {id:'c',org:'stf',type:'noticias',title:'STF suspende decreto',date:'2026-11-02',status:'Notícia oficial',url:'https://stf.jus.br/'},
  {id:'d',org:'stf',type:'noticias',title:'STF divulga seminário',date:'2026-11-02',status:'Notícia oficial',url:'https://stf.jus.br/'}
]}}};

test('filtro compartilhável combina instituição, dia e busca sem acentos', () => {
  const html = render(testData,new URLSearchParams('orgao=senado&dia=2026-11-04&q=sessao+merenda'),now);
  assert.match(html,/Sessão de educação/);
  assert.match(html,/PL 99\/2026/);
  assert.doesNotMatch(html,/Sessão da Câmara/);
  assert.match(html,/1 registro em 4 de novembro/);
});

test('a aba de decisões não apresenta notícias institucionais como julgamentos', () => {
  const html = render(testData,new URLSearchParams('aba=decisoes'),now);
  assert.match(html,/Decisões noticiadas/);
  assert.match(html,/STF suspende decreto/);
  assert.doesNotMatch(html,/STF divulga seminário/);
});
