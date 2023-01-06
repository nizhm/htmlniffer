(async () => {
  // 显示所有元素
  document.querySelectorAll('#wordlistsContentPanel > ul > li[class=hidden]').forEach(el => {
    el.classList.remove('hidden');
  });
  const wordListSelector = '#wordlistsContentPanel > ul > li';
  const wordListElements = Array.from(document.querySelectorAll(wordListSelector));
  // wordListElements.length = 1000;
  const wordPhonList = [];
  const taskQueue = [];
  const taskQueueForStyle = [];
  const tempList = [...wordListElements];
  while(tempList.length) {
    const block = tempList.splice(0, 1000);
    taskQueue.push([...block]);
    taskQueueForStyle.push([...block]);
  }
  const sleep = async function (time = 5000) {
    console.log('Paused');
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Restored');
        resolve();
      }, time);
    });
  };
  const htmlFetcher = url => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('load', () => resolve(xhr.response));
      xhr.addEventListener('error', err => reject(err));
      xhr.open('GET', url);
      xhr.responseType = 'document';
      xhr.send();
    });
  };

  const htmlFetcherMulti = async urls => {
    if (!Array.isArray(urls)) throw 'Array type parameter required!'

    const requestList = urls.map((url, idx) => ({ idx, url, result: null }));
    let isAllURLFulfilled = false;
    let readyRequestList = requestList;
    while(!isAllURLFulfilled) {
      const requests = readyRequestList
        .map(item => item.url)
        .map(url => htmlFetcher(url))
      ;
      const results = await Promise.allSettled(requests);
      results.forEach((result, idx) => {
        readyRequestList[idx].result = result;
      });
      const hasRejected = !!readyRequestList.find(item => item.result.status === 'rejected');
      const isAllFulfilled = !hasRejected;
      const syncToRequestList = list => list.forEach(({ idx, result }) => requestList[idx].result = result);
      if (isAllFulfilled) {
        syncToRequestList(readyRequestList);
        isAllURLFulfilled = true;
      } else {
        const classedResults = readyRequestList.reduce((pre, cur) => {
          const { result: { status } } = cur;
          switch(status) {
            case 'fulfilled':
              pre.fulfilledRequestList.push(cur);
              break;
            case 'rejected':
              pre.rejectedRequestList.push(cur);
              break;
            default :
          }
          return pre;
        }, { rejectedRequestList: [], fulfilledRequestList: [] });
        syncToRequestList(classedResults.fulfilledRequestList);
        readyRequestList = classedResults.rejectedRequestList;
      }
    }
    const responses = requestList.map(item => item.result.value);
    return responses;
  };

  let count = 0;
  // 获取单词对应的英音和美音，并存储在index对应的数组中
  count = 0;
  while(taskQueue.length) {
    const elements = taskQueue.shift();
    const urls = elements.map(element => {
      const linkEl = element.querySelector('a');
      // 手动校正下有个单词链接有问题；
      if (linkEl.innerText === 'yield' && linkEl.href.endsWith('english/')) {
        linkEl.href += 'yield_2';
      }
      return linkEl.href;
    });
    const responses = await htmlFetcherMulti(urls);
    responses.forEach(doc => {
      const BrESpan = doc.querySelector('div.phons_br > span.phon');
      const NAmESpan = doc.querySelector('div.phons_n_am > span.phon');
      wordPhonList[count] = [BrESpan, NAmESpan];
      count++;
    });
    await sleep();
  }

  // 遍历5000列表，并插入发音
  wordListElements.forEach((element, index) => {
    // if (index > 999) return;
    const divEl = element.lastChild;
    divEl.append(...wordPhonList[index]);
  });

  await sleep(500);
  count = 0;
  // 调整布局
  while(taskQueueForStyle.length) {
    const elements = taskQueueForStyle.shift();
    console.log(`Styling now: ${count + 1} - ${count + elements.length}`);
    elements.forEach(element => {
      count ++;
      // if (count > 999) return;

      // 每行的padding
      element.style.paddingRight = '0';

      const wordEl = element.querySelector('a');
      // 单词宽度
      wordEl.style.display = 'inline-block';
      wordEl.style.minWidth = '150px';
      // 单词序号
      const span = document.createElement('span');
      span.classList.add('serial-number');
      span.style.fontSize = '0.7em';
      span.style.fontWeight = 'normal';
      span.style.verticalAlign = '-1px';
      span.innerText = count.toString().padStart(4, '0');
      element.insertBefore(span, element.firstChild);

      const divEl = element.lastChild;
      // 所属等级
      const belongEl = divEl.querySelector('.belong-to');
      if (belongEl) {
        belongEl.style.marginRight = '20px';
      }
      // 音标MP3
      divEl.querySelectorAll('div').forEach(ele => {
        ele.remove();
      });
      // 音标
      divEl.querySelectorAll('.phon').forEach(el => {
        el.style.fontFamily = 'Lucida Sans Unicode", "Lucida Grande';
        el.style.fontSize = '#333333';
        el.style.fontWeight = '400';
        el.style.color = '#333333';
        el.style.display = 'inline-block';
        el.style.minWidth = '130px';
      });
    });
  }
  // 加行首
  const ulEl = document.querySelector("#wordlistsContentPanel > ul");
  const first = ulEl.firstElementChild;
  const newFirst = first.cloneNode(true);
  newFirst.querySelector('a').innerText = '';
  newFirst.querySelectorAll('span').forEach(spanEl => spanEl.classList.contains('phon') || spanEl.remove());
  newFirst.querySelectorAll('span.phon').forEach((spanEl, index) => spanEl.innerText = index ? 'NAmE' : 'BrE');
  ulEl.insertBefore(newFirst, first);

  // 把多余的内容去掉
  document.body.innerHTML = document.querySelector("#informational-content").outerHTML
  const controlsEl = document.querySelector("#wordlistsHeaderPanel > div.wordlistControls");
  controlsEl.innerHTML = '';
  controlsEl.style.height = '0px';
  controlsEl.style.padding = '5px';

  // 触发打印
  window.print();
})()
