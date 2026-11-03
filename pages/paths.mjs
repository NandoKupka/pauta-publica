export function normalizeBase(value='/') {
  if(value===''||value==='/')return '/';
  if(!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(value))throw new Error('Caminho base inválido');
  return value.replace(/\/$/,'')+'/';
}
export function publicPath(path,base='/') {
  if(!path.startsWith('/')||path.startsWith('//'))return path;
  const rooted=path.replace(/^\/pauta\/([^/?#]+)(?=[?#]|$)/,'/pauta/$1/');
  return normalizeBase(base)+rooted.slice(1);
}
export function withBase(html,base='/') {
  return html.replace(/\b(href|src|action)="(\/[^"<>]*)"/g,(_,attribute,path)=>attribute+'="'+publicPath(path,base)+'"');
}
export function localReturn(value,base='/') {
  if(!value)return null;
  try{
    const url=new URL(value,'https://local.invalid'),prefix=normalizeBase(base);
    if(url.origin!=='https://local.invalid'||url.pathname!==prefix)return null;
    return '/'+url.search+'#painel';
  }catch{return null;}
}
