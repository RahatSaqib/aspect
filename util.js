let moment = require('moment')

module.exports = {
  // returns the current UTC date/time in a format that MySQL understands
  getUtcNowForMySql: function(){
    return moment().utc().format('YYYY-MM-DD HH:mm:ss')
  }
}
