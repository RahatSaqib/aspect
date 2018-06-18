const _ = require('lodash')
const { getDateOrDefault } = require('../../../../shared/date')

async function getDeviceSeenOn({ payload, now, device: { deviceType } }) {
  if (deviceType === 'CepheidGeneXpert') {
    // if config data is set to inactive=true, consider device *not* seen
    // in all other cases, inactive = true or not set, we do consider
    // it seen (the default when using device API)
    const inactive = _.get(payload, 'configuration.data.inactive', null)
    if (inactive === true) {
      return null
    }
    // If ping contained in configuration payload, use it as last seen
    // for GeneXpert device otherwise use default "now"
    return getDateOrDefault(payload, 'configuration.data.lastPingOn', now)
  }

  // Always use now for GxAlert device (and any others)
  return now
}

module.exports = getDeviceSeenOn
