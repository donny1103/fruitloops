// Dependencies
const dotenv = require('dotenv').config();
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const moment = require('moment');
const express = require('express');
const bodyParser = require('body-parser');
const sendSMS = require('./sendSMS');
const formatTime = require('./formatTime');
const cron = require('node-cron');
// Define global variables
const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0';
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const { SPREADSHEET_ID } = process.env;
let sendMsgTask;
let today = moment().format('l');
const wakeUp = {};
const timeInterval = 4; // 1hr, time interval to update data 

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(port, host,()=>{console.log(`App listening on port ${port}!`);});

app.post('/info',(req, res) => {
  getSheetInfo();
  res.status(200);
  res.send('Received request and updated server data');
});

// Initialized data
setData();

// repeatively checking date change and schedule new task, i.e. next notification task
setInterval(updateTaskInfo, timeInterval*60*60*1000);

async function setData(){
  let info = await getSheetInfo();
  wakeUp.dates = info.wakeUpDates;
  wakeUp.times = info.wakeUpTimes;
  let todayIndex = wakeUp.dates.indexOf(today);
  wakeUp.time = wakeUp.times[todayIndex];

  let scheduleWakeUpTime = formatTime(wakeUp.time);
  // let testTime = '7:59:10';
  // let scheduleWakeUpTime = formatTime(testTime);
  sendMsgTask = sendSMS(scheduleWakeUpTime);

}

function updateTaskInfo(){
  today = moment().format('l');
  if (wakeUp.dates && wakeUp.times){
    let todayIndex = wakeUp.dates.indexOf(today);
    wakeUp.time = wakeUp.times[todayIndex];
    let newWakeUpTime = formatScheduleTime(wakeUp.time);
    sendMsgTask = sendSMS(newWakeUpTime);
  }
  console.log('Updated task info');
}

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

