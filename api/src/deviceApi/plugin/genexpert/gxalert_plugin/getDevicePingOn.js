const _ = require('lodash')

async function getDevicePingOn({ payload, now, device: { deviceType } }) {
  if (deviceType === 'CepheidGeneXpert') {
    // If ping contained in configuration payload, use it
    // otherwise use default "now"
    return new Date(_.get(payload, 'configuration.data.lastPingOn', now))
  }

  // Always use now for GxAlert device (and any others)
  return now
}

module.exports = getDevicePingOn
