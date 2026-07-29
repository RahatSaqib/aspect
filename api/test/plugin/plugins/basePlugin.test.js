const { assert } = require('chai')
const { basePlugin } = require('../../../src/plugin/plugins/basePlugin')

describe('basePlugin - resolveDeviceNameOnEdit', () => {
  it('rebuilds the generated name from the device type and id', async () => {
    const name = await basePlugin.resolveDeviceNameOnEdit({
      deviceId: 101,
      deviceType: { externalId: 'CepheidGeneXpert', name: 'GeneXpert' },
      editedDevice: { customNamePart: '' },
    })

    assert.equal(name, 'GX101')
  })

  it('inserts the edited custom name part after the identifier', async () => {
    const name = await basePlugin.resolveDeviceNameOnEdit({
      deviceId: 101,
      deviceType: { externalId: 'CepheidGeneXpert', name: 'GeneXpert' },
      editedDevice: { customNamePart: '— 1' },
    })

    assert.equal(name, 'GX101 — 1')
  })
})
