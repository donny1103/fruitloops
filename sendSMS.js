const Nexmo = require('nexmo');
const cron = require('node-cron');
const dotenv = require('dotenv').config();

function sendSMS(time){
  console.log('Schedule Time:',time);

  const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
  })
  const from = process.env.NEXMO_FROM;
  const to = process.env.NEXMO_TO;
  const text = 'Test SMS sending from Nexmo';

  // Define task object and return it
  const task = cron.schedule(time, () => {
    console.log(`Sended sms from ${from} to ${to}: ${text}`);
    nexmo.message.sendSms(from, to, text);
  }, {
    scheduled: true,
    timezone: "America/Los_Angeles"
  });

  return task;
}

module.exports = sendSMS;