const geneXpertPostProcessUpdateDeviceConfiguration = require('../postProcessUpdateDeviceConfiguration')

async function postProcessUpdateDeviceConfiguration(context) {
  const device = await geneXpertPostProcessUpdateDeviceConfiguration(context)
  console.log(device)
  return { device }
}

module.exports = postProcessUpdateDeviceConfiguration
