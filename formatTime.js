function formatTime(date,time){
  // Date time format: 1/9/2019, 13:11
  let [month, day] = date.split('/');
  let [hour, minute] = time.split(':');
  let second = time.split(':')[2] ? time.split(':')[2] : 0;
  // Time format: 'second minutes hours dayofmonth month dayofweek'
  return `${second} ${minute} ${hour} ${day} ${month} *`
}

module.exports = formatTime;