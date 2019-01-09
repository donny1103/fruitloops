const dotenv = require('dotenv').config();
const Nexmo = require('nexmo');
const cron = require('node-cron');
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTHTOKEN);
const formatTime = require('./formatTime');

function sendSMS(date,time){
  console.log('Schedule Date:', date);
  console.log('Schedule Time:', time);
  let formatedTime = formatTime(date,time);
  let text = `Wake up time is set to ${time} today`;

  // Define task object and return it
  let task = cron.schedule(formatedTime, () => {
    //nexmoSms(text);
    twilioSms(text);
  }, {
    scheduled: true,
    timezone: "America/Los_Angeles"
  });

  return task;
}

function twilioSms(text){
  client.messages.create({
    body: text,
    to: process.env.TWILIO_TO,  // Text this number
    from: process.env.TWILIO_FROM // From a valid Twilio number
  })
  .then((message) => console.log(message.sid)).done();
}

function nexmoSms(text){
  const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
  })
  const from = process.env.NEXMO_FROM;
  const to = process.env.NEXMO_TO;
  nexmo.message.sendSms(from, to, text);
}

module.exports = sendSMS;