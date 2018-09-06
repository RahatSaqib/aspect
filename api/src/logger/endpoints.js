const { getLoggerSubscriptions } = require('./service')

const subscriptions = [getLoggerSubscriptions]

module.exports = { subscriptions }
