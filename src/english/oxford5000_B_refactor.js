(() => {
  console.clear();

  (async () => {
    // Detect domain to avoid cross domain
    const targetURL = 'https://www.oxfordlearnersdictionaries.com/';
    const targetDomain = new URL(targetURL).host;
    const isDomainOk = document.domain === targetDomain;
    if (!isDomainOk) {
      if (confirm(`Navigate to '${targetURL}' ?`)) {
        window.open(targetURL, '_self');
        return;
      }
      console.warn('Sniff fail cause cross domain!');
      return;
    }

    // Fetch html
    const fetchDocString = async url => {
      const response = await fetch(url);
      const docString = await response.text();
      return docString;
    };

    // Document string to document object
    class DocParser {
      constructor() {
        const docParser = new DOMParser();
        this.str2Doc = str => docParser.parseFromString(str, 'text/html');
      }
    }
    const docParser = new DocParser();

    // data to JSON file
    const exportJson = data => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json]);
      const link = document.createElement('a');
      const objUrl = URL.createObjectURL(blob);
      link.download = 'oxford5000.json';
      link.href = objUrl;
      link.click();
      URL.revokeObjectURL(objUrl);
    };

    // 5000 words list source
    const wordListUrl = 'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000';
    const wordListSelector = '#wordlistsContentPanel > ul > li';

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

      constructor(html, selectors) {
        this.html = html;
        this.htmlData = {};
        this.sniff = async function() {
          const docString = await fetchDocString(html);
          const doc = docParser.str2Doc(docString);
          Htmlniffer.getContent(doc, selectors, this.htmlData);
        }
      }
    }

    const getHtmlniffer = async (...args) => {
      const htmlniffer = new Htmlniffer(...args);
      await htmlniffer.sniff();
      return htmlniffer;
    }

    console.log('##### Start oxford5000 sniffer #####');
    console.log('# Fetching HTML');
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
    let total = wordList.length;
    let cur = 0;
    const taskBlockQueue = [];
    const taskBlockSize = 500;
    wordList.length = 1000;
    while(wordList.length) {
      taskBlockQueue.push(wordList.splice(0, taskBlockSize));
    }

    while(taskBlockQueue.length) {
      const task = taskBlockQueue.shift();

      console.log(`# Fetching HTML`);
      for (const item of task) {
        cur ++;
        const { word, link } = item;
        console.log(`# Currently fetching: ${word} (${cur}/${total})`);
        const { htmlData } = await getHtmlniffer(link, wordSelectors);
        item.definition = htmlData;
        wordList.push(item);
      }
      console.log(`# HTMLs`);
    }
    exportJson(wordList);
    console.log('##### Exit oxford5000 sniffer #####');
  })();
})();
