const _ = require('lodash')

async function getDeviceSeenOn({ payload, now }) {
  // if config data is set to inactive=true, consider device *not* seen
  // in all other cases, inactive = true or not set, we do consider
  // it seen (the default when using device API)
  const inactive = _.get(payload, 'configuration.data.inactive', null)
  return inactive === true ? null : now
}

module.exports = getDeviceSeenOn
