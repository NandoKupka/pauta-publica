import { render } from '../view.mjs';
import { initBallotSearch } from '../client.js';
import { withBase, publicPath, localReturn, normalizeBase } from './paths.mjs';

const meta=name=>document.querySelector('meta[name="'+name+'"]')?.content;
const base=normalizeBase(meta('pauta-base')||'/');
let snapshot;
function showMessage(text) {
  let note=document.querySelector('.publication-note');
  if(!note){note=document.createElement('p');note.className='publication-note';document.querySelector('main')?.prepend(note);}
  note.textContent=text;
}
function renderPanel(scroll=false) {
  if(!snapshot)return;
  const html=withBase(render(snapshot,new URLSearchParams(location.search),new Date()),base);
  const next=new DOMParser().parseFromString(html,'text/html');
  document.querySelector('main').replaceWith(next.querySelector('main'));
  document.querySelector('.top').replaceWith(next.querySelector('.top'));
  document.title=next.title;
  initBallotSearch();
  if(scroll)document.querySelector('#painel')?.scrollIntoView();
}
async function start() {
  if(meta('pauta-route')!=='panel'){
    const back=localReturn(new URLSearchParams(location.search).get('retorno'),'/');
    if(back)document.querySelector('.back-link')?.setAttribute('href',publicPath(back,base));
    const at=meta('pauta-data-at');
    if(at&&Date.now()-Date.parse(at)>60*60*1000)showMessage('Esta página contém uma cópia anterior dos dados. Confira as datas das fontes e a situação atual na ficha oficial.');
    return;
  }
  try{
    const response=await fetch(new URL(meta('pauta-panel-data'),location.origin),{cache:'no-cache'});
    if(!response.ok)throw new Error('Dados indisponíveis');
    snapshot=await response.json();
    if(!snapshot.jobs||!snapshot.pautas)throw new Error('Dados inválidos');
    renderPanel(Boolean(location.hash));
  }catch{
    showMessage('Não foi possível carregar a busca e os filtros. A agenda abaixo é a edição publicada; tente recarregar a página.');
  }
}
document.addEventListener('click',event=>{
  const a=event.target.closest('a');
  if(!snapshot||!a||a.getAttribute('href')?.startsWith('#')||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target||a.hasAttribute('download'))return;
  const url=new URL(a.href);
  if(url.origin!==location.origin||url.pathname!==base||(!url.search&&url.hash&&url.hash!=='#painel'))return;
  event.preventDefault();history.pushState(null,'',url);renderPanel(true);
});
document.addEventListener('submit',event=>{
  const form=event.target;
  if(!snapshot||!form.matches('.filters'))return;
  event.preventDefault();
  const url=new URL(base,location.origin);url.search=new URLSearchParams(new FormData(form)).toString();url.hash='painel';
  history.pushState(null,'',url);renderPanel(true);
});
window.addEventListener('popstate',()=>renderPanel(Boolean(location.hash)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderPanel();});
void start();
