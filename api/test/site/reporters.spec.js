const _ = require('lodash')

const chai = require('chai')
const { addDays, format, isWeekend, addMinutes, subMonths, startOfMonth, endOfMonth, parseISO } = require('date-fns')
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
const { RESULT_SOURCE } = require('../../src/sample/common/constants')

const { assert } = chai

// ------------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------------
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
// ------------------------------------------------------------------------
const getLastId = async tableName => {
  const [id] = (await knex(tableName).orderBy('id', 'desc').pluck('id')) || []
  return id
}
// ------------------------------------------------------------------------
const reset = async (tableName, value, columnName = 'id') =>
  knex(tableName)
    .where(columnName, '>', value || 0)
    .delete()
// ------------------------------------------------------------------------
const getMonthDateRange = someDate => {
  const minDate = getLocalDateInUtc(startOfMonth(someDate))
  const maxDate = getLocalDateInUtc(endOfMonth(someDate))
  return {
    minDate,
    maxDate,
  }
}

describe('Reporters Dashboard - GET /site/reporters', () => {
  const path = '/api/site/reporters'

  const now = parseISO(new Date().toISOString())
  const previousMonth = subMonths(now, 1)
  const { minDate, maxDate } = getMonthDateRange(previousMonth)

  const weekDays = []
  const totalResults = 5
  let initialState = {}
  let assayGeneXpertMtbRif
  let initialCounts

  before(async () => {
    shared.checkToken(server, path)
    // -----------------------------
    // get last item id from tables we touch in test
    // -----------------------------
    initialState = {
      sampleId: await getLastId('Sample'),
      resultId: await getLastId('Result'),
      resultDownloadLogId: await getLastId('ResultDownloadLog'),
      resultStatusLogId: await getLastId('ResultStatusLog'),
      resultTreatmentStatusLogId: await getLastId('ResultTreatmentStatusLog'),
      tagId: await getLastId('Tag'),
    }
    // -----------------------------
    // get data for adding results
    // -----------------------------
    const { partnerId, userId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
    const countryAbbreviation = 'US'

    ;[assayGeneXpertMtbRif] = [await knex('Assay').where('externalId', 'GxMtbRif').first('id', 'name')]

    const device = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('State as st', 'st.id', 'g.stateId')
      .join('Lga as lg', 'lg.id', 'g.lgaId')
      .join('Country as c', 'g.countryId', 'c.id')
      .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .where('dt.externalId', 'CepheidGeneXpert')
      .whereIn('dtc.name', ['Lab', 'Integrated', 'Information System'])
      .where('d.partnerId', partnerId)
      .where('s.partnerId', partnerId)
      .where('c.abbreviation', countryAbbreviation)
      .where('da.token', 'approved')
      .first(
        'd.id as deviceId',
        'd.name as deviceName',
        'd.partnerId',
        's.geographyId',
        'd.siteId',
        'g.countryId',
        'g.stateId',
        'g.lgaId',
        's.name as siteName',
        'dt.externalId as deviceType'
      )

    // week-day dates
    for (let day = minDate; day < maxDate; day = addDays(day, 1)) {
      if (!isWeekend(day)) {
        weekDays.push(day)
      }
    }
    const { deviceId, deviceName, geographyId, siteId, siteName, countryId, stateId, lgaId, deviceType } = device

    // -----------------------------
    // add site tag 'Reportable Site'
    // -----------------------------
    const [tagId] = await knex('Tag').insert({
      title: 'Reportable Site',
    })
    initialState.tagId = tagId
    await knex('SiteTag').insert({ siteId, tagId })

    initialState.deviceId = deviceId
    initialState.deviceName = deviceName
    initialState.deviceType = deviceType
    initialState.geographyId = geographyId
    initialState.partnerId = partnerId
    initialState.siteId = siteId
    initialState.siteName = siteName
    initialState.userId = userId
    initialState.countryId = countryId
    initialState.stateId = stateId
    initialState.lgaId = lgaId

    // -----------------------------
    // fetch data before creating new results, and keep initial counts
    // -----------------------------
    initialCounts = await getInitialCounts()
    // create 5 new results
    await createResults()
  })

  after(async () => {
    // reset all data tables affected in test
    await reset('ResultDownloadLog', initialState.resultDownloadLogId)
    await reset('ResultStatusLog', initialState.resultStatusLogId)
    await reset('ResultTreatmentStatusLog', initialState.resultTreatmentStatusLogId)
    await reset('Result', initialState.resultId)
    await reset('Sample', initialState.sampleId)
    await reset('SiteTag', initialState.tagId, 'tagId')
    await reset('Tag', initialState.tagId)
  })

  // ------------------------------------------------------------------------
  const createResults = async () => {
    const { deviceId, partnerId, siteId, userId } = initialState
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
    const resultStatusIds = await allResultStatusToId()
    const resultTreatmentStatusIds = await allResultTreatmentStatusToId()

    // get sites
    const resSites = await server.get('/api/site').set('Authorization', `Bearer ${shared.token}`)
    assert.equal(resSites.status, 200)
    assert.typeOf(resSites.body, 'Object')
    assert.property(resSites.body, 'data')
    const {
      body: { data: sites },
    } = resSites

    // -----------------------------
    // insert few results for few weekdays
    // -----------------------------
    const samples = []
    const results = []
    await Promise.each(_.range(totalResults), async index => {
      const sample = {
        externalId: `SMP-TB-${format(new Date(), 'TT')}`,
        collectedOn: weekDays[index],
        sampleTypeId: sampleTypeDBSId,
        source: RESULT_SOURCE,
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
        externalId: `UQTB-${_.times(8, () => _.toUpper(_.random(36).toString(36))).join('')}`,
        assayId: assayGeneXpertMtbRif.id,
        partnerId,
        siteId,
        reportableSiteId: sample.originSiteId,
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

      // -----------------------------
      // insert ResultDownloadLog - 1st result downloaded by reporter
      // -----------------------------
      await knex('ResultDownloadLog').insert({
        resultId: resultElement.id,
        createdOn: resultElement.endedOn,
        createdBy: userId,
      })
    })

    let result = null

    // -----------------------------
    // insert ResultStatusLog - 2-nd result transferred to another site
    // -----------------------------
    const { id: anotherSiteId } = sites.find(({ id }) => id !== siteId)
    ;[, result] = results
    await knex('ResultStatusLog').insert({
      resultId: result.id,
      createdOn: result.endedOn,
      createdBy: userId,
      resultStatusId: resultStatusIds.Transfer,
      data: JSON.stringify({
        siteId: result.siteId,
        reportableSiteId: anotherSiteId,
        previousReportableSiteId: siteId,
      }),
    })
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
  }
  // ------------------------------------------------------------------------
  const getSiteReporters = async ({ minDate, maxDate, ...restFilter }) => {
    const res = await server
      .get(`${path}`)
      .query({
        minDate,
        maxDate,
        ...restFilter,
      })
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')

    const { data } = res.body
    assert.typeOf(data, 'array')

    return data
  }
  // ------------------------------------------------------------------------
  const getInitialCounts = async () => {
    // fetch sites before creating new results
    const dataBefore = await getSiteReporters({ minDate, maxDate })
    // get initial counts
    const site = dataBefore.find(({ siteId }) => siteId === initialState.siteId)
    const {
      delivered = 0,
      notPossible = 0,
      notOnTreatment = 0,
      onTreatment = 0,
      requiresTreatment = 0,
      totalResults = 0,
      transferred = 0,
    } = site || {}
    return {
      delivered,
      notPossible,
      notOnTreatment,
      onTreatment,
      requiresTreatment,
      totalResults,
      transferred,
    }
  }
  // ------------------------------------------------------------------------
  const assertBaseProps = site => {
    assert.property(site, 'countryId')
    assert.property(site, 'delivered')
    assert.property(site, 'lgaId')
    assert.property(site, 'lgaName')
    assert.property(site, 'notPossible')
    assert.property(site, 'notOnTreatment')
    assert.property(site, 'onTreatment')
    assert.property(site, 'partnerId')
    assert.property(site, 'requiresTreatment')
    assert.property(site, 'siteId')
    assert.property(site, 'siteName')
    assert.property(site, 'siteShortName')
    assert.property(site, 'stateId')
    assert.property(site, 'stateName')
    assert.property(site, 'totalResults')
    assert.property(site, 'transferred')
  }
  // ------------------------------------------------------------------------
  const assertAllCounts = (
    site,
    { delivered, notPossible, notOnTreatment, onTreatment, requiresTreatment, totalResults, transferred }
  ) => {
    // 5 results inserted AND delivered, and 1 transferred away - but we count totals WITH transferred results
    assert.equal(site.delivered, delivered + 5)
    assert.equal(site.requiresTreatment, requiresTreatment + 5)
    assert.equal(site.totalResults, totalResults + 5)

    assert.equal(site.notPossible, notPossible + 1)
    assert.equal(site.notOnTreatment, notOnTreatment + 2) // 1 AwaitingTreatment + 1 OnTreatment
    assert.equal(site.onTreatment, onTreatment + 1)
    assert.equal(site.transferred, transferred + 1)
  }
  // ------------------------------------------------------------------------
  const assertSorting = async (sortCol, sortDir = 'asc') => {
    const data = await getSiteReporters({
      minDate,
      maxDate,
      sortCol,
      sortDir,
      page: 0,
      size: 10,
    })

    assert.isAtLeast(data.length, 1)

    // get site for which we just inserted results
    const site = data.find(({ siteId }) => siteId === initialState.siteId)
    assertBaseProps(site)

    assertAllCounts(site, initialCounts)
  }

  // ------------------------------------------------------------------------
  it('should return data for Reporters Dashboard', async () => {
    // fetch sites after creating results
    const data = await getSiteReporters({ minDate, maxDate })

    // has items for at least 1 site with 5 inserted results
    assert.isAtLeast(data.length, 1)

    // get site for which we just inserted results
    const site = data.find(({ siteId }) => siteId === initialState.siteId)
    assertBaseProps(site)

    assertAllCounts(site, initialCounts)
  })

  // TODO: Fix this flakey test
  it.skip('should return data with different filters', async () => {
    // check all needed filters
    const data = await getSiteReporters({
      minDate,
      maxDate,
      countryId: initialState.countryId,
      stateId: initialState.stateId,
      lgaId: initialState.lgaId,
      siteId: initialState.siteId,
      siteName: initialState.siteName,
      deviceName: initialState.deviceName,
      deviceType: initialState.deviceType,
      assayId: assayGeneXpertMtbRif.id,
      partnerId: initialState.partnerId,
    })

    assert.isAtLeast(data.length, 1)

    // get site for which we just inserted results
    const site = data.find(({ siteId }) => siteId === initialState.siteId)
    assertBaseProps(site)

    assertAllCounts(site, initialCounts)
  })

  // ------------------------------------------------------------------------
  it('should return data with different sorting columns', async () => {
    await assertSorting('stateName')
    await assertSorting('lgaName')
    await assertSorting('partnerId')
    await assertSorting('siteId')
    await assertSorting('siteName')
    await assertSorting('siteShortName')
    // sort by counts fields
    await assertSorting('totalResults')
    await assertSorting('delivered')
    await assertSorting('requiresTreatment')
    await assertSorting('onTreatment')
    await assertSorting('notPossible')
    await assertSorting('notOnTreatment')
    await assertSorting('transferred')
  })

  // ------------------------------------------------------------------------
  it('should return empty array for incorrect filters', async () => {
    const validDateRange = { minDate, maxDate }
    const assertWrongFilter = async invalidFilter => {
      const data = await getSiteReporters({
        ...validDateRange,
        ...invalidFilter,
      })
      assert.equal(data.length, 0)
    }
    // send wrong filter values
    await assertWrongFilter({ countryId: initialState.countryId + 999999 })
    await assertWrongFilter({ stateId: initialState.stateId + 999999 })
    await assertWrongFilter({ lgaId: initialState.lgaId + 999999 })
    await assertWrongFilter({ assayId: assayGeneXpertMtbRif.id + 999999 })
    await assertWrongFilter({ siteId: initialState.siteId + 999999 })
    await assertWrongFilter({ partnerId: initialState.partnerId + 999999 })
    await assertWrongFilter({ siteName: `${initialState.siteName}__` })
    await assertWrongFilter({ deviceName: `${initialState.deviceName}__` })
    await assertWrongFilter({ deviceType: `${initialState.deviceType}__` })
  })

  // ------------------------------------------------------------------------
  it('should return all counts = 0 for another date range', async () => {
    const fewMonthsAgo = subMonths(now, 3)
    const { minDate, maxDate } = getMonthDateRange(fewMonthsAgo)
    const data = await getSiteReporters({
      minDate,
      maxDate,
    })

    // has items for at least 1 site with 5 inserted results
    assert.isAtLeast(data.length, 1)

    // get site for which we just inserted results
    const site = data.find(({ siteId }) => siteId === initialState.siteId)
    assertBaseProps(site)

    // should return all 0 - because we inserted results in another date range
    assert.equal(site.delivered, 0)
    assert.equal(site.notPossible, 0)
    assert.equal(site.notOnTreatment, 0)
    assert.equal(site.onTreatment, 0)
    assert.equal(site.requiresTreatment, 0)
    assert.equal(site.totalResults, 0)
    assert.equal(site.transferred, 0)
  })
})
