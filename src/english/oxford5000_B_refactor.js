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
   * @class Hniffer
   */
  class Hniffer {
    static getDatum = (node, selector, datum) => {
      const matches = node.querySelectorAll(selector);
      const matchesLen = matches.length;

      if (!matchesLen) {
        return null;
      }

      const datumList = [];
      const isStringList = typeof datum[0] === 'string';
      if (isStringList) {
        if (!datum.includes('innerHTML')) {
          datum.push('innerHTML');
        }
        let contCode;
        contCode = datum.map(el => `element?.${el}`).join('||');
        contCode += `||''`;
        for(const element of matches) {
          const content = eval(contCode);
          datumList.push(content);
        }
      } else {
        for(const ele of matches) {
          const item = {};
          datum.forEach(({ name: subKey, selector: subSelector, datum: subContents }) => {
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
          datumList.push(item);
        }
      }

      if (datumList.length === 1) {
        return datumList[0];
      }

      return datumList;
    };

    static getContent = function (node, selectors, container = {}) {
      if (!node) {
        return null;
      }

      for(const { name, selector, datum, subSelectors } of selectors) {
        if (datum) {
          container[name] = Hniffer.getDatum(node, selector, datum);
          continue;
        }

        container[name] = Hniffer.getContent(node.querySelector(selector), subSelectors);
      }
      return container;
    }

    constructor(url, selectors) {
      this.htmlURL = url;
      this.htmlData = null;
      this.sniff = async function() {
        const doc = await htmlFetcher(url);
        this.htmlData = Hniffer.getContent(doc, selectors);
      }
    }
  }

  /**
   * get Hniffer and init it
   *
   * @param args
   * @return {Promise<Hniffer>}
   */
  const getHniffer = async (...args) => {
    const hniffer = new Hniffer(...args);
    await hniffer.sniff();
    return hniffer;
  }

  (async () => {
    console.log('##### Start oxford5000 sniffer #####');

    // 5000 words list source
    const wordListUrl = 'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000';

    console.log('# Fetching word list HTML');
    const wordListSelectors = [
      {
        name: 'wordList',
        selector: '#wordlistsContentPanel > ul > li',
        datum: [
          {
            name: 'word',
            selector: 'a',
            datum: ['innerText']
          },
          {
            name: 'link',
            selector: 'a',
            datum: ['href']
          },
          {
            name: 'belong',
            selector: '.belong-to',
            datum: ['innerText']
          },
          {
            name: 'pos',
            selector: '.pos',
            datum: ['innerText']
          }
        ]
      },
      {
        name: 'pageHeader',
        selector: '.h',
        datum: ['innerText']
      },
      {
        name: 'listHeader',
        selector: '#wordlistsBreadcrumb > span:nth-child(2)',
        datum: ['innerText']
      }
    ];
    const { htmlData: { wordList } } = await getHniffer(wordListUrl, wordListSelectors);
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

      const { htmlData } = await getHniffer(link, wordSelectors);
      item.definition = htmlData;

      console.log(`# Successfully!`);
    }

    exportJson(wordList, 'oxford5000');

    console.log('##### Finish oxford5000 sniffer #####');
  })();
})();
