import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base=process.env.PAGES_TEST_URL||'http://127.0.0.1:4184/pauta-publica/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/google-chrome'),headless:true});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewport({width:1366,height:900});
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
  await page.setJavaScriptEnabled(false);await page.goto(base+'pauta/stf-adpf-1212/');
  for(const id of ['mudanca','responsaveis','historico','proximos'])assert.ok(await page.$('#'+id));
  await page.setJavaScriptEnabled(true);
  for(const width of [390,768]){
    await page.setViewport({width,height:844});
    for(const path of ['?aba=pautas&q=bet#painel','pauta/stf-adpf-1212/']){
      await page.goto(base+path);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
  }
  assert.equal((await page.goto(base+'pauta/nao-existe/')).status(),404);
  assert.ok(await page.$('.missing-pauta'));
  assert.deepEqual(errors,[]);
  console.log('Pages: filtros compartilháveis, navegação, pauta, retorno, votos, documentos, leitura sem JavaScript, 404 e celular verificados.');
}finally{await browser.close();}
