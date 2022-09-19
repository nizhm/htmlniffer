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

    // 5000 words list source
    const wordListUrl = 'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000';
    const wordListSelector = '.top-g';

    // word item for each word list
    class WordItem {
      static _link = 'a';
      static getLink = node => node?.querySelector(WordItem._link)?.href;
      static _pos = '.pos';
      static _belong = '.belong-to';
      static getBasic = (node, sel) => node?.querySelector(sel)?.innerHTML;

      constructor(node) {
        this.link = WordItem.getLink(node);
        this.word = WordItem.getBasic(node, WordItem._link);
        this.alpha = this.word.charAt(0).toUpperCase();
        this.pos = WordItem.getBasic(node, WordItem._pos);
        this.belong = WordItem.getBasic(node, WordItem._belong)?.toUpperCase();
        console.log(this.word);
      }
    }

    // word info for each word
    class Word {
      static _headword = '.headword';
      static _pos = '.pos';
      static _brPhons = 'div.phons_br > span';
      static _usPhons = 'div.phons_n_am > span';
      static _multiSense = '.sense[sensenum]';
      static _singleSense = '.sense';
      static _senseDef = '.def';
      static getBasic = (doc, sel) => doc?.querySelector(sel)?.innerHTML;
      static getDef = node => node?.querySelector(Word._senseDef)?.innerText || node?.querySelector(Word._senseDef)?.innerHTML;
      static getSenses = doc => {
        let list = doc.querySelectorAll(Word._multiSense);
        if (list.length) {
          list = [...list].map(li => Word.getDef(li));
        } else {
          list = [Word.getDef(doc?.querySelector(Word._singleSense))];
        }
        return list;
      }

      constructor(document) {
        this.word = Word.getBasic(document, Word._headword);
        console.log(this.word);
        this.pos = Word.getBasic(document, Word._pos);
        this.brPhons = Word.getBasic(document, Word._brPhons);
        this.usPhons = Word.getBasic(document, Word._usPhons);
        this.senses = Word.getSenses(document);
      }
    }

    // Document string to document object
    class DocParser {
      constructor() {
        const docParser = new DOMParser();
        this.str2Doc = str => docParser.parseFromString(str, 'text/html');
      }
    }
    const docParser = new DocParser();

    // Fetch html
    const fetchDocString = async url => {
      const response = await fetch(url);
      const docString = await response.text();
      return docString;
    };

    console.log('##### Start oxford5000 sniffer #####');
    console.log('# Fetching HTML');
    const wordListDocString = await fetchDocString(wordListUrl);
    const wordListDocument = docParser.str2Doc(wordListDocString);
    console.log('# HTML: -');
    console.log('# Parsing Document');
    console.log('# Document: -');
    console.log('# Finding list');
    let wordList = wordListDocument.querySelector(wordListSelector).children;
    console.log(`# list: ${wordList.length}`);
    console.log('# Parsing word list');
    wordList = [...wordList];
    wordList = wordList.map(li => new WordItem(li));
    console.log(`# Word list: ${wordList.length}`);

    let total = wordList.length;
    let cur = 0;
    const taskBlockQueue = [];
    const taskBlockSize = 500;
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
        let wordDocString;
        try {
          wordDocString = await fetchDocString(link);
        } catch(e) {
          console.trace(word + e.message);
          continue;
        }
        item.wordDocString = wordDocString;
      }
      console.log(`# HTMLs`);

      console.log(`# Parsing HTML`);
      for (const item of task) {
        const { wordDocString, word } = item;
        delete item.wordDocString;
        const wordDoc = docParser.str2Doc(wordDocString);
        console.log(`# Currently parsing: ${word}`);
        item.definition = new Word(wordDoc);
        wordList.push(item);
      }
      console.log(`# Finish Parsing`);
    }

    const json = JSON.stringify(wordList, null, 2);
    const blob = new Blob([json]);
    const link = document.createElement('a');
    const objUrl = URL.createObjectURL(blob);
    link.download = 'oxford5000.json';
    link.href = objUrl;
    link.click();
    URL.revokeObjectURL(objUrl);
    console.log('##### Exit oxford5000 sniffer #####');
  })();
})();
