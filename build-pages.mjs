import { mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { readSnapshot } from './collect.mjs';
import { render, esc } from './view.mjs';
import { renderPauta, renderMissingPauta } from './pauta-view.mjs';
import { normalizeBase, withBase } from './pages/paths.mjs';
import { panelSnapshot } from './pages/data.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
export function publicDocument(html,{base='/',route='panel',dataPath='',at='',builtAt=new Date().toISOString()}={}) {
  const b=normalizeBase(base);
  const metadata=`<meta name="pauta-base" content="${b}"><meta name="pauta-route" content="${route}"><meta name="pauta-data-at" content="${esc(at)}"><meta name="pauta-panel-data" content="${esc(dataPath)}"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'">`;
  const noscript=route==='panel'?'<noscript><p class="publication-note">Ative o JavaScript para buscar e filtrar esta edição. Os links para as páginas das pautas continuam disponíveis.</p></noscript>':'';
  return withBase(html.replace(/<script[^>]+src="\/client\.js"[^>]*><\/script>/,'')
    .replace('</head>',metadata+'<script type="module" src="/pages.js"></script></head>')
    .replace(/(<main\b[^>]*>)/,'$1'+noscript)
    .replace('class="wrap footer"','class="wrap footer pages-footer"')
    .replace('</footer>',`<span class="published-at">Edição publicada em ${esc(new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(builtAt)))}</span></footer>`),b);
}
export async function buildPages({snapshot,base=process.env.PAGES_BASE_PATH||'/pauta-publica/',now=new Date(),outDir=join(root,'dist')}={}) {
  snapshot??=await readSnapshot();
  base=normalizeBase(base);outDir=resolve(outDir);
  // Never clean an arbitrary path supplied by an environment variable or caller.
  const relative=outDir.slice(root.length);
  if(!outDir.startsWith(root)||!['dist','dist-test'].includes(relative))throw new Error('A saída deve ser dist ou dist-test dentro do projeto');
  if(!Object.keys(snapshot.jobs??{}).length)throw new Error('Não há dados para publicar');
  await rm(outDir,{recursive:true,force:true});await mkdir(outDir,{recursive:true});
  const compact=JSON.stringify(panelSnapshot(snapshot));
  const digest=createHash('sha256').update(compact).digest('hex').slice(0,16);
  const dataFile='panel-'+digest+'.json',dataPath=base+dataFile;
  await writeFile(join(outDir,dataFile),compact);
  for(const name of ['style.css','tokens.css','marca.svg'])await copyFile(join(root,name),join(outDir,name));
  await build({entryPoints:[join(root,'pages/browser.mjs')],outfile:join(outDir,'pages.js'),bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,
    alias:{'node:crypto':join(root,'pages/crypto.mjs')},legalComments:'eof'});
  const wrap=(html,route='panel',at=snapshot.checkedAt)=>publicDocument(html,{base,route,dataPath,at,builtAt:now.toISOString()});
  await writeFile(join(outDir,'index.html'),wrap(render(snapshot,new URLSearchParams(),now)));
  await writeFile(join(outDir,'404.html'),wrap(renderMissingPauta(),'missing'));
  let count=0;
  for(const p of Object.values(snapshot.pautas??{})){
    if(!/^[a-z0-9-]+$/.test(p.id))throw new Error('Identificador de pauta inválido');
    const directory=join(outDir,'pauta',p.id);await mkdir(directory,{recursive:true});
    const dates=[p.details?.at,...Object.values(p.details?.parts??{}).map(part=>part.at)].filter(Boolean).sort();
    await writeFile(join(directory,'index.html'),wrap(renderPauta(p,snapshot,new URLSearchParams(),now),'pauta',dates[0]||p.lastSeen));count++;
  }
  await writeFile(join(outDir,'.nojekyll'),'');
  await writeFile(join(outDir,'build.json'),JSON.stringify({builtAt:now.toISOString(),dataAt:snapshot.checkedAt,base,pages:count,panelData:dataFile}));
  console.log(`GitHub Pages: ${count} páginas de pauta + painel; base ${base}; índice ${(Buffer.byteLength(compact)/1024/1024).toFixed(2)} MB.`);
  return {outDir,base,dataFile,pages:count};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildPages();
