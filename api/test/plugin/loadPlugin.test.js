const { assert } = require('chai')
const { loadPlugin } = require('../../src/plugin/loadPlugin')
const { basePlugin } = require('../../src/plugin/plugins/basePlugin')
const { bangladeshPlugin } = require('../../src/plugin/plugins/bangladeshPlugin')

describe('loadPlugin', () => {
  it('discovers partner plugins from the plugins directory', async () => {
    const action = await loadPlugin('bangladesh', null, 'generateDeviceName')

    assert.equal(action, bangladeshPlugin.generateDeviceName)
  })

  it('falls back to the device type plugin when the partner does not override the action', async () => {
    const action = await loadPlugin('bangladesh', 'gxconnect', 'extractCustomFieldsFromPayload')

    assert.notEqual(action, basePlugin.extractCustomFieldsFromPayload)
  })

  it('falls back to the basePlugin for an unknown partner', async () => {
    // plugins removed from a customer release resolve here rather than throwing
    const action = await loadPlugin('not-a-partner', null, 'resolveDeviceNameOnEdit')

    assert.equal(action, basePlugin.resolveDeviceNameOnEdit)
  })

  it('falls back to the basePlugin when no plugin names are given', async () => {
    const action = await loadPlugin(null, null, 'resolveDeviceNameOnEdit')

    assert.equal(action, basePlugin.resolveDeviceNameOnEdit)
  })
})
