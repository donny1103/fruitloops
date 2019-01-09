const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const { SPREADSHEET_ID } = process.env;

async function getSheetInfo() {
  const googleSheet = new GoogleSpreadsheet(SPREADSHEET_ID);
  await promisify(googleSheet.useServiceAccountAuth)(credentials);

  const sheetInfo = await promisify(googleSheet.getInfo)();
  console.log(`Loaded sheet: ${sheetInfo.title} by ${sheetInfo.author.email}`);

  const sheets = sheetInfo.worksheets;
  const sheet_RCT = sheets.filter(sheet => sheet.title === 'RTC')[0];
  // console.log(sheet_RCT)

  // Define constants
  const maxCol = sheet_RCT.colCount;
  const colmunOffset = 16;
  const dateRow = 3;
  const wakeupTimeRow = 20;

  // Define Objects
  let info = {};

  let dateArr = await promisify(sheet_RCT.getCells)({
    'min-row': dateRow,
    'max-row': dateRow,
    'min-col': colmunOffset,
    'max-col': maxCol,
    'return-empty': false,
  });

  info.wakeUpDates = dateArr.map((date)=>(date.value));
  let dateArrLength = info.wakeUpDates.length + colmunOffset - 1;

  let timeArr = await promisify(sheet_RCT.getCells)({
    'min-row': wakeupTimeRow,
    'max-row': wakeupTimeRow,
    'min-col': colmunOffset,
    'max-col': dateArrLength,
    'return-empty': true,
  });
  info.wakeUpTimes = timeArr.map((time)=>(time.value));

  return info;
}

module.exports = getSheetInfo;