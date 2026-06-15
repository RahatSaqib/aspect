const { assert } = require('chai')
const sinon = require('sinon')

describe('generateDeviceName - Bangladesh', () => {
  let generateDeviceName

  beforeEach(() => {
    generateDeviceName = require('../../../../src/plugin/partner/Bangladesh/generateDeviceName')
  })

  it('returns the default name for non-GeneXpert device types', async () => {
    const knex = sinon.stub()
    knex.withArgs('DeviceType').returns({
      where: () => ({
        first: async () => ({ externalId: 'molbioTruenat', name: 'Molbio Truenat' }),
      }),
    })

    const name = await generateDeviceName({ knex, deviceId: 100, deviceTypeId: 2 })

    assert.equal(name, 'MT100')
  })

  it('appends the GeneXpert module suffix for GeneXpert devices', async () => {
    const knex = sinon.stub()
    knex.withArgs('DeviceType').returns({
      where: () => ({
        first: async () => ({ externalId: 'CepheidGeneXpert', name: 'GeneXpert' }),
      }),
    })
    knex.withArgs('Device').returns({
      where: () => ({
        first: async () => ({
          moduleBayCapacity: 4,
          gx6cModulesCount: 4,
          gx10cModulesCount: null,
        }),
      }),
    })

    const name = await generateDeviceName({ knex, deviceId: 100, deviceTypeId: 1 })

    assert.equal(name, 'GX100 (4m 6c)')
  })

  it('returns the default name when GeneXpert module fields have no positive values', async () => {
    const knex = sinon.stub()
    knex.withArgs('DeviceType').returns({
      where: () => ({
        first: async () => ({ externalId: 'CepheidGeneXpert', name: 'GeneXpert' }),
      }),
    })
    knex.withArgs('Device').returns({
      where: () => ({
        first: async () => ({
          moduleBayCapacity: 0,
          gx6cModulesCount: null,
          gx10cModulesCount: null,
        }),
      }),
    })

    const name = await generateDeviceName({ knex, deviceId: 100, deviceTypeId: 1 })

    assert.equal(name, 'GX100')
  })
})
