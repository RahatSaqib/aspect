const config = require('../../config')

module.exports = async function ({ messageContext }) {
  return messageContext.run(async knex => {
    console.log('Call Uptime Robot', config.uptimerobot.api.key)
  })
}
