const simplify = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
for (const label of document.querySelectorAll('.ballot-search')) {
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
  window.addEventListener('pageshow',update);
}
