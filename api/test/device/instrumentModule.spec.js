/**
 * Tests for the InstrumentModule projection.
 *
 * Two suites:
 *  1. recordResultModule — unit-level: call the function directly against the test DB.
 *     Covers insert, upsert (newer wins), out-of-order protection, letter change, and whitespace trim.
 *
 *  2. RESULT_LOGGED subscriber — end-to-end: post a result via the GeneXpert device API
 *     and assert that the projection is maintained by the post-commit subscriber.
 */

const { assert } = require('chai')
const { subDays } = require('date-fns')
const _ = require('lodash')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const { basicResultPayload } = require('../deviceApi/geneXpert/geneXpertConstants')
const { postToDeviceApi } = require('../deviceApi/utils')
const { waitForIdle } = require('../utils/mqUtils')
const { recordResultModule } = require('../../src/instrumentModule/recordResultModule')

// ─── shared helpers ────────────────────────────────────────────────────────────

async function getModules(instrumentId) {
  return knex('InstrumentModule')
    .where({ instrumentId })
    .orderBy('moduleName')
    .select('moduleName', 'moduleSerial', 'lastResultDate')
}

// ─── Suite 1: recordResultModule (direct) ──────────────────────────────────────

describe('InstrumentModule — recordResultModule unit tests', () => {
  // One GxConnect device+instrument shared across all tests in this suite.
  // (GxConnect context is the simplest way to get a FK-valid instrument row.)
  const INST_SERIAL = 'IM_UNIT_INST_001'

  const ctx = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: 'IM_READ unit-test device',
    macAddress: 'IMUNIT_MAC_001',
    hostId: 'IMUNIT_HOST_001',
    deviceSerialNumber: 'IMUNIT_DEV_001',
    instrumentSerial: INST_SERIAL,
  })

  before(ctx.beforeRegisterAndSetDevice)
  after(ctx.afterCleanUp)

  // Clean the projection rows between tests so each test starts fresh.
  afterEach(async () => {
    const inst = await knex('Instrument').where({ serial: INST_SERIAL, deviceId: ctx.device.id }).first('id')
    if (inst) await knex('InstrumentModule').where({ instrumentId: inst.id }).delete()
  })

  async function instrumentId() {
    const inst = await knex('Instrument').where({ serial: INST_SERIAL, deviceId: ctx.device.id }).first('id')
    assert.isOk(inst, `Instrument with serial ${INST_SERIAL} not found`)
    return inst.id
  }

  it('inserts a new row for a previously-unseen module', async () => {
    const id = await instrumentId()
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: 'A1',
      moduleSerial: 'SER001',
      endedOn: new Date('2024-01-15'),
    })

    const modules = await getModules(id)
    assert.lengthOf(modules, 1)
    assert.equal(modules[0].moduleName, 'A1')
    assert.equal(modules[0].moduleSerial, 'SER001')
  })

  it('advances lastResultDate and moduleSerial when a newer result arrives for the same module', async () => {
    const id = await instrumentId()
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: 'A1',
      moduleSerial: 'OLD',
      endedOn: new Date('2024-01-10'),
    })
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: 'A1',
      moduleSerial: 'NEW',
      endedOn: new Date('2024-01-20'),
    })

    const [row] = await getModules(id)
    assert.equal(row.moduleSerial, 'NEW')
    assert.equal(new Date(row.lastResultDate).toISOString().slice(0, 10), '2024-01-20')
  })

  it('does NOT overwrite a newer serial when an older result arrives out of order', async () => {
    const id = await instrumentId()
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: 'A1',
      moduleSerial: 'NEWER',
      endedOn: new Date('2024-01-20'),
    })
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: 'A1',
      moduleSerial: 'OLDER',
      endedOn: new Date('2024-01-10'),
    })

    const [row] = await getModules(id)
    assert.equal(row.moduleSerial, 'NEWER', 'out-of-order result must not overwrite the more-recent serial')
    assert.equal(new Date(row.lastResultDate).toISOString().slice(0, 10), '2024-01-20')
  })

  it('removes stale-letter rows when a result with a new active letter arrives', async () => {
    const id = await instrumentId()
    // Seed all four A-letter modules concurrently (no ordering dependency between them)
    await Promise.all(
      ['A1', 'A2', 'A3', 'A4'].map(name =>
        recordResultModule(knex, {
          instrumentId: id,
          moduleName: name,
          moduleSerial: 'S1',
          endedOn: new Date('2024-01-10'),
        })
      )
    )
    // Newer C-letter result: A-rows are strictly older, so they get cleaned up
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: 'C3',
      moduleSerial: 'S2',
      endedOn: new Date('2024-02-01'),
    })

    const modules = await getModules(id)
    const names = modules.map(m => m.moduleName)
    assert.include(names, 'C3', 'new-letter module must be present')
    assert.notInclude(names, 'A1', 'stale A1 must be removed after letter change')
    assert.notInclude(names, 'A2')
    assert.notInclude(names, 'A3')
    assert.notInclude(names, 'A4')
  })

  it('trims leading/trailing whitespace from moduleName before storing', async () => {
    const id = await instrumentId()
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: '  A2  ',
      moduleSerial: 'SER',
      endedOn: new Date('2024-01-15'),
    })

    const [row] = await getModules(id)
    assert.equal(row.moduleName, 'A2', 'moduleName must be stored without surrounding whitespace')
  })

  it('is a no-op when moduleName is blank after trimming', async () => {
    const id = await instrumentId()
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: '   ',
      moduleSerial: 'SER',
      endedOn: new Date('2024-01-15'),
    })

    const modules = await getModules(id)
    assert.lengthOf(modules, 0, 'blank moduleName must not produce a row')
  })

  it('is a no-op when moduleName is null', async () => {
    const id = await instrumentId()
    await recordResultModule(knex, {
      instrumentId: id,
      moduleName: null,
      moduleSerial: 'SER',
      endedOn: new Date('2024-01-15'),
    })

    const modules = await getModules(id)
    assert.lengthOf(modules, 0)
  })
})

// ─── Suite 2: RESULT_LOGGED subscriber (end-to-end) ───────────────────────────

describe('InstrumentModule — RESULT_LOGGED subscriber end-to-end', () => {
  const INST_SERIAL = 'IM_E2E_INST_001'

  const ctx = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: 'IM_READ e2e test device',
    macAddress: 'IME2E_MAC_001',
    hostId: 'IME2E_HOST_001',
    deviceSerialNumber: 'IME2E_DEV_001',
    instrumentSerial: INST_SERIAL,
  })

  // Fresh device per test so projection rows never bleed between tests.
  beforeEach(ctx.beforeRegisterAndSetDevice)
  afterEach(ctx.afterCleanUp)

  async function instrumentId() {
    const inst = await knex('Instrument').where({ serial: INST_SERIAL, deviceId: ctx.device.id }).first('id')
    return inst && inst.id
  }

  /** Post a result via the GeneXpert device API. resultId must be unique per test. */
  function postResult({ resultId, moduleName = 'A1', moduleSerial, endedOn = new Date() }) {
    const { basicDevicePayload, deviceAuth } = ctx
    return postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, basicDevicePayload, basicResultPayload, {
        result: {
          id: resultId,
          sample: { id: `sample-${resultId}` },
          patient: { id: `patient-${resultId}` },
          instrument: {
            serial: INST_SERIAL,
            module: { serial: moduleSerial, name: moduleName },
          },
          endedOn,
        },
      }),
    })
  }

  it('creates an InstrumentModule row when a result with module data is logged', async () => {
    await postResult({ resultId: 'IM-E2E-R1', moduleSerial: 'MODSER001' })
    await waitForIdle()

    const id = await instrumentId()
    assert.isOk(id, 'Instrument row must exist after result is processed')

    const modules = await getModules(id)
    assert.lengthOf(modules, 1)
    assert.equal(modules[0].moduleName, 'A1')
    assert.equal(modules[0].moduleSerial, 'MODSER001')
  })

  it('updates moduleSerial when a newer result arrives for the same module', async () => {
    await postResult({ resultId: 'IM-E2E-R2A', moduleSerial: 'SERIAL_OLD', endedOn: subDays(new Date(), 3) })
    await waitForIdle()
    await postResult({ resultId: 'IM-E2E-R2B', moduleSerial: 'SERIAL_NEW', endedOn: new Date() })
    await waitForIdle()

    const id = await instrumentId()
    const [row] = await getModules(id)
    assert.equal(row.moduleSerial, 'SERIAL_NEW', 'newer result must win the serial')
  })

  it('does not overwrite a newer serial when an older result arrives out of order', async () => {
    await postResult({ resultId: 'IM-E2E-R3A', moduleSerial: 'SERIAL_RECENT', endedOn: new Date() })
    await waitForIdle()
    await postResult({ resultId: 'IM-E2E-R3B', moduleSerial: 'SERIAL_STALE', endedOn: subDays(new Date(), 5) })
    await waitForIdle()

    const id = await instrumentId()
    const [row] = await getModules(id)
    assert.equal(row.moduleSerial, 'SERIAL_RECENT', 'older out-of-order result must not overwrite the recent serial')
  })
})
