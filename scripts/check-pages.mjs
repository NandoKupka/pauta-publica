import { readdir, readFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const dir=resolve('dist'),metadata=JSON.parse(await readFile(join(dir,'build.json'),'utf8'));
const checked=new Set(),errors=[];
let files=0;
async function inspect(path) {
  for(const entry of await readdir(path,{withFileTypes:true})){
    const file=join(path,entry.name);
    if(entry.isDirectory()){await inspect(file);continue;}
    if(!entry.name.endsWith('.html'))continue;
    const html=await readFile(file,'utf8');files++;
    if(!html.includes('type="module"')||!html.includes('pauta-base'))errors.push(file+': metadados ausentes');
    for(const [,attribute,value]of html.matchAll(/\b(href|src|action)="(\/[^"<>]*)"/g)){
      if(value.startsWith('//')){errors.push(file+': URL externa sem protocolo');continue;}
      const pathOnly=value.split(/[?#]/)[0];
      if(!pathOnly.startsWith(metadata.base)){errors.push(file+': caminho fora da base '+pathOnly);continue;}
      const local=pathOnly.slice(metadata.base.length);
      const target=local.endsWith('/')||!local?local+'index.html':local;
      if(checked.has(target))continue;checked.add(target);
      try{await access(join(dir,target));}catch{errors.push(file+': recurso ausente '+target);}
    }
  }
}
await inspect(dir);
if(errors.length)throw new Error(errors.slice(0,20).join('\n'));
console.log(`${files} arquivos HTML e ${checked.size} destinos locais verificados.`);
