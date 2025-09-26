const _ = require('lodash')

const chai = require('chai')
const chaiSubset = require('chai-subset')
const { format, addDays, subMinutes, addMinutes, subMonths } = require('date-fns')
const Promise = require('bluebird')

const { knex } = require('../../src/db')
const shared = require('../utils/sharedToken')
const {
  allResultCategoryToId,
  allSampleTypeToId,
  allResultSourceToId,
  resultTypeToId,
  messageStatusToId,
} = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')
const { RESULT_SOURCE } = require('../../src/sample/common/constants')

const { assert, expect } = chai.use(chaiSubset)
// helper func for percentages
const getPercent = (numerator, denominator) => {
  return denominator === 0 ? 0 : Math.round((100 * numerator) / denominator)
}
const getChange = (pcCurr, pcPrev = null) => {
  if (pcPrev === null) {
    return 0
  }
  return pcCurr - pcPrev
}
//
const getExpected = totalResults => {
  const cntAll = totalResults
  // total Detected are 50% of all results
  const cntPositive = Math.round(totalResults / 2)
  // total Reported via email OR sms
  let cntAllReported = 0
  // total Reported via email are 33% of all Detected results
  let cntReportedViaEmail = 0
  // total Reported via sms are 25% of all Detected results
  let cntReportedViaSms = 0
  // 50% of reported via email are reported within 2 hours
  // 50% of reported via sms are reported within 2 hours
  let cntWithin2Hours = 0
  _.range(cntPositive).forEach(i => {
    const num = i + 1
    if (num % 3 === 0 || num % 4 === 0) {
      cntAllReported += 1
      let emailWithin2Hours = false
      let smsWithin2Hours = false

      if (num % 3 === 0) {
        cntReportedViaEmail += 1
        if (cntReportedViaEmail % 2 === 0) {
          emailWithin2Hours = true
        }
      }
      if (num % 4 === 0) {
        cntReportedViaSms += 1
        if (cntReportedViaSms % 2 === 0) {
          smsWithin2Hours = true
        }
      }

      if (emailWithin2Hours || smsWithin2Hours) {
        cntWithin2Hours += 1
      }
    }
  })

  const percentPositive = getPercent(cntPositive, cntAll)
  const percentReported = getPercent(cntAllReported, cntPositive)
  const percentViaEmail = getPercent(cntReportedViaEmail, cntAllReported)
  const percentViaSms = getPercent(cntReportedViaSms, cntAllReported)
  const percentWithin2Hours = getPercent(cntWithin2Hours, cntAllReported)

  return {
    cntAll,
    cntPositive,
    cntAllReported,
    cntReportedViaEmail,
    cntReportedViaSms,
    cntWithin2Hours,
    percentPositive,
    percentReported,
    percentViaEmail,
    percentViaSms,
    percentWithin2Hours,
  }
}
describe.skip('Dashboard routes - GET /api/dashboard/results-transmitted', () => {
  const path = '/api/dashboard/results-transmitted'
  let initialState = {}

  shared.checkToken(server, path)

  const currentMonthStr = '2009-09-01T00:00:00.000Z'
  const currentMonth = new Date(currentMonthStr)
  const dataToSeed = [
    // mid of current month
    {
      midMonth: addDays(currentMonth, 15),
      totalResults: 200,
    },
    // mid of prevuous month
    {
      midMonth: subMonths(addDays(currentMonth, 15), 1),
      totalResults: 100,
    },
  ]

  let assayGeneXpertMtbRif
  before(async () => {
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
      deviceId: await getLastId('Device'),
      sampleId: await getLastId('Sample'),
      resultId: await getLastId('Result'),
    }
    // -----------------------------
    // get data for adding results
    // -----------------------------
    const { partnerId, userId, personId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
    const countryAbbreviation = 'US'
    const siteDatas = await knex('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Country as c', 'g.countryId', 'c.id')
      .where('s.partnerId', partnerId)
      .where('c.abbreviation', countryAbbreviation)
      .select('s.*')
    const now = new Date()
    const auditFields = {
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    }
    const { DBS: sampleTypeDBSId } = await allSampleTypeToId()
    const { DiagnosticDevice: resultSourceDiagnosticId } = await allResultSourceToId()
    const resultTypePatientId = await resultTypeToId('Patient')
    const messageStatusSentId = await messageStatusToId('Sent')
    const { Detected: resultCategoryDetectedId, NotDetected: resultCategoryNotDetectedId } =
      await allResultCategoryToId()
    const [deviceTypeGeneXpertId] = await knex('DeviceType').where('externalId', 'CepheidGeneXpert').pluck('id')
    ;[assayGeneXpertMtbRif] = [await knex('Assay').where('externalId', 'GxMtbRif').first('id', 'name')]
    const [emailTemplateId] = await knex('EmailTemplate').pluck('id')
    const [smsTemplateId] = await knex('SmsTemplate').pluck('id')
    // get existing device
    let device = await knex('Device')
      .where({ deviceTypeId: deviceTypeGeneXpertId, partnerId })
      .whereIn('siteId', _.map(siteDatas, 'id'))
      .first()
    // create new device and get it's deviceId
    const [deviceId] = await knex('Device').insert({
      ..._.omit(device, ['id']),
    })
    device = await knex('Device as d')
      .leftJoin('Site as s', 's.id', 'd.siteId')
      .where('d.id', deviceId)
      .first('d.id', 'd.partnerId', 's.geographyId', 'd.siteId')

    const getResultCategoryId = isDetected => {
      return isDetected ? resultCategoryDetectedId : resultCategoryNotDetectedId
    }

    // -----------------------------
    // insert 100 results - with resultCategoryN like
    // 50% are ('Detected','NotDetected')
    // 25% are ('Detected','Detected')
    // -----------------------------
    const { siteId } = device
    await Promise.each(dataToSeed, async ({ midMonth, totalResults }) => {
      const getRandomDate = () => new Date(`${format(midMonth, 'yyyy-MM')}-01T01:00:00.000Z`)
      const samples = []
      await Promise.each(_.range(totalResults), async () => {
        const sample = {
          externalId: `SMP-TB-${format(new Date(), 'TT')}`,
          collectedOn: getRandomDate(),
          source: RESULT_SOURCE,
          sampleTypeId: sampleTypeDBSId,
          originSiteId: siteId,
        }
        ;[sample.id] = await knex('Sample').insert(sample)
        samples.push(sample)
      })
      let totalPositive = 0
      let totalViaEmail = 0
      let totalViaSms = 0
      await Promise.each(_.range(totalResults), async i => {
        const randomDate = getRandomDate()
        const sample = samples[i]
        // 50% of results are 'Detected'
        const resultCategory1 = getResultCategoryId(i % 2 === 0)
        let resultCategory2 = getResultCategoryId(false)
        if (resultCategory1 === resultCategoryDetectedId) {
          totalPositive += 1

          // 50% of 'Detected' are Rif+
          if (totalPositive % 2 === 0) {
            resultCategory2 = getResultCategoryId(true)
          }
        }

        // -----------------------------
        // insert Result
        // -----------------------------
        const resultElement = {
          ...auditFields,
          externalId: `UQTB-${_.times(8, () => _.toUpper(_.random(36).toString(36))).join('')}`,
          assayId: assayGeneXpertMtbRif.id,
          partnerId,
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
          startedOn: subMinutes(randomDate, 100),
          endedOn: randomDate,
          createdOn: subMinutes(randomDate, 90),
          updatedOn: subMinutes(randomDate, 90),
          notes: 'This is a test... result',
        }

        const [resultId] = await knex('Result').insert(resultElement)

        if (resultCategory1 === resultCategoryDetectedId) {
          const [resultReceivedId] = await knex('IssueType').where({ externalId: 'ResultReceived' }).pluck('id')
          const [notificationId] = await knex('Notification').insert({
            notificationTypeId: resultReceivedId,
            resultId,
            personId,
            createdOn: new Date(),
          })

          const propsEmailSms = {
            messageStatusId: messageStatusSentId,
            personId,
            siteId,
            deviceId,
            resultId,
          }
          // -----------------------------
          // insert EmailMessage for 33% of Detected
          // -----------------------------
          if (totalPositive % 3 === 0) {
            totalViaEmail += 1
            // 50% of reported via email are reported within 2 hours
            const date = addMinutes(randomDate, totalViaEmail % 2 === 0 ? 60 : 180)
            const [emailMessageId] = await knex('EmailMessage').insert({
              emailTemplateId,
              ...propsEmailSms,
              createdOn: date,
              updatedOn: date,
            })

            await knex('Notification').where({ id: notificationId }).update({
              emailMessageId,
            })
          }

          // -----------------------------
          // insert SmsMessage for 25% of Detected
          // -----------------------------
          if (totalPositive % 4 === 0) {
            totalViaSms += 1
            // 50% of reported via sms are reported within 2 hours
            const date = addMinutes(randomDate, totalViaSms % 2 === 0 ? 60 : 180)
            const [smsMessageId] = await knex('SmsMessage').insert({
              smsTemplateId,
              ...propsEmailSms,
              createdOn: date,
              updatedOn: date,
            })

            await knex('Notification').where({ id: notificationId }).update({
              smsMessageId,
            })
          }
        }
      })
    })
  })

  after(async () => {
    // helper
    const reset = async (tableName, idName, id = 0) => knex(tableName).where(idName, '>', id).delete()
    // reset all data tables affected in test
    await reset('Notification', 'resultId', initialState.resultId)
    await reset('EmailMessage', 'resultId', initialState.resultId)
    await reset('SmsMessage', 'resultId', initialState.resultId)
    await reset('Result', 'id', initialState.resultId)
    await reset('Sample', 'id', initialState.sampleId)
    await reset('Device', 'id', initialState.deviceId)
  })

  it('should return data for Results Transmitted graph', async () => {
    const res = await server
      .get(`${path}`)
      .query({
        currentMonth: currentMonthStr,
      })
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.property(res.body, 'currentMonth')

    const { data } = res.body
    assert.typeOf(data, 'array')
    // minimum 1 assay for current month
    assert.isAtLeast(data.length, 1)

    const item = data.find(({ assayName }) => assayName === assayGeneXpertMtbRif.name)
    assert.property(item, 'assayName')
    //
    assert.property(item, 'cntAll')
    assert.property(item, 'cntPositive')
    assert.property(item, 'cntReportedViaEmail')
    assert.property(item, 'cntReportedViaSms')
    assert.property(item, 'cntAllReported')
    assert.property(item, 'cntWithin2Hours')
    //
    assert.property(item, 'percentPositive')
    assert.property(item, 'percentReported')
    assert.property(item, 'percentViaEmail')
    assert.property(item, 'percentViaSms')
    assert.property(item, 'percentWithin2Hours')
    //
    assert.property(item, 'percentPositiveChange')
    assert.property(item, 'percentReportedChange')
    assert.property(item, 'percentViaEmailChange')
    assert.property(item, 'percentViaSmsChange')
    assert.property(item, 'percentWithin2HoursChange')
    // counts for current month
    const curr = getExpected(dataToSeed[0].totalResults)
    // counts for previous month
    const prev = getExpected(dataToSeed[1].totalResults)

    // changes since previous month
    curr.percentPositiveChange = getChange(curr.percentPositive, prev.percentPositive)
    curr.percentReportedChange = getChange(curr.percentReported, prev.percentReported)
    curr.percentViaEmailChange = getChange(curr.percentViaEmail, prev.percentViaEmail)
    curr.percentViaSmsChange = getChange(curr.percentViaSms, prev.percentViaSms)
    curr.percentWithin2HoursChange = getChange(curr.percentWithin2Hours, prev.percentWithin2Hours)

    expect(item).to.containSubset({
      cntAll: curr.cntAll,
      cntPositive: curr.cntPositive,
      cntAllReported: curr.cntAllReported,
      cntReportedViaEmail: curr.cntReportedViaEmail,
      cntReportedViaSms: curr.cntReportedViaSms,
      cntWithin2Hours: curr.cntWithin2Hours,

      percentPositive: curr.percentPositive,
      percentReported: curr.percentReported,
      percentViaEmail: curr.percentViaEmail,
      percentViaSms: curr.percentViaSms,
      percentWithin2Hours: curr.percentWithin2Hours,

      percentPositiveChange: curr.percentPositiveChange,
      percentReportedChange: curr.percentReportedChange,
      percentViaEmailChange: curr.percentViaEmailChange,
      percentViaSmsChange: curr.percentViaSmsChange,
      percentWithin2HoursChange: curr.percentWithin2HoursChange,
    })
  })
})
