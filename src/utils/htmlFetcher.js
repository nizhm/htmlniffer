const xhr = url => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', () => resolve(xhr.response));
    xhr.addEventListener('error', err => reject(err));
    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.send();
  });
}

const xhr = url => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', () => resolve(xhr.response));
    xhr.addEventListener('error', err => reject(err));
    xhr.open('GET', url);
    xhr.responseType = 'document';
    xhr.send();
  });
}


const getHtmlFetcher = () => {
  let fetcher;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    fetcher = xhr;
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    fetcher = hp;
  }
  return fetcher;
}
