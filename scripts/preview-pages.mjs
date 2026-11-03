import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';

const dir=resolve('dist'),metadata=JSON.parse(await readFile(join(dir,'build.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  try{
    if(!url.pathname.startsWith(metadata.base))throw new Error('Not found');
    let file=resolve(dir,decodeURIComponent(url.pathname.slice(metadata.base.length)));
    if(file!==dir&&!file.startsWith(dir+sep))throw new Error('Not found');
    const info=await stat(file);
    if(info.isDirectory()){
      if(!url.pathname.endsWith('/')){res.writeHead(301,{location:url.pathname+'/'+url.search+url.hash});return res.end();}
      file=join(file,'index.html');
    }
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':types['.html']});res.end(await readFile(join(dir,'404.html')));}
}).listen(Number(process.env.PORT||4184),'127.0.0.1',()=>console.log('Prévia estática: http://127.0.0.1:'+(process.env.PORT||4184)+metadata.base));
