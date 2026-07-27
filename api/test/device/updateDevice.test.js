const { assert } = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

function buildKnexStub({ partnerPluginName, deviceApprovalId = 1, updatedCount = 1 }) {
  const deviceUpdate = sinon.stub().resolves(updatedCount)
  const pluginLookupFirst = sinon.stub().resolves({
    partnerPluginName,
    deviceTypePluginName: null,
  })
  const approvalFirst = sinon.stub().resolves({ deviceApprovalId })

  const knex = sinon.stub()

  knex.withArgs('Device as d').returns({
    join: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis(),
    first: pluginLookupFirst,
  })

  knex.withArgs('Device').returns({
    where: sinon.stub().returnsThis(),
    first: approvalFirst,
    update: deviceUpdate,
  })

  knex.withArgs('DeviceApprovalLog').returns({
    insert: sinon.stub().resolves(),
  })

  return { knex, deviceUpdate }
}

describe('updateDevice', () => {
  let updateDevice
  let getUser
  let getDeviceByRequest
  let showDevice
  let resolveDeviceNameOnEdit

  const baseDevice = {
    name: 'GX100',
    shortName: 'GX100',
    customNamePart: '',
    deviceType: { id: 5, externalId: 'CepheidGeneXpert', name: 'GeneXpert' },
    configurationData: {},
    deviceApprovalId: 1,
    approvalToken: null,
    siteId: 10,
  }

  const baseRequest = {
    params: { deviceId: 100 },
    payload: {
      name: 'GX100',
      shortName: 'GX100',
      moduleBayCapacity: 16,
      gx6cModulesCount: 4,
      gx10cModulesCount: 12,
      notes: 'updated notes',
      configurationData: {},
    },
    auth: { credentials: { name: 'admin' } },
  }

  beforeEach(() => {
    getUser = sinon.stub().resolves({ id: 42 })
    getDeviceByRequest = sinon.stub().resolves(baseDevice)
    showDevice = sinon.stub().resolves({ ok: true, data: baseDevice })
    resolveDeviceNameOnEdit = sinon.stub()
  })

  function loadUpdateDevice(knex) {
    return proxyquire('../../src/device/updateDevice', {
      '../db': { knex },
      '../auth/service': { getUser },
      './common/deviceNaming': { resolveDeviceNameOnEdit },
      './service': { getDeviceByRequest, showDevice },
    }).updateDevice
  }

  it('includes the plugin-resolved name in the update when it differs from the current name', async () => {
    resolveDeviceNameOnEdit.resolves('GX100 (16m, 4x6c, 12x10c)')
    const { knex, deviceUpdate } = buildKnexStub({ partnerPluginName: 'bangladesh' })
    updateDevice = loadUpdateDevice(knex)

    await updateDevice(baseRequest)

    const updatePayload = deviceUpdate.firstCall.args[0]
    assert.equal(updatePayload.name, 'GX100 (16m, 4x6c, 12x10c)')
    assert.equal(updatePayload.shortName, 'GX100 (16m, 4x6c, 12x10c)')
    assert.equal(updatePayload.notes, 'updated notes')
    assert.isTrue(
      resolveDeviceNameOnEdit.calledOnceWith({
        partnerPluginName: 'bangladesh',
        deviceTypePluginName: null,
        deviceId: 100,
        currentName: 'GX100',
        deviceType: baseDevice.deviceType,
        editedDevice: {
          customNamePart: '',
          moduleBayCapacity: 16,
          gx6cModulesCount: 4,
          gx10cModulesCount: 12,
        },
      })
    )
  })

  it('persists a trimmed customNamePart and resolves the name with it', async () => {
    resolveDeviceNameOnEdit.resolves('GX100 — 1 (16m, 4x6c, 12x10c)')
    const { knex, deviceUpdate } = buildKnexStub({ partnerPluginName: 'bangladesh' })
    updateDevice = loadUpdateDevice(knex)

    await updateDevice({ ...baseRequest, payload: { ...baseRequest.payload, customNamePart: ' — 1 ' } })

    const updatePayload = deviceUpdate.firstCall.args[0]
    assert.equal(updatePayload.customNamePart, '— 1')
    assert.equal(updatePayload.name, 'GX100 — 1 (16m, 4x6c, 12x10c)')
    assert.equal(resolveDeviceNameOnEdit.firstCall.args[0].editedDevice.customNamePart, '— 1')
  })

  it('resolves the name with the stored customNamePart when the payload omits it', async () => {
    resolveDeviceNameOnEdit.resolves('GX100')
    const { knex, deviceUpdate } = buildKnexStub({ partnerPluginName: 'bangladesh' })
    getDeviceByRequest.resolves({ ...baseDevice, customNamePart: '— 1' })
    updateDevice = loadUpdateDevice(knex)

    await updateDevice(baseRequest)

    const updatePayload = deviceUpdate.firstCall.args[0]
    assert.isUndefined(updatePayload.customNamePart)
    assert.equal(resolveDeviceNameOnEdit.firstCall.args[0].editedDevice.customNamePart, '— 1')
  })

  it('omits name fields when the plugin-resolved name matches the current name', async () => {
    resolveDeviceNameOnEdit.resolves('GX100')
    const { knex, deviceUpdate } = buildKnexStub({ partnerPluginName: 'bangladesh' })
    updateDevice = loadUpdateDevice(knex)

    await updateDevice(baseRequest)

    const updatePayload = deviceUpdate.firstCall.args[0]
    assert.notProperty(updatePayload, 'name')
    assert.notProperty(updatePayload, 'shortName')
  })

  it('uses payload name fields when the plugin returns null', async () => {
    resolveDeviceNameOnEdit.resolves(null)
    const { knex, deviceUpdate } = buildKnexStub({ partnerPluginName: 'malawi' })
    updateDevice = loadUpdateDevice(knex)

    await updateDevice(baseRequest)

    const updatePayload = deviceUpdate.firstCall.args[0]
    assert.equal(updatePayload.name, 'GX100')
    assert.equal(updatePayload.shortName, 'GX100')
  })
})
