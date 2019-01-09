const moment = require('moment');

function formatTime(time){
  let today = moment().format('l');
  let [hour, minute] = time.split(':');
  let second = time.split(':')[2] ? time.split(':')[2] : 0;
  let [month, day] = today.split('/');

  // Time format: 'second minutes hours dayofmonth month dayofweek'
  return `${second} ${minute} ${hour} ${day} ${month} *`
}

module.exports = formatTime;