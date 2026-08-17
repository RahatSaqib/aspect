const { assert } = require('chai')
const _ = require('lodash')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const DEVICE_API_KEY_ID = 7
const DEVICE_LOG_ID = 42

function buildKnexStub({ existingInstruments = [], createdInstrumentId = 99 }) {
  const instrumentUpdate = sinon.stub().resolves(1)
  const instrumentModuleMerge = sinon.stub().resolves()
  const instrumentModuleInsert = sinon.stub().returns({
    onConflict: sinon.stub().returns({ merge: instrumentModuleMerge }),
  })

  const knex = sinon.stub()

  // Subqueries built inside .first({ ... }) projections.
  knex.returns({ select: sinon.stub().returnsThis(), where: sinon.stub().returnsThis() })

  knex.withArgs('Instrument as i').returns({
    join: sinon.stub().returnsThis(),
    whereIn: sinon.stub().returnsThis(),
    orderBy: sinon.stub().returnsThis(),
    select: sinon.stub().resolves(existingInstruments),
  })

  knex.withArgs('DeviceApiKey as dak').returns({
    leftJoin: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis(),
    first: sinon.stub().resolves({
      partnerPluginName: 'gxconnect',
      deviceTypePluginName: 'gxconnect',
      defaultTimeZone: 'Asia/Seoul',
    }),
  })

  knex.withArgs('Instrument').returns({
    where: sinon.stub().returnsThis(),
    update: instrumentUpdate,
    first: sinon
      .stub()
      .resolves({ id: createdInstrumentId, serial: '753624', macAddress: null, letter: null, deviceId: 11 }),
  })

  knex.withArgs('InstrumentModule').returns({ insert: instrumentModuleInsert })

  knex.withArgs('DeviceLog').returns({
    where: sinon.stub().returnsThis(),
    update: sinon.stub().resolves(1),
  })

  knex.raw = sinon.stub().returnsArg(0)
  knex.select = sinon.stub().returnsThis()

  return { knex, instrumentUpdate, instrumentModuleMerge, instrumentModuleInsert }
}

function loadHandler(knex, { createDeviceFromDeviceApi }) {
  return proxyquire('../../../src/deviceApi/payloadHandlers/handleDailyDetailsPayload', {
    '../../db': { knex, transact: block => block(knex) },
    '../../shared/dictionary': { deviceTypeToId: sinon.stub().resolves(5) },
    './shared/logic': { updateDeviceConfiguration: sinon.stub().resolves() },
    '../../device/common/createDeviceFromDeviceApi': { createDeviceFromDeviceApi },
  }).handleDailyDetailsPayload
}

function buildRequest({ instruments, instrumentsLogs }) {
  const data = _.omitBy({ country: 'Bulgaria', instruments, instrumentsLogs }, _.isUndefined)
  return {
    auth: { credentials: { deviceApiKeyId: DEVICE_API_KEY_ID, partnerId: 3, deviceIds: [11] } },
    payload: { configuration: { data } },
    plugins: { messageContext: {} },
  }
}

describe('handleDailyDetailsPayload instruments', () => {
  let createDeviceFromDeviceApi

  beforeEach(() => {
    createDeviceFromDeviceApi = sinon.stub().resolves({ id: 11, name: 'GX11' })
  })

  it('does not report instruments when the payload carries none', async () => {
    const { knex } = buildKnexStub({})
    const handleDailyDetailsPayload = loadHandler(knex, { createDeviceFromDeviceApi })

    const response = await handleDailyDetailsPayload(buildRequest({}), DEVICE_LOG_ID)

    assert.notProperty(response, 'instruments')
    assert.isFalse(createDeviceFromDeviceApi.called)
  })

  it('creates a device for every unknown instrument and reports its name', async () => {
    const { knex } = buildKnexStub({ existingInstruments: [] })
    const handleDailyDetailsPayload = loadHandler(knex, { createDeviceFromDeviceApi })

    const response = await handleDailyDetailsPayload(
      buildRequest({ instruments: [{ serial_number: 753624, mac_address: '00:21:38:01:87:F0' }] }),
      DEVICE_LOG_ID
    )

    assert.deepEqual(response.instruments, [{ serialNumber: '753624', deviceName: 'GX11' }])
    assert.isTrue(createDeviceFromDeviceApi.calledOnce)
    assert.equal(createDeviceFromDeviceApi.firstCall.args[0].deviceTypeExternalId, 'CepheidGeneXpert')
  })

  it('reuses the device of a known instrument and refreshes its hardware details', async () => {
    const { knex, instrumentUpdate } = buildKnexStub({
      existingInstruments: [
        {
          id: 1,
          serial: '753624',
          macAddress: null,
          letter: null,
          version: 0,
          deviceId: 11,
          deviceName: 'GX-01',
        },
      ],
    })
    const handleDailyDetailsPayload = loadHandler(knex, { createDeviceFromDeviceApi })

    const response = await handleDailyDetailsPayload(
      buildRequest({
        instruments: [{ serial_number: 753624, mac_address: '00:21:38:01:87:F0', letter_offset: 1, version: 0 }],
      }),
      DEVICE_LOG_ID
    )

    assert.deepEqual(response.instruments, [{ serialNumber: '753624', deviceName: 'GX-01' }])
    assert.isFalse(createDeviceFromDeviceApi.called)
    // version already matches, so it stays out of the update
    assert.deepOwnInclude(instrumentUpdate.firstCall.args[0], {
      macAddress: '00:21:38:01:87:F0',
      letter: 'B',
    })
    assert.notProperty(instrumentUpdate.firstCall.args[0], 'version')
  })

  it('registers a new instrument when the serial is reported with a different mac address', async () => {
    const { knex } = buildKnexStub({
      existingInstruments: [
        { id: 1, serial: '753624', macAddress: '00:21:38:01:87:F0', deviceId: 11, deviceName: 'GX-01' },
      ],
    })
    const handleDailyDetailsPayload = loadHandler(knex, { createDeviceFromDeviceApi })

    const response = await handleDailyDetailsPayload(
      buildRequest({ instruments: [{ serial_number: 753624, mac_address: '00:21:38:01:87:F1' }] }),
      DEVICE_LOG_ID
    )

    assert.deepEqual(response.instruments, [{ serialNumber: '753624', deviceName: 'GX11' }])
    assert.isTrue(createDeviceFromDeviceApi.calledOnce)
  })

  it('reuses the instrument of a legacy payload that reports no mac address', async () => {
    const { knex } = buildKnexStub({
      existingInstruments: [
        { id: 1, serial: '753624', macAddress: '00:21:38:01:87:F0', deviceId: 11, deviceName: 'GX-01' },
      ],
    })
    const handleDailyDetailsPayload = loadHandler(knex, { createDeviceFromDeviceApi })

    const response = await handleDailyDetailsPayload(
      buildRequest({ instruments: [{ serial_number: 753624 }] }),
      DEVICE_LOG_ID
    )

    assert.deepEqual(response.instruments, [{ serialNumber: '753624', deviceName: 'GX-01' }])
    assert.isFalse(createDeviceFromDeviceApi.called)
  })

  it('keeps only the most recent log of each module', async () => {
    const { knex, instrumentModuleInsert } = buildKnexStub({
      existingInstruments: [{ id: 1, serial: '753624', macAddress: null, deviceId: 11, deviceName: 'GX-01' }],
    })
    const handleDailyDetailsPayload = loadHandler(knex, { createDeviceFromDeviceApi })

    await handleDailyDetailsPayload(
      buildRequest({
        instruments: [{ serial_number: 753624 }],
        instrumentsLogs: [
          {
            instrument_serial_number: 753624,
            site_serial_number: 210075618,
            site_name: 'B4 ',
            max_log_time: '2025-05-29T03:24:54.418Z',
            last_detail: 'Code 2120: Module B4 lost communication while module was idle',
          },
          {
            instrument_serial_number: 753624,
            site_serial_number: 210067883,
            site_name: 'B4 ',
            max_log_time: '2026-01-03T00:41:25.023Z',
            last_detail: 'Started',
          },
          {
            instrument_serial_number: 999999,
            site_serial_number: 210070431,
            site_name: 'B1 ',
            max_log_time: '2026-01-03T00:41:21.952Z',
            last_detail: 'Started',
          },
        ],
      }),
      DEVICE_LOG_ID
    )

    assert.deepEqual(instrumentModuleInsert.firstCall.args[0], [
      {
        instrumentId: 1,
        moduleName: 'B4',
        moduleSerial: '210067883',
        lastResultDate: null,
        lastLogDate: new Date('2026-01-03T00:41:25.023Z'),
        lastLogDetail: 'Started',
      },
    ])
  })
})
