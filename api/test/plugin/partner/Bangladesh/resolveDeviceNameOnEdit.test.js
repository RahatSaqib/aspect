const { assert } = require('chai')
const resolveDeviceNameOnEdit = require('../../../../src/plugin/partner/Bangladesh/resolveDeviceNameOnEdit')

describe('resolveDeviceNameOnEdit - Bangladesh', () => {
  const geneXpertDeviceType = { externalId: 'CepheidGeneXpert', name: 'GeneXpert' }

  it('builds the GeneXpert module suffix from edited device data without DB access', async () => {
    const name = await resolveDeviceNameOnEdit({
      deviceId: 100,
      deviceType: geneXpertDeviceType,
      editedDevice: { moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: null },
    })

    assert.equal(name, 'GX100 (4m 6c)')
  })

  it('inserts the edited custom name part between the identifier and the module suffix', async () => {
    const name = await resolveDeviceNameOnEdit({
      deviceId: 100,
      deviceType: geneXpertDeviceType,
      editedDevice: { customNamePart: '— 1', moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: null },
    })

    assert.equal(name, 'GX100 — 1 (4m 6c)')
  })

  it('builds the base name for non-GeneXpert device types', async () => {
    const name = await resolveDeviceNameOnEdit({
      deviceId: 50,
      deviceType: { externalId: 'molbioTruenat', name: 'Molbio Truenat' },
      editedDevice: { moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: null },
    })

    assert.equal(name, 'MT50')
  })
})
