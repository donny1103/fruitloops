// Dependencies
const dotenv = require('dotenv').config();
const moment = require('moment');
const express = require('express');
const bodyParser = require('body-parser');
const sendSMS = require('./sendSMS');
const getSheetInfo = require('./getSheetInfo')
// Define global variables
const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0';

let today = moment().format('l');
const wakeUp = {};
const timeInterval = 4; // 1hr, time interval to update data 

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(port, host,()=>{console.log(`App listening on port ${port}!`);});

app.post('/info',(req, res) => {
  if(req.body.type === 'updateTime'){
    console.log(req.body);
    setData();
    res.status(200);
    res.send('Received request and updated server data');
  };
  
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
  // let testTime = '7:59:10';
  if (wakeUp.time){
    sendSMS(wakeUp.time);
  } else {
    console.log('Wake up time is undefined for today');
  }
}

function updateTaskInfo(){
  today = moment().format('l');
  if (wakeUp.dates && wakeUp.times){
    let todayIndex = wakeUp.dates.indexOf(today);
    wakeUp.time = wakeUp.times[todayIndex];
    let newWakeUpTime = formatScheduleTime(wakeUp.time);
    sendSMS(newWakeUpTime);
  }
  console.log('Updated task info');
}