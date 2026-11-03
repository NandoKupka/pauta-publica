import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash as nativeHash } from 'node:crypto';
import { createHash } from '../pages/crypto.mjs';
import { publicPath, withBase, normalizeBase, localReturn } from '../pages/paths.mjs';
import { panelSnapshot } from '../pages/data.mjs';
import { publicDocument, buildPages } from '../build-pages.mjs';
import { render } from '../view.mjs';
const now=new Date('2026-11-03T12:00:00Z');

test('hashes do navegador preservam identificadores e resumos vinculados ao texto oficial',()=>{
  for(const text of ['', 'áéç 🗳️',JSON.stringify({tema:'Constituição',number:42}), 'a'.repeat(200000)]){
    assert.equal(createHash('sha256').update(text).digest('hex'),nativeHash('sha256').update(text).digest('hex'));
  }
});
test('rotas e recursos funcionam no subdiretório do Pages, sem alterar fontes externas',()=>{
  assert.equal(publicPath('/pauta/stf-adpf-1212?retorno=%2F%3Fq%3Dbet','/pauta-publica/'),'/pauta-publica/pauta/stf-adpf-1212/?retorno=%2F%3Fq%3Dbet');
  assert.equal(withBase('<a href="https://www.camara.leg.br/">Fonte</a><form action="/#painel"></form><img src="/marca.svg">','/pauta-publica/'),'<a href="https://www.camara.leg.br/">Fonte</a><form action="/pauta-publica/#painel"></form><img src="/pauta-publica/marca.svg">');
  assert.throws(()=>normalizeBase('//evil.example/'));assert.throws(()=>normalizeBase('/../'));
  assert.equal(localReturn('https://evil.example/'),null);assert.equal(localReturn('/?q=bet'), '/?q=bet#painel');
});
test('exportação preserva filtros e dados de busca sem enviar todo o histórico ao navegador',()=>{
  const snapshot={version:2,checkedAt:now.toISOString(),jobs:{camAgenda:{at:now.toISOString(),ok:true,entries:[]}},pautas:{'camara-1':{id:'camara-1',org:'camara',provider:'camara',reference:'PL 1/2026',summary:'Regras para loterias',lastSeen:now.toISOString(),changes:[{privateField:'history'}],details:{at:now.toISOString(),quality:'ready',summary:'Regras para loterias',keywords:'loteria',history:[{date:'2026-11-01',body:'Histórico extenso'},{date:'2026-10-01'}]}}}};
  const compact=panelSnapshot(snapshot);
  assert.deepEqual(compact.pautas['camara-1'].details.history,[{date:'2026-11-01'}]);
  assert.equal(compact.pautas['camara-1'].changes,undefined);
  const params=new URLSearchParams('aba=pautas&q=bet');
  assert.equal(render(compact,params,now),render(snapshot,params,now));
});
test('HTML público inclui proteção, caminhos corretos e explicação para filtros sem JavaScript',()=>{
  const html=publicDocument('<html><head><script type="module" src="/client.js"></script></head><body><main></main><footer></footer></body></html>',{base:'/pauta-publica/',route:'panel',builtAt:now.toISOString(),dataPath:'/pauta-publica/panel-x.json'});
  assert.match(html,/src="\/pauta-publica\/pages.js"/);assert.ok(!html.includes('src="/client.js"'));
  assert.match(html,/Content-Security-Policy/);assert.match(html,/<noscript>/);assert.match(html,/Edição publicada/);
});
test('geração estática recusa apagar saída fora das pastas reservadas do projeto',async()=>{
  await assert.rejects(buildPages({snapshot:{jobs:{x:{}}},outDir:process.cwd()}),/saída deve ser/);
});
