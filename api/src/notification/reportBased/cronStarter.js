const { getReporBasedNotifications } = require('../common/db')
const ReportBasedNotificationCacheSingleton = require('./reportBasedNotificationCache')

const handler = (notificationTypeId) => {
  
}


module.exports = async function () {
  console.log('\x1b[1;36m', '🚀 ➜ file: cronStarter.js ➜ line 6 ➜ getReporBasedNotifications')
  const rbnList = await getReporBasedNotifications()
  console.log(
    '\x1b[1;36m',
    '🚀 ➜ file: cronStarter.js ➜ line 10 ➜ rbnList',
    rbnList.map(n => n.name)
  )
  rbnList.forEach(({ id, name, cronRecurrency }) => {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    cache.addTask(id, name, cronRecurrency, handler)
  })
}

