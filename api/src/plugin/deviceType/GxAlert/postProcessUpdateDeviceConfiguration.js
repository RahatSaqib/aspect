const {
  postProcessUpdateDeviceConfiguration: geneXpertPostProcessUpdateDeviceConfiguration,
} = require('../gxUtils')

async function postProcessUpdateDeviceConfiguration(context) {
  const device = await geneXpertPostProcessUpdateDeviceConfiguration(context)
  return device
}

module.exports = postProcessUpdateDeviceConfiguration
