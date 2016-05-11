let moment = require('moment')

module.exports = {
  getUtcNowForMySql: function(){
    return moment().utc().format('YYYY-MM-DD HH:mm:ss')
  }
}
