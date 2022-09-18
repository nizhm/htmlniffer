class WordItem {
  static domain = 'https://www.oxfordlearnersdictionaries.com'
  static _link = 'a';
  static getLink = node => WordItem.domain + node?.querySelector(WordItem._link)?.href;
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

module.exports = WordItem;
