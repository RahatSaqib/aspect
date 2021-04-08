const {
  postProcessUpdateDeviceConfiguration: geneXpertPostProcessUpdateDeviceConfiguration,
} = require('../gxUtils')

async function postProcessUpdateDeviceConfiguration(context) {
  console.warn('lalala')
  const device = await geneXpertPostProcessUpdateDeviceConfiguration(context)
  return device
}

module.exports = postProcessUpdateDeviceConfiguration
