const chai = require('chai')

const { createTestContext, createSite, postToDeviceApi } = require('./utils')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { deviceApprovalToId, deviceTypeToId } = require('../../src/shared/dictionary')

const { assert } = chai

const PARTNER = 'Partner One'
const USER = 'admin'
const KNOWN_SERIAL = '753623'
const UNKNOWN_SERIAL = '753624'

const context = createTestContext(knex, server, { user: USER, partner: PARTNER, type: 'CepheidGeneXpert' })

const dailyDetailsPayload = {
  includeDeviceConfiguration: true,
  type: { id: 'CepheidGeneXpert' },
  configuration: {
    data: {
      gxConnectInstallationId: '1c45ca6f-bd86-4ad6-b32e-dfcdb508d583',
      instruments: [
        { id: 8, version: 0, mac_address: '00:21:38:01:87:EF', serial_number: Number(KNOWN_SERIAL), letter_offset: 0 },
        {
          id: 9,
          version: 0,
          mac_address: '00:21:38:01:87:F0',
          serial_number: Number(UNKNOWN_SERIAL),
          letter_offset: 1,
        },
      ],
      instrumentsLogs: [
        {
          instrument_serial_number: Number(KNOWN_SERIAL),
          site_serial_number: 744808,
          site_name: 'A4 ',
          max_log_time: '2026-01-03T00:41:21.469Z',
          last_detail: 'Started',
        },
        {
          instrument_serial_number: Number(KNOWN_SERIAL),
          site_serial_number: 210002880,
          site_name: 'A4 ',
          max_log_time: '2025-05-29T03:24:54.418Z',
          last_detail: 'Code 2120: Module A4 lost communication while module was idle',
        },
        {
          instrument_serial_number: Number(UNKNOWN_SERIAL),
          site_serial_number: 210070431,
          site_name: 'B1 ',
          max_log_time: '2026-01-03T00:41:21.952Z',
          last_detail: 'Started',
        },
      ],
    },
  },
}

const getInstrument = serial =>
  knex('Instrument as i')
    .join('Device as d', 'd.id', 'i.deviceId')
    .where({ 'd.deviceApiKeyId': context.apiKey.id, 'i.serial': serial })
    .first('i.id', 'i.macAddress', 'i.letter', 'i.version', 'd.id as deviceId', 'd.name as deviceName')

describe('Device daily details instruments', () => {
  beforeEach(async () => {
    await context.createDeviceApiKey()

    const siteId = await createSite(knex, { partner: PARTNER, user: USER })
    context.siteIds.push(siteId)

    const now = new Date()
    const { partnerId } = await knex('Site').where('id', siteId).first('partnerId')
    const [deviceId] = await knex('Device').insert({
      partnerId,
      siteId,
      deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
      deviceApprovalId: await deviceApprovalToId('approved'),
      deviceApiKeyId: context.apiKey.id,
      name: 'GX-EXISTING',
      shortName: 'GX-EXISTING',
      configurationData: '{}',
      moduleBayCapacity: 4,
      lastSeenOn: now,
    })
    context.deviceIds.push(deviceId)

    await knex('Instrument').insert({
      deviceId,
      serial: KNOWN_SERIAL,
      active: true,
      createdOn: now,
      updatedOn: now,
    })
  })

  afterEach(context.afterEach)

  it('answers with the Aspect device name of every reported instrument', async () => {
    const { body } = await postToDeviceApi({ authHeader: context.deviceAuth, payload: dailyDetailsPayload })

    const known = await getInstrument(KNOWN_SERIAL)
    const registered = await getInstrument(UNKNOWN_SERIAL)

    assert.deepEqual(body.instruments, [
      { serialNumber: KNOWN_SERIAL, deviceName: 'GX-EXISTING' },
      { serialNumber: UNKNOWN_SERIAL, deviceName: registered.deviceName },
    ])
    // The unknown instrument is auto-registered on its own device, as it would be by its first result
    assert.notEqual(registered.deviceId, known.deviceId)
    assert.equal(registered.deviceName, `GX${registered.deviceId}`)
  })

  it('stores the hardware details reported for each instrument', async () => {
    await postToDeviceApi({ authHeader: context.deviceAuth, payload: dailyDetailsPayload })

    assert.include(await getInstrument(KNOWN_SERIAL), {
      macAddress: '00:21:38:01:87:EF',
      letter: 'A',
      version: 0,
    })
    assert.include(await getInstrument(UNKNOWN_SERIAL), {
      macAddress: '00:21:38:01:87:F0',
      letter: 'B',
      version: 0,
    })
  })

  it('projects the most recent log of each module onto InstrumentModule', async () => {
    await postToDeviceApi({ authHeader: context.deviceAuth, payload: dailyDetailsPayload })

    const { id: instrumentId } = await getInstrument(KNOWN_SERIAL)
    const modules = await knex('InstrumentModule').where('instrumentId', instrumentId).select()

    assert.lengthOf(modules, 1)
    assert.include(modules[0], {
      moduleName: 'A4',
      moduleSerial: '744808',
      lastResultDate: null,
      lastLogDetail: 'Started',
    })
    assert.equal(modules[0].lastLogDate.toISOString(), '2026-01-03T00:41:21.000Z')
  })

  it('is idempotent across daily details', async () => {
    await postToDeviceApi({ authHeader: context.deviceAuth, payload: dailyDetailsPayload })
    const { body } = await postToDeviceApi({ authHeader: context.deviceAuth, payload: dailyDetailsPayload })

    const instruments = await knex('Instrument as i')
      .join('Device as d', 'd.id', 'i.deviceId')
      .where('d.deviceApiKeyId', context.apiKey.id)
      .select('i.id')

    assert.lengthOf(instruments, 2)
    assert.lengthOf(body.instruments, 2)
  })
})
