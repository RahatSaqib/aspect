const geneXpertPostProcessUpdateDeviceConfiguration = require('../postProcessUpdateDeviceConfiguration')

async function postProcessUpdateDeviceConfiguration(context) {
  const device = await geneXpertPostProcessUpdateDeviceConfiguration(context)
  return device
}

module.exports = postProcessUpdateDeviceConfiguration
