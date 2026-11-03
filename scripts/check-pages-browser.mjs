import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base=process.env.PAGES_TEST_URL||'http://127.0.0.1:4184/pauta-publica/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/google-chrome'),headless:true});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewport({width:1366,height:900});
  // The static HTML appears before the public data index finishes loading.
  await page.goto(base,{waitUntil:'networkidle0'});
  await page.waitForSelector('.pauta-grid .pauta-card');
  assert.match(await page.title(),/Entenda cada pauta/);
  await page.click('.topic-shortcuts a');
  assert.equal(await page.$eval('input[name=q]',node=>node.value),'Saúde');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'painel-titulo');
  await page.click('.directory a[href*="orgao=senado"]');
  assert.equal(await page.$eval('input[name=q]',node=>node.value),'Saúde');
  assert.match(page.url(),/orgao=senado/);
  await page.goto(base+'?orgao=senado#painel');
  await page.waitForSelector('.directory a[aria-current]');
  await page.waitForFunction(()=>document.querySelector('#painel-titulo')?.textContent.includes('Senado'));
  assert.match(await page.title(),/Senado/);
  await page.click('.tabs a[href*="aba=pautas"]');
  assert.match(page.url(),/aba=pautas/);
  await page.type('input[name=q]','seguranca');
  await page.click('.filters button');
  await page.waitForFunction(()=>location.search.includes('q=seguranca'));
  assert.ok(await page.$('.pauta-card'));
  await Promise.all([page.waitForNavigation(),page.click('.pauta-card a[href*="senado-172997"]')]);
  assert.match(page.url(),/\/pauta\/senado-172997\//);
  assert.match(await page.$eval('h1',node=>node.textContent),/Segurança Pública/);
  await Promise.all([page.waitForNavigation(),page.click('.back-link')]);
  await page.waitForFunction(()=>document.querySelector('input[name=q]')?.value==='seguranca');
  assert.match(page.url(),/orgao=senado/);
  await page.goto(base+'?aba=pautas&q=bet#painel');
  await page.waitForSelector('.pauta-card a[href*="stf-adpf-1212"]');
  assert.ok((await page.$$eval('.pauta-card',nodes=>nodes.length))>=2);
  await page.goto(base+'pauta/camara-2620905/');
  const details=await page.$('.pauta-votes .disclosure');assert.ok(details);
  await details.$eval('summary',node=>node.click());
  const search=await details.$('.ballot-search input');
  if(search){await search.type('nome que não existe');assert.equal(await details.$$eval('tbody tr:not([hidden])',nodes=>nodes.length),0);}
  await page.goto(base+'pauta/camara-2355754/');assert.ok(await page.$('.related-documents'));
  await page.goto(base+'pauta/camara-2602554/');
  assert.match(await page.$eval('.impact-audience',n=>n.textContent),/vendedores/);
  assert.match(await page.$eval('.effect-context',n=>n.textContent),/efeito proposto/);
  assert.ok(await page.$('#proximos .next-guidance .text-source'));
  await page.click('.position-action a');
  assert.equal(new URL(page.url()).hash,'#proximos');
  await page.goto(base+'pauta/camara-2333814/');
  assert.match(await page.$eval('h1',node=>node.textContent),/Auxílio a responsáveis/);
  assert.ok(await page.$('.reading-intro .reading-lead'));
  assert.equal(await page.$eval('.original-summary',node=>node.open),false);
  await page.click('.original-summary summary');
  assert.ok(await page.$eval('.original-summary .impact-text',node=>node.getBoundingClientRect().height>0));
  await page.click('.type-guide summary');
  assert.ok(await page.$eval('.type-guide',node=>node.open));
  await page.setJavaScriptEnabled(false);await page.goto(base+'pauta/stf-adpf-1212/');
  for(const id of ['mudanca','responsaveis','historico','proximos'])assert.ok(await page.$('#'+id));
  await page.setJavaScriptEnabled(true);
  for(const width of [320,390,768]){
    await page.setViewport({width,height:844});
    for(const path of ['?aba=pautas&q=bet#painel','pauta/stf-adpf-1212/']){
      await page.goto(base+path);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      if(width<=390&&path.startsWith('?'))assert.ok(await page.$$eval('.tabs a',nodes=>nodes.every(node=>node.getBoundingClientRect().right<=innerWidth)));
      if(width<=390&&path.startsWith('pauta'))assert.ok(await page.evaluate(()=>document.querySelector('.reading-lead').getBoundingClientRect().top<document.querySelector('.pauta-position').getBoundingClientRect().top));
    }
  }
  assert.equal((await page.goto(base+'pauta/nao-existe/')).status(),404);
  assert.ok(await page.$('.missing-pauta'));
  assert.deepEqual(errors,[]);
  console.log('Pages: filtros compartilháveis, navegação, pauta, retorno, votos, documentos, leitura sem JavaScript, 404 e celular verificados.');
}finally{await browser.close();}
