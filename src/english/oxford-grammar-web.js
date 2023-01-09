document.querySelector('#main-container').style.width = '795px';
const grammarList = [];
Array.from(document.querySelectorAll('.definition-wrap > p')).forEach((item, index) => {
  const order = (index + 1).toString().padStart(3, '0');
  grammarList.push(`${order}${''.padStart(3, ' ')}${item.firstElementChild.innerText}`);
  const span = document.createElement('span');
  span.style.verticalAlign = 'super';
  span.style.fontSize = '10px';
  span.style.fontWeight = 'bold';
  span.style.paddingRight = '5px';
  span.innerText = order;
  item.insertBefore(span, item.firstElementChild);
});

const contentEl = document.querySelector('div.peu-link-nav').nextElementSibling;
const pre = document.createElement('pre');
pre.innerText = JSON.stringify(grammarList, null, 2).replace(/"/g, '');
contentEl.parentElement.insertBefore(pre, contentEl.nextElementSibling);
window.print();
