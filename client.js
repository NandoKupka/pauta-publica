const simplify = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function initBallotSearch(root=document) {
for (const label of root.querySelectorAll('.ballot-search')) {
  if(label.dataset.initialized)continue;
  label.dataset.initialized='true';
  label.hidden = false;
  const details = label.closest('.detail-body');
  const rows = [...details.querySelectorAll('tbody tr')];
  const input = label.querySelector('input');
  const count = details.querySelector('.ballot-count');
  const update = () => {
    const words = simplify(input.value).trim().split(/\s+/);
    let shown = 0;
    for (const row of rows) {
      const text = simplify([...row.cells].slice(0,2).map(cell=>cell.textContent).join(' '));
      row.hidden = !words.every(word=>text.includes(word));
      if (!row.hidden) shown++;
    }
    count.textContent = shown+' '+(shown===1?'registro encontrado':'registros encontrados');
    count.classList.toggle('sr',shown!==0);
  };
  input.addEventListener('input',update);
  update();
}

}
if(typeof document!=='undefined'){initBallotSearch();window.addEventListener('pageshow',()=>{for(const input of document.querySelectorAll('.ballot-search input'))input.dispatchEvent(new Event('input'));});}
