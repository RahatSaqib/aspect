const { assert } = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

describe('resolveDeviceNameOnEdit - deviceNaming', () => {
  let resolveDeviceNameOnEdit
  let loadPlugin
  let pluginResolve

  beforeEach(() => {
    pluginResolve = sinon.stub()
    loadPlugin = sinon.stub().resolves(pluginResolve)

    const deviceNaming = proxyquire('../../../src/device/common/deviceNaming', {
      '../../plugin/loadPlugin': { loadPlugin },
    })
    resolveDeviceNameOnEdit = deviceNaming.resolveDeviceNameOnEdit
  })

  it('delegates to the loaded plugin action', async () => {
    pluginResolve.resolves('GX100 (4m 6c)')

    const result = await resolveDeviceNameOnEdit({
      partnerPluginName: 'bangladesh',
      deviceTypePluginName: null,
      deviceId: 100,
      currentName: 'GX100',
      deviceType: { externalId: 'CepheidGeneXpert' },
      editedDevice: { moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: null },
    })

    assert.equal(result, 'GX100 (4m 6c)')
    assert.isTrue(loadPlugin.calledOnceWith('bangladesh', null, 'resolveDeviceNameOnEdit'))
    assert.isTrue(
      pluginResolve.calledOnceWith({
        deviceId: 100,
        currentName: 'GX100',
        deviceType: { externalId: 'CepheidGeneXpert' },
        editedDevice: { moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: null },
      }),
    )
  })
})
