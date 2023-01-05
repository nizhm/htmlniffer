(() => {
  // 显示所有元素
  document.querySelectorAll('#wordlistsContentPanel > ul > li[class=hidden]').forEach(el => {
    el.classList.remove('hidden');
  });
  const wordListSelector = '#wordlistsContentPanel > ul > li';
  const wordListElements = Array.from(document.querySelectorAll(wordListSelector));
  const wordPhonList = [];
  const taskQueue = [];
  const taskQueueForStyle = [];
  const tempList = [...wordListElements];
  while(tempList.length) {
    const block = tempList.splice(0, 1000);
    taskQueue.push([...block]);
    taskQueueForStyle.push([...block]);
  }
  const sleep = async (time = 120000) => {
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
  }

  let count = 0;
  (async () => {
    // 获取单词对应的英音和美音，并存储在index对应的数组中
    count = 0;
    while(taskQueue.length) {
      const elements = taskQueue.shift();

      while(elements.length) {
        const index = count;
        count++;
        console.log(`Fetching phon: ${count}`);
        const element = elements.shift();
        const wordURL = element.querySelector('a').href
        const xhr = new XMLHttpRequest();
        xhr.open('GET', wordURL);
        xhr.responseType = 'document';
        xhr.send();
        xhr.addEventListener('error', err => {
          console.log(wordURL);
          throw err;
        });
        xhr.addEventListener('load', () => {
          const doc = xhr.response;
          const BrESpan = doc.querySelector('div.phons_br > span.phon');
          const NAmESpan = doc.querySelector('div.phons_n_am > span.phon');
          wordPhonList[index] = [BrESpan, NAmESpan];
        });
      }

      await sleep();
    }

    // 遍历5000列表，并插入发音
    count = 0;
    wordListElements.forEach((element, index) => {
      const divEl = element.lastChild;
      divEl.append(...wordPhonList[index]);
    });

    await sleep(1000);
    count = 0;
    // 调整布局
    while(taskQueueForStyle.length) {
      const elements = taskQueueForStyle.shift();
      console.log(`Styling now: ${count + 1} - ${count + elements.length}`);
      elements.forEach(element => {
        count ++;

        // 每行的padding
        element.style.paddingRight = '0';

        const wordEl = element.querySelector('a');
        // 单词宽度
        wordEl.style.display = 'inline-block';
        wordEl.style.minWidth = '150px';
        // 单词序号
        const span = document.createElement('span');
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
  })();
})()
