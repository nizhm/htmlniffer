(() => {
  const version = 'jGuery V1.0.0'
  console.clear();
  console.log(version);
  (async () => {
    'use strict'
    // 记录是否手动跳转过来的；
    let askGoBack = false;
    const currentURL = new URL(window.location.href);
    askGoBack = currentURL.searchParams.get('type') === 'fromConfirmGo';

    /**
     * log logger
     * @param {any}
     */
      // 样式
    const style = {
      size: 'font-size:12px;',
      success: 'color: #67C23A;',
      info: 'color: #909399;',
      warn: 'color: #E6A23C;',
      fail: 'color: #F56C6C;',
      link: 'color: #409EFF;',
      bye: 'font-family: "Microsoft YaHei";font-size: 1.5em;background: -webkit-linear-gradient(left, #0f0, #00f) 0 0 no-repeat;-webkit-background-size: 100%;-webkit-background-clip: text;-webkit-text-fill-color: rgba(255, 255, 255, 0.3);'
    };
    function format(str) {
      return `%c${str}`;
    }
    function logger() {
      if (arguments.length === 1 && typeof arguments[0] === 'string') {
        console.log(...arguments, style.info + style.size);
      } else {
        console.log(...arguments);
      }
    }

    // jQuery API 网站地址
    const jQueryAPIPath = 'https://api.jquery.com/';
    // csv文件名称，会自动在后面加上文件生成时间的时间戳；
    const outputName = 'jQuery_upgrade_deprecated_and_removed_guide_';
    // removed warning selector
    const warningSelector = '.warning > p';

    // 检测环境，必须与jQueryAPIPath同域；
    // const currentOrigin = window.location.origin
    // const targetURL = new URL(jQueryAPIPath);
    // if (targetURL.origin !== currentOrigin) {
    //   logger(format('初始化失败'), style.fail + style.size);
    //   const go = confirm(`Navigate to "${targetURL.origin}"?`);
    //   if (!go) return
    //   targetURL.searchParams.append('type', 'fromConfirmGo');
    //   window.location.href = targetURL.href;
    //   return
    // }
    // 初始化；
    // setTimeout(() => {
    //   logger(format('初始化成功'), style.success + style.size);
    //   logger(format('当前域环境：'));
    //   logger(format(`\x1B[30;102;4m${targetURL.origin}\x1B[m`));
    // });

    // 工具iframe，用于请求并解析dom；最后从document中移除；
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = '';
    document.body.appendChild(iframe);

    /**
     * Fetch HTML Document From url
     *
     * @param url {string}
     * @return {Promise<Document>}
     */
    function fetchDocument(url) {
      return new Promise((resolve, reject) => {
        iframe.addEventListener(
          'load',
          () => { resolve(iframe.contentDocument); },
          { once: true }
        );
        iframe.src = url;
      });
    }

    /**
     * JSON Data to csv File Converter
     *
     * @param json {JSON} e.g.'{ header: [...], data: [{ entryTitle, entryTitleReference, row },...] }'
     * @param json.header {Array<String>} headers of csv file
     * @param json.data {Array<Array<String>>} Data in List format for each as one row information
     * @return {string} csv file name
     */
    function jsonToCSV(json) {
      // 表头行
      let str = `${json.header.join(',')}\r\n`;
      // 表正文数据
      for(const rowData of json.data) {
        str += `${rowData.join(',')}\r\n`;
      }

      const dataURL = `data:text/csv;charset=utf-8,${str}`;
      const link = document.createElement('a');
      link.href = dataURL;
      const fileName =  `${outputName}${Date.now()}.csv`;
      link.download = fileName;
      link.click();
      return fileName;
    }

    // jQuery API Document
    const APIDoc = await fetchDocument(jQueryAPIPath);
    // Removed 信息获取
    // 获取Removed url
    logger(format('+++++获取Removed信息+++++'), style.warn + style.size);
    logger(format('开始获取Removed URL'));
    const removedCategoriesList = Array.from(APIDoc.querySelector('#categories > ul').children);
    const removedURL = removedCategoriesList.find(liNode => liNode.firstChild.innerText === 'Removed').firstChild.href;
    logger(format('Removed URL:'));
    // @see https://developer.chrome.com/docs/devtools/console/format-style/#style-ansi
    logger(format(removedURL));


    // 获取Removed条目URL
    logger(format('开始获取所有Removed条目的URL'));
    const removedList = [];
    const removedDoc = await fetchDocument(removedURL);
    const entryList = Array.from(removedDoc.querySelectorAll('#content > article .entry-title > a'));
    entryList.forEach((aNode, index) => removedList.push({
      id: index + 1,
      entryTitle: aNode.innerText,
      entryTitleReference: aNode.href
    }));
    logger(format('获取Removed条目URL成功：共%i条'), style.success + style.size, removedList.length);

    // 获取Removed版本信息
    const reg = /removed in jQuery \d.\d{1,2}/;
    logger(format('开始获取removedIn对应的版本'));
    let current = 0, total = removedList.length;
    for(const item of removedList) {
      current++;
      logger(format('开始第%i/%i条'), style.info + style.size, current, total);
      const doc = await fetchDocument(item.entryTitleReference);
      const warning = doc.querySelector(warningSelector).innerText;
      item.removedIn = warning.match(reg)[0].split(' ')[3];
      logger(format('成功第%i/%i条'), style.success + style.size, current, total);
    }
    logger(format('removedIn版本信息列表：'), style.success + style.size);
    logger(removedList);

    // Deprecated信息获取
    // 获取Deprecated url
    logger(format('+++++获取Deprecated信息+++++'), style.warn + style.size);
    logger(format('开始获取Deprecated URL列表'));
    const deprecatedCategoriesList = Array.from(APIDoc.querySelector('#categories > ul').children);
    const deprecatedLiNodeList = Array.from(deprecatedCategoriesList.find(liNode => liNode.firstChild.innerText === 'Deprecated').children[1].children);
    const deprecatedList = deprecatedLiNodeList.map(liNode => {
      const aNode = liNode.firstChild;
      return {
        version: aNode.innerText.split(' ')[1],
        versionLink: aNode.href
      };
    });
    logger(format('Deprecated URL列表：'), style.success + style.size);
    logger(deprecatedList);
    logger(format('正在解析Deprecated URL列表'));

    // 获取Deprecated条目
    for(const list of deprecatedList) {
      logger(format('开始获取%s版本Deprecated条目'), style.info + style.size, list.version);
      const doc = await fetchDocument(list.versionLink);
      const arr = [];
      const entryList = Array.from(doc.querySelectorAll('#content > article .entry-title > a'));
      entryList.forEach((aNode, index) => arr.push({
        id: index + 1,
        entryTitle: aNode.innerText,
        entryTitleReference: aNode.href
      }));
      list.entryList = arr;
      logger(format('成功获取%s版本Deprecated条目：共%i条'), style.success + style.size, list.version, arr.length);
    }
    logger(format('正在合并Deprecated条目列表'));
    logger(format('Deprecated条目列表：'), style.success + style.size);
    logger(deprecatedList);

    // Version信息获取
    // 获取Version url
    logger(format('+++++获取核心Version信息+++++'), style.warn + style.size);
    logger(format('开始获取Version URL列表'));
    const versionCategoriesList = Array.from(APIDoc.querySelector('#categories > ul').children);
    const versionLiNodeList = Array.from(versionCategoriesList.find(liNode => liNode.firstChild.innerText === 'Version').children[1].children);
    let versionList = versionLiNodeList.map(liNode => {
      const aNode = liNode.firstChild;
      let version = aNode.innerText.split(' ');
      version.shift();
      version = version.join('');
      return {
        version,
        versionLink: aNode.href
      };
    });
    versionList = versionList.slice(versionList.findIndex(el => el.version === '1.3'));
    // 1.10版本网页上没有，手动添加；
    const obj10 = {
      version: '1.10',
      versionLink: 'https://blog.jquery.com/2013/05/24/jquery-1-10-0-and-2-0-1-released/'
    };
    versionList.splice(versionList.findIndex(el => el.version === '1.12&2.2'), 0, obj10);
    // 3.6版本网页上没有，手动添加；
    const obj36 = {
      version: '3.6',
      versionLink: 'https://blog.jquery.com/2021/03/02/jquery-3-6-0-released/'
    };
    versionList.push(obj36);
    logger(format('Version URL列表：'), style.success + style.size);
    logger(versionList);

    // 生成json数据
    logger(format('+++++正在生成json数据+++++'), style.warn + style.size);
    const json = {
      header: null,
      data: []
    };

    // Tips: Excel表格解析字符串时，两个双引号识别为一个；
    // 设置表头
    json.header = ['Entry', ...versionList.map(el => (`"=HYPERLINK(""${el.versionLink}"",""${el.version}"")"`))];

    // 先整理deprecatedIn和removedIn的版本信息
    class OriginDataItem {
      constructor() {
        this.entryTitle = undefined;
        this.entryTitleReference = undefined;
        this.deprecatedIn = undefined;
        this.deprecatedInReference = undefined;
        this.removedIn = undefined;
        this.removedInReference = undefined;
      }
    }
    const originData = [];
    deprecatedList.forEach(item => {
      item.entryList.forEach(el => {
        const dataItem = new OriginDataItem();
        dataItem.deprecatedIn = item.version;
        dataItem.deprecatedInReference = item.versionLink;
        dataItem.entryTitle = el.entryTitle;
        dataItem.entryTitleReference = el.entryTitleReference;
        // 检查是否removed
        const removedInfo = removedList.find(element => element.entryTitle === el.entryTitle);
        if (removedInfo) {
          dataItem.removedIn = removedInfo.removedIn;
          dataItem.removedInReference = removedInfo.entryTitleReference;
        } else {
          // 先设置一个比较大的值，方便后面比较
          dataItem.removedIn = '100.0';
        }
        originData.push(dataItem);
      });
    });
    // 整理行信息
    originData.forEach(item => {
      // 1.10用2.0替代用于比较大小；因为2.x版本没有大变动，而且1.12&2.2被特殊处理了,这个临时替代没有影响；
      const deprecatedIn = parseFloat(item.deprecatedIn === '1.10' ? '2.0' : item.deprecatedIn);
      const removedIn = parseFloat(item.removedIn === '1.10' ? '2.0' : item.removedIn);
      // 表格单行信息；
      const row = [];
      // 每个Deprecated条目对应一行；
      row.push(`"=HYPERLINK(""${item.entryTitleReference}"",""${item.entryTitle}"")"`);
      // 每个核心版本对应一个状态；只记录Deprecated和Removed状态；
      versionList.forEach(el => {
        if (el.version === '1.12&2.2') {
          // 1.12&2.2版本没有Deprecated和Removed的条目，状态值继承前一个核心版本的值；
          row.push(row[row.length -1]);
        } else {
          const version = parseFloat(el.version === '1.10' ? '2.0' : el.version);
          if (version >= removedIn) {
            // 从removedIn版本开始，状态标记为Removed；
            row.push(`"=HYPERLINK(""${item.removedInReference}"",""Removed"")"`);
          } else if (version >= deprecatedIn && version < removedIn) {
            // deprecatedIn版本开始，removedIn版本之前，状态标记为Deprecated；
            row.push(`"=HYPERLINK(""${item.deprecatedInReference}"",""Deprecated"")"`);
          } else {
            // deprecatedIn版本之前，不记录状态；
            row.push(``);
          }
        }
      });
      json.data.push(row);
    });
    logger(format('生成json数据成功：'), style.success + style.size);
    console.log(JSON.stringify(json));


    // 询问是否生成文件；
    if (confirm(`是否保存为csv文件？`)) {
      // 生成csv文件
      logger(format('+++++生成csv文件+++++'), style.warn + style.size);
      const fileName = jsonToCSV(json);
      logger(format('csv文件已生成：%s'), style.success + style.size, fileName);
    }

    // 移除工具iframe；
    document.body.removeChild(iframe);

    // 询问是否返回；
    if (askGoBack && confirm('是否返回之前的网站？')) {
      history.go(-1);
    }
    logger(format('<<<<<正在退出'), style.warn + style.size);
    setTimeout(() => {
      logger(format('后会有期>>>>>'), style.warn + style.size);
      logger(format('>>>>>Js<<<<<js>>>>>jS<<<<<'), style.bye);
    }, 600);
  })()
})();
