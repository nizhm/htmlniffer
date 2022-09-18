const ExcelJS = require('exceljs');

const listToExcel = async (
  header = [],
  data = [],
  option
) => {
  const defaultOption = {
    fileName: 'list',
    sheetName: 'list',
    isSoleFile: true
  };
  const opt = Object.assign({}, defaultOption, option);
  const {
    fileName,
    isSoleFile,
    sheetName
  } = opt;

  const nameSuffix = isSoleFile ? `_${Date.now()}` : '';
  const output = `${__dirname}/../../output/${fileName}${nameSuffix}.xlsx`;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = header;
  sheet.addRows(data);
  await workbook.xlsx.writeFile(output);
};

module.exports = {
  listToExcel
}
