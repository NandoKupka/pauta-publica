import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed } from '../sources.mjs';
import { render } from '../view.mjs';

const now = new Date('2026-11-03T12:00:00Z');
const agenda = {id:'a',org:'stf',type:'agenda',date:'2026-11-04',title:'Julgamento',status:'Sessão presencial',url:'https://portal.stf.jus.br/'};
const snapshot = entries => ({jobs:{stfAgenda:{ok:true,at:now.toISOString(),entries}}});

test('escolher um dia mantém instituição e busca selecionadas',()=>{
  const html=render(snapshot([agenda]),new URLSearchParams('aba=agenda&orgao=stf&q=Julgamento'),now);
  assert.match(html,/href="[^"]*orgao=stf[^"]*q=Julgamento[^"]*dia=2026-11-04/);
});

test('o total de registros parlamentares não é rotulado como votos',()=>{
  const row={id:'v',org:'senado',type:'votacoes',date:'2026-11-02',title:'PL 1/2026',status:'Aprovado',url:'https://senado.leg.br/',ballots:[{name:'A',vote:'Sim'},{name:'B',vote:'Não Compareceu'}]};
  const html=render(snapshot([row]),new URLSearchParams('aba=votacoes'),now);
  assert.doesNotMatch(html,/Ver votos \(2\)/);
  assert.match(html,/1 voto/);
  assert.match(html,/1 outro registro/);
});

test('o identificador de notícia é estável se a ordem do feed muda',()=>{
  const item=(title,url)=>'<item><title>'+title+'</title><link>https://www.stj.jus.br/'+url+'</link><pubDate>2026-11-03T10:00:00Z</pubDate></item>';
  const a=item('Notícia A','a'),b=item('Notícia B','b');
  const first=parseFeed('<rss>'+a+b+'</rss>','stj');
  const second=parseFeed('<rss>'+b+a+'</rss>','stj');
  assert.equal(first[0].id,second[1].id);
});
test('uma fonte atualizada não esconde a data antiga da instituição selecionada',()=>{
  const data={jobs:{
    stfAgenda:{ok:false,status:'error',at:'2026-11-02T12:00:00Z',checkedAt:now.toISOString(),issues:['Falha de conexão.'],entries:[agenda]},
    camAgenda:{ok:true,status:'ready',at:now.toISOString(),entries:[]}
  }};
  const html=render(data,new URLSearchParams('aba=agenda&orgao=stf'),now);
  assert.ok(html.includes('1 fonte precisa de atenção'));
  assert.ok(html.includes('Cópia anterior'));
  assert.ok(html.includes('02/11/2026'));
  assert.ok(html.includes('Falha de conexão.'));
});
