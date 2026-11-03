import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { collect, readSnapshot } from './collect.mjs';
import { render } from './view.mjs';
import { renderPauta, renderMissingPauta } from './pauta-view.mjs';
import { primaryPautas } from './pautas.mjs';
import { jobs, jobHealth, pautaHealth } from './data-quality.mjs';

const port = Number(process.env.PORT ?? 4173);
const host = '127.0.0.1';
const assets = {
  '/style.css':'text/css; charset=utf-8', '/tokens.css':'text/css; charset=utf-8',
  '/client.js':'text/javascript; charset=utf-8', '/marca.svg':'image/svg+xml'
};
let snapshot = await readSnapshot();
async function refresh() {
  try { snapshot = await collect(); }
  catch (error) { console.error('Falha ao salvar a coleta:',error.message); }
}

const server = createServer(async (req,res)=>{
  const send = (status,type,body) => {
    res.writeHead(status,{ 'Content-Type':type, 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" });
    res.end(req.method==='HEAD'?undefined:body);
  };
  if (req.method!=='GET' && req.method!=='HEAD') {
    res.setHeader('Allow','GET, HEAD');
    return send(405,'text/plain; charset=utf-8','Método não permitido.');
  }
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname==='/') return send(200,'text/html; charset=utf-8',render(snapshot,url.searchParams));
    if (url.pathname.startsWith('/pauta/')) {
      const id=url.pathname.slice('/pauta/'.length);
      const pauta=Object.hasOwn(snapshot.pautas??{},id)?snapshot.pautas[id]:null;
      return send(pauta?200:404,'text/html; charset=utf-8',pauta?renderPauta(pauta,snapshot,url.searchParams):renderMissingPauta());
    }
    if (url.pathname==='/api/status') {
      const pautas=primaryPautas(snapshot),allPautas=Object.values(snapshot.pautas??{});
      return send(200,'application/json; charset=utf-8',JSON.stringify({checkedAt:snapshot.checkedAt,
        pautas:{total:pautas.length,relatedDocuments:allPautas.length-pautas.length,health:pautas.reduce((counts,p)=>{const key=pautaHealth(p);counts[key]=(counts[key]??0)+1;return counts;},{}),historyRecords:pautas.reduce((sum,p)=>sum+(p.details?.history?.length??0),0),archivedRecords:Object.keys(snapshot.archive??{}).length},
        jobs:Object.fromEntries(Object.entries(snapshot.jobs).map(([key,j])=>[key,{at:j.at,checkedAt:j.checkedAt,status:j.status,health:jobHealth(j),ok:j.ok,total:j.entries.length,issues:j.issues,scope:jobs[key]?.scope}]))}));
    }
    if (Object.hasOwn(assets,url.pathname)) return send(200,assets[url.pathname],await readFile(new URL('.'+url.pathname,import.meta.url)));
    return send(404,'text/plain; charset=utf-8','Página não encontrada.');
  } catch (error) {
    console.error(error.message);
    return send(500,'text/plain; charset=utf-8','O painel não pôde ser carregado.');
  }
});
server.listen(port,host,()=>{
  console.log('Pauta Pública: http://'+host+':'+server.address().port);
  if (process.env.PAUTA_OFFLINE==='1') return;
  const interval = 30*60*1000;
  if (!snapshot.checkedAt || Date.now()-Date.parse(snapshot.checkedAt)>=interval || Object.values(snapshot.jobs).some(j=>!j.ok)) void refresh();
  setInterval(refresh,interval).unref();
});
