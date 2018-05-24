const _ = require('lodash')

async function getDevicePingOn({ payload, now }) {
  // If ping contained in configuration payload, use it
  // otherwise use default "now"
  return new Date(_.get(payload, 'configuration.data.lastPingOn', now))
}

module.exports = getDevicePingOn
