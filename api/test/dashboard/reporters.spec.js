const _ = require('lodash')

const chai = require('chai')
const {
  addDays,
  format,
  isWeekend,
  addMinutes,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} = require('date-fns')
const Promise = require('bluebird')
const server = require('../utils/testUtils')

const { knex } = require('../../src/db')
const shared = require('../utils/sharedToken')
const { getLocalDateInUtc } = require('../../src/shared/date')
const {
  allResultCategoryToId,
  allSampleTypeToId,
  allResultSourceToId,
  resultTypeToId,
  allResultStatusToId,
  allResultTreatmentStatusToId,
} = require('../../src/shared/dictionary')

const { assert } = chai

// ------------------------
// helpers
// ------------------------
const addRtsl = async (result, userId, resultTreatmentStatusId) => {
  const [treatmentStatusLogId] = await knex('ResultTreatmentStatusLog').insert({
    resultId: result.id,
    changedOn: addMinutes(result.endedOn, 30),
    createdOn: result.endedOn,
    createdBy: userId,
    resultTreatmentStatusId,
  })
  await knex('Result')
    .update({
      treatmentStatusLogId,
    })
    .where('id', result.id)
}
// ------------------------
const getLastId = async tableName => {
  const [id] = (await knex(tableName).orderBy('id', 'desc').pluck('id')) || []
  return id
}
// ------------------------
const reset = async (tableName, id) =>
  knex(tableName)
    .where('id', '>', id || 0)
    .delete()
// ------------------------

describe('Reporters Dashboard - GET /dashboard/site-reporters', () => {
  const path = '/api/dashboard/site-reporters'
  shared.checkToken(server, path)

  const now = parseISO(new Date().toISOString())
  const previousMonth = subMonths(now, 1)
  const minDate = getLocalDateInUtc(startOfMonth(previousMonth))
  const maxDate = getLocalDateInUtc(endOfMonth(previousMonth))

  const totalResults = 5
  let initialState = {}
  let assayGeneXpertMtbRif
  const weekDays = []
  before(async () => {
    // -----------------------------
    // get last item id from tables we touch in test
    // -----------------------------
    initialState = {
      sampleId: await getLastId('Sample'),
      resultId: await getLastId('Result'),
      resultDownloadLogId: await getLastId('ResultDownloadLog'),
      resultStatusLogId: await getLastId('ResultStatusLog'),
      resultTreatmentStatusLogId: await getLastId('ResultTreatmentStatusLog'),
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
    const {
      DiagnosticDevice: resultSourceDiagnosticId,
    } = await allResultSourceToId()
    const resultTypePatientId = await resultTypeToId('Patient')
    const {
      Detected: resultCategoryDetectedId,
      NotDetected: resultCategoryNotDetectedId,
    } = await allResultCategoryToId()
    const resultStatusIds = await allResultStatusToId()
    const resultTreatmentStatusIds = await allResultTreatmentStatusToId()
    ;[assayGeneXpertMtbRif] = [
      await knex('Assay').where('externalId', 'GxMtbRif').first('id', 'name'),
    ]
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

    // get sites
    const resSites = await server
      .get('/api/site')
      .set('Authorization', `Bearer ${shared.token}`)
    assert.equal(resSites.status, 200)
    assert.typeOf(resSites.body, 'Object')
    assert.property(resSites.body, 'data')
    const {
      body: { data: sites },
    } = resSites

    // week-day dates
    for (let day = minDate; day < maxDate; day = addDays(day, 1)) {
      if (!isWeekend(day)) {
        weekDays.push(day)
      }
    }
    // -----------------------------
    // insert few results for few weekdays
    // -----------------------------
    const { id: deviceId, geographyId, siteId } = device
    initialState.siteId = siteId
    const samples = []
    const results = []
    await Promise.each(_.range(totalResults), async index => {
      const sample = {
        externalId: `SMP-TB-${format(new Date(), 'TT')}`,
        collectedOn: weekDays[index],
        sampleTypeId: sampleTypeDBSId,
        originSiteId: siteId,
      }
      ;[sample.id] = await knex('Sample').insert(sample)
      samples.push(sample)

      const date = weekDays[index]

      // -----------------------------
      // insert Result
      // -----------------------------
      const resultElement = {
        ...auditFields,
        externalId: `UQTB-${_.times(8, () =>
          _.toUpper(_.random(36).toString(36))
        ).join('')}`,
        assayId: assayGeneXpertMtbRif.id,
        partnerId,
        geographyId,
        siteId,
        reportableSiteId: sample.originSiteId, // || siteId,
        deviceId,
        resultSourceId: resultSourceDiagnosticId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        sampleRunNumber: `${(index % 2) + 1}`,
        sampleGroup: `GRP-HIV-${index % 5}`,
        resultCategory1: resultCategoryDetectedId,
        resultCategory2: resultCategoryNotDetectedId,
        assayVersion: '4',
        startedOn: addMinutes(date, 100),
        endedOn: addMinutes(date, 220),
        createdOn: addMinutes(date, 220),
        updatedOn: addMinutes(date, 220),
        notes: 'This is a test... result',
      }

      ;[resultElement.id] = await knex('Result').insert(resultElement)
      results.push(resultElement)
    })

    let result = null

    // -----------------------------
    // insert ResultDownloadLog - 1st result downloaded by reporter
    // -----------------------------
    ;[result] = results
    await knex('ResultDownloadLog').insert({
      resultId: result.id,
      createdOn: result.endedOn,
      createdBy: userId,
    })

    // -----------------------------
    // insert ResultStatusLog - 2-nd result transferred to another site
    // -----------------------------
    ;[, result] = results
    await knex('ResultStatusLog').insert({
      resultId: result.id,
      createdOn: result.endedOn,
      createdBy: userId,
      resultStatusId: resultStatusIds.Transfer,
    })
    const { id: anotherSiteId } = sites.find(({ id }) => id !== siteId)
    await knex('Result')
      .update({
        reportableSiteId: anotherSiteId,
      })
      .where('id', result.id)
    // -----------------------------
    // insert ResultTreatmentStatusLog
    // -----------------------------
    // 3-rd result - OnTreatment
    ;[, , result] = results
    await addRtsl(result, userId, resultTreatmentStatusIds.OnTreatment)
    // 4-th result - NotPossible
    ;[, , , result] = results
    await addRtsl(result, userId, resultTreatmentStatusIds.NotPossible)
    // 5-th result - AwaitingTreatment
    ;[, , , , result] = results
    await addRtsl(result, userId, resultTreatmentStatusIds.AwaitingTreatment)
  })

  after(async () => {
    // reset all data tables affected in test
    await reset('ResultDownloadLog', initialState.resultDownloadLogId)
    await reset('ResultStatusLog', initialState.resultStatusLogId)
    await reset(
      'ResultTreatmentStatusLog',
      initialState.resultTreatmentStatusLogId
    )
    await reset('Result', initialState.resultId)
    await reset('Sample', initialState.sampleId || 0)
  })

  it('should return data for Reporters Dashboard', async () => {
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
    assert.typeOf(data, 'array')

    // has items for at least 1 site with 5 inserted results
    assert.isAtLeast(data.length, 1)

    const item = data[0]
    assert.property(item, 'countryId')
    assert.property(item, 'delivered')
    assert.property(item, 'lgaId')
    assert.property(item, 'lgaName')
    assert.property(item, 'notPossible')
    assert.property(item, 'notOnTreatment')
    assert.property(item, 'onTreatment')
    assert.property(item, 'partnerId')
    assert.property(item, 'requiresTreatment')
    assert.property(item, 'siteId')
    assert.property(item, 'siteName')
    assert.property(item, 'siteShortName')
    assert.property(item, 'stateId')
    assert.property(item, 'stateName')
    assert.property(item, 'totalResults')
    assert.property(item, 'transferred')

    // get site for which we just inserted results
    const site = data.find(({ siteId }) => siteId === initialState.siteId)
    // it should contain all counts
    assert.isAtLeast(site.delivered, 1)
    assert.isAtLeast(site.notPossible, 1)
    assert.isAtLeast(site.notOnTreatment, 1)
    assert.isAtLeast(site.onTreatment, 1)
    assert.isAtLeast(site.requiresTreatment, 1)
    assert.isAtLeast(site.totalResults, 1)
    assert.isAtLeast(site.transferred, 1)
  })
})
