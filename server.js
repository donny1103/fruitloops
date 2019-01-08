// Dependencies
const dotenv = require('dotenv').config();
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const { SPREADSHEET_ID } = process.env;
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const moment = require('moment');
const Nexmo = require('nexmo');
const cron = require('node-cron');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Define global variables
const port = process.env.PORT || 3000;
const host = '0.0.0.0';
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
  res.send('Updated server data');
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

  // let scheduleWakeUpTime = formatScheduleTime(wakeUp.time);
  let testTime = '5:00';
  let scheduleWakeUpTime = formatScheduleTime(testTime);
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

function formatScheduleTime(time){
  let today = moment().format('l');
  let [hour, minute] = time.split(':');
  let second = time.split(':')[2] ? time.split(':')[2] : 0;
  let [day, month] = today.split('/');

  // Time format: 'second minutes hours dayofmonth month dayofweek'
  return `${second} ${minute} ${hour} ${day} ${month} *`
}

function sendSMS(time){
  console.log(time);
  const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
  })
  const from = process.env.NEXMO_PHONE;
  const to = process.env.CALLING_NUM;
  const text = 'Test SMS sending from Nexmo';

  // Define task object and return it
  const task = cron.schedule(time, () => {
    nexmo.message.sendSms(from, to, text);
    console.log(`Sended sms from ${from} to ${to}: ${text}`);
  }, {
    scheduled: true,
    timezone: "America/Los_Angeles"
  });
  return task;
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

