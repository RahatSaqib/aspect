const _ = require('lodash')

const chai = require('chai')
const { addDays, format, isWeekend, addMinutes, subMonths, startOfMonth, endOfMonth, parseISO } = require('date-fns')
const Promise = require('bluebird')
const server = require('../utils/testUtils')

const { knex } = require('../../src/db')
const shared = require('../utils/sharedToken')
const { getLocalDateInUtc } = require('../../src/shared/date')
const {
  allDeviceMaintenanceStatusToId,
  allResultCategoryToId,
  allSampleTypeToId,
  allResultSourceToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')

const { assert } = chai

describe('Dashboard routes - GET /dashboard/operational-data/activity-over-time', () => {
  const path = '/api/dashboard/operational-data/activity-over-time'

  const now = parseISO(new Date().toISOString())
  const previousMonth = subMonths(now, 1)
  const minDate = getLocalDateInUtc(startOfMonth(previousMonth))
  const maxDate = getLocalDateInUtc(endOfMonth(previousMonth))

  const totalResults = 5
  let initialState = {}
  let assayGeneXpertMtbRif
  const weekDays = []
  before(async () => {
    shared.checkToken(server, path)
    // -----------------------------
    // current id's in some touched tables - to delete all
    // new records in after()
    // -----------------------------
    // helper
    const getLastId = async tableName => {
      const [id] = (await knex(tableName).orderBy('id', 'desc').pluck('id')) || []
      return id
    }
    // get last item id from tables we touch in test
    initialState = {
      sampleId: await getLastId('Sample'),
      resultId: await getLastId('Result'),
      deviceMaintenanceStatusLogId: await getLastId('DeviceMaintenanceStatusLog'),
    }
    // -----------------------------
    // get data for adding results
    // -----------------------------
    const { partnerId, userId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
    const countryAbbreviation = 'US'
    const now = new Date().toISOString()
    const auditFields = {
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    }
    const { DBS: sampleTypeDBSId } = await allSampleTypeToId()
    const { DiagnosticDevice: resultSourceDiagnosticId } = await allResultSourceToId()
    const resultTypePatientId = await resultTypeToId('Patient')
    const { Detected: resultCategoryDetectedId, NotDetected: resultCategoryNotDetectedId } =
      await allResultCategoryToId()
    const deviceMaintenanceStatusToId = await allDeviceMaintenanceStatusToId()
    ;[assayGeneXpertMtbRif] = [await knex('Assay').where('externalId', 'GxMtbRif').first('id', 'name')]
    const device = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Country as c', 'g.countryId', 'c.id')
      .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .where('dt.externalId', 'CepheidGeneXpert')
      .whereIn('dtc.name', ['Lab', 'Integrated', 'Information System'])
      .where('d.partnerId', partnerId)
      .where('s.partnerId', partnerId)
      .where('c.abbreviation', countryAbbreviation)
      .where('da.token', 'approved')
      .first('d.id', 'd.partnerId', 'd.geographyId', 'd.siteId')

    const getResultCategoryId = isDetected => {
      return isDetected ? resultCategoryDetectedId : resultCategoryNotDetectedId
    }

    // week-day dates
    for (let day = minDate; day < maxDate; day = addDays(day, 1)) {
      if (!isWeekend(day)) {
        weekDays.push(day)
      }
    }
    // -----------------------------
    // insert few results for 1st weekday (weekDays[0])
    // -----------------------------
    const { id: deviceId, geographyId, siteId } = device
    const samples = []
    await Promise.each(_.range(totalResults), async () => {
      const sample = {
        externalId: `SMP-TB-${format(new Date(), 'TT')}`,
        collectedOn: weekDays[0],
        sampleTypeId: sampleTypeDBSId,
        originSiteId: siteId,
      }
      ;[sample.id] = await knex('Sample').insert(sample)
      samples.push(sample)
    })
    await Promise.each(_.range(totalResults), async i => {
      const date = weekDays[0]
      const sample = samples[i]
      // 50% of results are 'Detected'
      const resultCategory1 = getResultCategoryId(i % 2 === 0)
      const resultCategory2 = getResultCategoryId(false)

      // -----------------------------
      // insert Result
      // -----------------------------
      const resultElement = {
        ...auditFields,
        externalId: `UQTB-${_.times(8, () => _.toUpper(_.random(36).toString(36))).join('')}`,
        assayId: assayGeneXpertMtbRif.id,
        partnerId,
        geographyId,
        siteId,
        reportableSiteId: sample.originSiteId || siteId,
        deviceId,
        resultSourceId: resultSourceDiagnosticId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${(i % 2) + 1}`,
        sampleGroup: `GRP-HIV-${i % 5}`,
        resultCategory1,
        resultCategory2,
        assayVersion: '4',
        startedOn: addMinutes(date, 100),
        endedOn: addMinutes(date, 220),
        createdOn: addMinutes(date, 220),
        updatedOn: addMinutes(date, 220),
        notes: 'This is a test... result',
      }

      await knex('Result').insert(resultElement)
    })

    // -----------------------------
    // insert DeviceMaintenanceStatusLog's
    // -----------------------------
    // helper func
    const addDmsl = async (date, deviceMaintenanceStatusId) =>
      knex('DeviceMaintenanceStatusLog').insert({
        deviceId,
        deviceMaintenanceStatusId,
        data: '{}',
        day: date,
        createdOn: getLocalDateInUtc(new Date()),
      })

    let statusId
    // for minDate we added few results - so set status 'active'
    await addDmsl(weekDays[0], deviceMaintenanceStatusToId.active)
    //

    await addDmsl(weekDays[1], deviceMaintenanceStatusToId.reportedActive)
    //
    statusId = deviceMaintenanceStatusToId.inactiveNoTestsPerformed
    await addDmsl(weekDays[2], statusId)
    await addDmsl(weekDays[3], statusId)
    //
    statusId = deviceMaintenanceStatusToId.inactiveUnknown
    await addDmsl(weekDays[4], statusId)
    await addDmsl(weekDays[5], statusId)
    await addDmsl(weekDays[6], statusId)
    //
    statusId = deviceMaintenanceStatusToId.inactiveOutOfInventory
    await addDmsl(weekDays[7], statusId)
    await addDmsl(weekDays[8], statusId)
    await addDmsl(weekDays[9], statusId)
    //
    statusId = deviceMaintenanceStatusToId.inactiveDownForRepair
    await addDmsl(weekDays[10], statusId)
    await addDmsl(weekDays[11], statusId)
    //
    statusId = deviceMaintenanceStatusToId.inactiveDecommissioned
    await addDmsl(weekDays[14], statusId)
  })

  after(async () => {
    // helper
    const reset = async (tableName, id) => knex(tableName).where('id', '>', id).delete()
    // reset all data tables affected in test
    await reset('DeviceMaintenanceStatusLog', initialState.deviceMaintenanceStatusLogId)
    await reset('Result', initialState.resultId)
    await reset('Sample', initialState.sampleId || 0)
  })

  it('should return data for Activity Over Time graph', async () => {
    const res = await server
      .get(`${path}`)
      .query({
        minDate,
        maxDate,
      })
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')

    const { data } = res.body
    data.forEach(d => {
      d.date = new Date(d.date)
    })
    assert.typeOf(data, 'array')
    // has items for at least 28 days (February)
    assert.isAtLeast(data.length, 28)

    const item = data[0]
    assert.property(item, 'date')
    //
    assert.property(item, 'devicesActive')
    assert.property(item, 'devicesInactive')
    assert.property(item, 'devicesTotal')
    //
    assert.property(item, 'inactiveUnknown')
    assert.property(item, 'inactiveNoTestsPerformed')
    assert.property(item, 'inactiveOutOfInventory')
    assert.property(item, 'inactiveDownForRepair')
    assert.property(item, 'inactiveDecommissioned')
    assert.property(item, 'isWeekendOrHoliday')

    // helper func
    const getItem = weekdayIndex =>
      data.find(({ date }) => format(date, 'yyyy-MM-dd') === format(weekDays[weekdayIndex], 'yyyy-MM-dd'))
    // ----------------
    // assert statuses to corresponding week-days by week-day indices
    // ----------------

    assert.isAtLeast(getItem(1).devicesTotal, 1)
    assert.isAtLeast(getItem(1).devicesActive, 1)
    //
    assert.isAtLeast(getItem(2).inactiveNoTestsPerformed, 1)
    assert.isAtLeast(getItem(3).inactiveNoTestsPerformed, 1)
    //
    assert.isAtLeast(getItem(4).inactiveUnknown, 1)
    assert.isAtLeast(getItem(5).inactiveUnknown, 1)
    assert.isAtLeast(getItem(6).inactiveUnknown, 1)
    //
    assert.isAtLeast(getItem(7).inactiveOutOfInventory, 1)
    assert.isAtLeast(getItem(8).inactiveOutOfInventory, 1)
    assert.isAtLeast(getItem(9).inactiveOutOfInventory, 1)
    //
    assert.isAtLeast(getItem(10).inactiveDownForRepair, 1)
    assert.isAtLeast(getItem(11).inactiveDownForRepair, 1)
    //
    assert.isAtLeast(getItem(14).inactiveDecommissioned, 1)
  })
})
