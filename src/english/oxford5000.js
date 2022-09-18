(async () => {
  const axios = require('axios');

  const { JSDOM } = require('jsdom');

  const { logger } = require('../utils/logger');

  const { listToExcel } = require('../utils/listToExcel');

  const WordItem = require('./commons/WordItem');

  const Word = require('./commons/Word');

  const url = 'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000';
  const wordListSelector = '.top-g';

  logger('##### Start oxford5000 #####');
  logger('# Fetching HTML');
  const { data } = await axios.get(url);
  logger('# HTML: -');
  logger('# Parsing Document');
  const { window: { document } } = new JSDOM(data);
  logger('# Document: -');
  logger('# Finding list');
  let wordList = document.querySelector(wordListSelector).children;
  logger(`# list: ${wordList.length}`);
  logger('# Parsing word list');
  wordList = [...wordList];
  // wordList.length = 10;
  wordList = wordList.map(li => new WordItem(li));
  logger(`# Word list: ${wordList.length}`);

  let total = wordList.length;
  let cur = 0;
  const taskBlockQueue = [];
  const taskBlockSize = 500;
  while(wordList.length) {
    taskBlockQueue.push(wordList.splice(0, taskBlockSize));
  }

  while(taskBlockQueue.length) {
    const task = taskBlockQueue.shift();

    logger(`# Fetching HTML`);
    for (const item of task) {
      cur ++;
      const { word, link } = item;
      logger(`# Currently fetching: ${word} (${cur}/${total})`);
      let data;
      try {
        const res = await axios.get(link);
        data = res.data;
      } catch(e) {
        console.trace(word + e.message);
        continue;
      }
      item.data = data;
    }
    logger(`# HTMLs`);

    logger(`# Parsing HTML`);
    for (const item of task) {
      const { data, word } = item;
      delete item.data;
      logger(`# Currently parsing: ${word}`);
      const { window: { document } } = new JSDOM(data);
      item.definition = new Word(document);
      wordList.push(item);
    }
    logger(`# Finish Parsing`);
  }

  const excelRows = [];
  for (const item of wordList) {
    const {
      alpha,
      word,
      link,
      pos,
      belong,
      definition: { senses }
    } = item;
    const rows = [];
    for(let i = 0, len = senses.length; i < len; i++) {
      if (i === 0) {
        rows.push([alpha, word, link, pos, belong, senses[i]]);
        continue;
      }
      rows.push(['', '', '', '', '', senses[i]]);
    }
    excelRows.push(...rows);
  }
  const header = [
    { header: 'alpha', width: 5 },
    { header: 'word', width: 20 },
    { header: 'link', width: 45 },
    { header: 'pos', width: 20 },
    { header: 'belong', width: 5 },
    { header: 'sense', width: 100 }
  ];
  const excelFileName = 'oxford5000';
  await listToExcel(
    header,
    excelRows,
    {
      fileName: excelFileName,
      sheetName: excelFileName,
      isSoleFile: false
    }
  );
  logger('##### Exit oxford5000 #####');
})();
