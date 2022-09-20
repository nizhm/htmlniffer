(() => {
  console.clear();

  // Detect domain to avoid CORS
  const targetURL = 'https://www.oxfordlearnersdictionaries.com/';
  const targetDomain = new URL(targetURL).host;
  const isDomainOk = document.domain === targetDomain;
  if (!isDomainOk) {
    if (confirm(`Navigate to '${targetURL}' ?`)) {
      window.open(targetURL, '_self');
      return;
    }
    console.warn('Sniff fail cause CORS(https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)!');
    return;
  }

  /**
   * get HTML and parse into DOM tree
   *
   * @param url
   * @return {Promise<Document>|Promise<Error>}
   * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/HTML_in_XMLHttpRequest
   */
  function htmlFetcher(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('load', () => resolve(xhr.response));
      xhr.addEventListener('error', err => reject(err));
      xhr.open('GET', url);
      xhr.responseType = 'document';
      xhr.send();
    });
  }

  /**
   * transform data into JSON file
   *
   * @param data {Object|String}
   */
  const exportJson = (data, fileName) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json]);
    const objectURL = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${fileName}.json`;
    link.href = objectURL;
    link.click();
    window.URL.revokeObjectURL(objectURL);
  };

  /**
   * get data from html Document
   *
   * @class Htmlniffer
   */
  class Htmlniffer {
    static getContent = (node, selectors, container) => {
      for(const { key, selector, contents } of selectors) {
        const matches = node.querySelectorAll(selector);
        const matchesLen = matches.length;

        if (!matchesLen) {
          container[key] = null;
          return;
        }

        const hasSubData = typeof contents[0] !== 'string';
        let contentList = [];
        if (hasSubData) {
          matches.forEach(element => {
            let item = {};
            contents.forEach(({ key: subKey, selector: subSelector, contents: subContents }) => {
              if (!subContents.includes('innerHTML')) {
                subContents.push('innerHTML');
              }
              const subNode = element.querySelector(subSelector);
              let cont;
              cont = subContents.map(el => `subNode?.${el}`).join('||');
              cont += `||''`;
              cont = eval(cont);
              item[subKey] = cont;
            });
            contentList.push(item);
          });
          if (matchesLen === 1) {
            contentList = contentList[0];
          }
          container[key] = contentList;
        } else {
          if (!contents.includes('innerHTML')) {
            contents.push('innerHTML');
          }
          matches.forEach(element => {
            let content;
            content = contents.map(el => `element?.${el}`).join('||');
            content += `||''`;
            content = eval(content);
            contentList.push(content);
          });
          if (matchesLen === 1) {
            contentList = contentList[0];
          }
          container[key] = contentList;
        }
      }
    }

    constructor(url, selectors) {
      this.htmlURL = url;
      this.htmlData = {};
      this.sniff = async function() {
        const doc = await htmlFetcher(url);
        Htmlniffer.getContent(doc, selectors, this.htmlData);
      }
    }
  }

  /**
   * get Htmlniffer and init it
   *
   * @param args
   * @return {Promise<Htmlniffer>}
   */
  const getHtmlniffer = async (...args) => {
    const htmlniffer = new Htmlniffer(...args);
    await htmlniffer.sniff();
    return htmlniffer;
  }

  (async () => {
    console.log('##### Start oxford5000 sniffer #####');

    // 5000 words list source
    const wordListUrl = 'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000';

    console.log('# Fetching word list HTML');
    const wordListSelectors = [
      {
        key: 'wordList',
        selector: '#wordlistsContentPanel > ul > li',
        contents: [
          {
            key: 'word',
            selector: 'a',
            contents: ['innerText']
          },
          {
            key: 'link',
            selector: 'a',
            contents: ['href']
          },
          {
            key: 'belong',
            selector: '.belong-to',
            contents: ['innerText']
          },
          {
            key: 'pos',
            selector: '.pos',
            contents: ['innerText']
          }
        ]
      },
      {
        key: 'pageHeader',
        selector: '.h',
        contents: ['innerText']
      },
      {
        key: 'listHeader',
        selector: '#wordlistsBreadcrumb > span:nth-child(2)',
        contents: ['innerText']
      }
    ];
    const { htmlData: { wordList } } = await getHtmlniffer(wordListUrl, wordListSelectors);
    console.log(`# Word list: ${wordList.length}`);

    console.log('# Start fetching HTML of each word');
    const wordSelectors = [
      {
        key: 'word',
        selector: '.top-g > div > h1',
        contents: ['innerText']
      },
      {
        key: 'brPhons',
        selector: '.top-g > div > span.phonetics > div.phons_br > span',
        contents: ['innerText']
      },
      {
        key: 'usPhons',
        selector: '.top-g > div > span.phonetics > div.phons_n_am > span',
        contents: ['innerText']
      }
    ];
    const total = wordList.length;
    let cur = 0;
    wordList.length = 500;
    for(const item of wordList) {
      cur ++;
      const { word, link, belong } = item;
      item.belong = belong?.toUpperCase();

      console.log(`# Currently fetching: ${word} (${cur}/${total})`);

      const { htmlData } = await getHtmlniffer(link, wordSelectors);
      item.definition = htmlData;

      console.log(`# Successfully!`);
    }

    exportJson(wordList, 'oxford5000');

    console.log('##### Finish oxford5000 sniffer #####');
  })();
})();
