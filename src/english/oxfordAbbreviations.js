(() => {
  console.clear();

  // Detect domain to avoid CORS
  const targetURL = 'https://public.oed.com/how-to-use-the-oed/abbreviations/';
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
      // To fetch the HTML and extract data from it by invoke `sniff`
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
    console.log('##### Start oxfordAbbreviations sniffer #####');

    const abbreviationListURL = 'https://public.oed.com/how-to-use-the-oed/abbreviations/';

    console.log('# Fetching abbreviation list HTML');
    const abbreviationListSelectors = [
      {
        key: 'abbreviationList',
        selector: '#content > div > table > tbody > tr:nth-child(n + 2)',
        contents: [
          {
            key: 'abbreviation',
            selector: 'td:first-child',
            contents: ['innerText']
          },
          {
            key: 'word',
            selector: 'td:last-child',
            contents: ['innerText']
          },
          {
            key: 'link',
            selector: 'td:first-child',
            contents: ['ownerDocument.URL']
          }
        ]
      },
      {
        key: 'pageHeader',
        selector: '#content > div > h1',
        contents: ['innerText']
      }
    ];
    const htmlniffer = await getHtmlniffer(abbreviationListURL, abbreviationListSelectors);
    console.log(`# Abbreviation list: ${htmlniffer.htmlData.abbreviationList.length}`);

    exportJson(htmlniffer, 'oxfordAbbreviations');

    console.log('##### Finish oxfordAbbreviations sniffer #####');
  })();
})();
