class Word {
  static _headword = '.headword';
  static _pos = '.pos';
  static _brPhons = 'div.phons_br > span';
  static _usPhons = 'div.phons_n_am > span';
  static _multiSense = '.sense[sensenum]';
  static _singleSense = '.sense';
  static _senseDef = '.def';
  static getBasic = (doc, sel) => doc?.querySelector(sel)?.innerHTML;
  static getDef = node => node?.querySelector(Word._senseDef)?.innerHTML;
  static getSenses = doc => {
    let list = doc.querySelectorAll(Word._multiSense);
    if (list.length) {
      list = [...list].map(li => Word.getDef(li));
    } else {
      list = [Word.getDef(doc?.querySelector(Word._singleSense))];
    }
    return list;
  };

  constructor(document) {
    this.word = Word.getBasic(document, Word._headword);
    console.log(this.word);
    this.pos = Word.getBasic(document, Word._pos);
    this.brPhons = Word.getBasic(document, Word._brPhons);
    this.usPhons = Word.getBasic(document, Word._usPhons);
    this.senses = Word.getSenses(document);
  }
}

module.exports = Word;
