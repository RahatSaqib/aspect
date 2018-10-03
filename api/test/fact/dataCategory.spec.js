const _ = require('lodash')
const {
  subDays,
  addMilliseconds,
  startOfMonth,
  subMinutes,
} = require('date-fns')
const { assert, expect } = require('chai')
const Promise = require('bluebird')

const { queuePurge } = require('../utils/mqUtils')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const {
  processUsingHandlebarsSyntax,
} = require('../../src/stringTemplate/service')
// action creators
const { factDataCategoryLow } = require('../../src/fact/actions')
const { getDataCategoryStatus } = require('../../src/fact/service')
const { escalateIssues, resolveIssues } = require('../../src/issue/actions')
const { getPartner, getSite, cleanUpIssues } = require('../utils/issueUtils')
const { loadPlugin } = require('../../src/plugin/registration')
const {
  allResultCategoryToId,
  deviceTypeToId,
  deviceStatusToId,
  resultSourceToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')
const patients = require('../../seeds/test/fixtures/patients.json')

const totalPatients = patients.length

const USER_LU_NAME_PREFIX = 'myanmar_lab'
const USER_RO_NAME_PREFIX = 'myanmar_ro'
const USER_LU_NAME = 'myanmar_lab1'
const USER_RO_NAME = 'myanmar_ro1'

const now = new Date()
const millisInMinute = 1000 * 60
const resultTimeFrameInDays = 365
function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  const daysToSubtract =
    resultTimeFrameInDays -
    Math.ceil(currentResult / totalResults * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}

async function initUserAndJobs(knex, partnerId, siteId) {
  const init = async ({ jobFunctionName, userName }) => {
    // get JobFunction
    const { id: jobFunctionId } = await knex('JobFunction')
      .where({
        name: jobFunctionName,
        partnerId,
      })
      .first()
    // get User
    const { id: userId } = await knex('User')
      .where({ name: userName })
      .first()
    // get Person
    const { id: personId } = await knex('Person')
      .where({ userId })
      .first()
    // get (insert) Job
    let jobId
    const job = await knex('Job')
      .where({
        personId,
        jobFunctionId,
      })
      .first()
    if (job) {
      jobId = job.id
    } else {
      ;[jobId] = await knex('Job').insert({
        personId,
        jobFunctionId,
      })
    }
    // insert JobContext for new site
    const [jobContextId] = await knex('JobContext').insert({
      jobId,
      siteId,
    })
    return jobContextId
  }

  const jobContextIds = [
    await init({
      jobFunctionName: 'Regional Officer',
      userName: USER_RO_NAME,
    }),
    await init({
      jobFunctionName: 'Lab User',
      userName: USER_LU_NAME,
    }),
  ]
  return jobContextIds
}

describe('DataCategoryLow Issues Endpoint', () => {
  const partnerName = 'Myanmar'
  const countryAbbreviation = 'MM'

  let dataCategories
  let partner
  let partnerId
  let siteId
  let deviceId
  let totalValid = 0
  let issueEventIds
  let messageContext
  let samples = []
  let resultIds = []
  let jobContextIds = []
  const issueIds = []
  const categoryTokenWithIssue = 'PreviouslyTreated'
  const issueType = `DataCategoryLowFor${categoryTokenWithIssue}`

  before(async () =>
    run(async knex => {
      // get dataCategory definitions
      const pluginName = partnerName.toLowerCase()
      const plugin = (await loadPlugin([pluginName], 'dataCategories')) || {}
      ;({ dataCategories = [] } = plugin)

      // get partnerId
      partner = await getPartner(knex, partnerName)
      partnerId = partner.id
      const { id: myanmarAdminId } = await knex('User as u')
        .where('u.name', 'myanmar_admin')
        .first('u.id')

      // get 1st site for current partner
      const { s: { geographyId } } = await getSite(knex, {
        partnerId,
        countryAbbreviation,
        requireInventory: true,
      })

      // create new site for same partner and same geography
      ;[siteId] = await knex('Site').insert({
        name: 'Test Site',
        shortName: 'Test Site',
        externalId: `Test Site ${new Date().getTime()}`,
        partnerId,
        geographyId,
      })
      // for new site - create new device
      ;[deviceId] = await knex('Device').insert({
        partnerId,
        geographyId,
        siteId, // new site id
        deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
        deviceStatusId: await deviceStatusToId('approved'),
        name: 'Test Device',
        shortName: 'Test Device',
        lastSeenOn: now,
      })

      // get dictionary data
      const sampleTypeId = await sampleTypeToId('DBS')
      const resultWorkflowStatusId = await resultWorkflowStatusToId('OK')
      const resultSourceId = await resultSourceToId('Generated')
      const resultTypeId = await resultTypeToId('Patient')
      const resultMtbNumber = 100
      const {
        Detected: resultCategoryDetectedId,
      } = await allResultCategoryToId()
      const { id: assayGeneXpertMtbRifId } = await knex('Assay')
        .where({ externalId: 'GxMtbRif' })
        .first()

      samples = []
      resultIds = []
      jobContextIds = await initUserAndJobs(knex, partnerId, siteId)

      // some MTB samples:
      await Promise.all(
        _.map(_.range(resultMtbNumber / 2), async i => {
          const sample = {
            externalId: `TEST-TB-${i}`,
            collectedOn: calculateDateForResult(
              i,
              resultMtbNumber,
              millisInMinute
            ),
            sampleTypeId,
            originSiteId: siteId,
          }
          sample.id = await knex('Sample').insert(sample)
          samples.push(sample)
        })
      )

      // generate 100 new results for new device
      await Promise.all(
        _.map(_.range(resultMtbNumber), async i => {
          const sample = samples[i % samples.length]

          // get sample patient
          const patient = patients[_.random(totalPatients - 1)]

          // set values for all categories
          dataCategories.forEach(category => {
            const {
              fieldNames,
              externalId: categoryToken,
              cutoffPercentage,
              validValues,
            } = category
            if (categoryToken === categoryTokenWithIssue) {
              totalValid = cutoffPercentage - 1
            }

            if (categoryToken === 'Other') {
              const fields = JSON.parse(fieldNames)
              fields.forEach(field => {
                if (field !== 'sampleType') {
                  patient[field] = `${field} - ${i}` // not null/empty
                }
              })
            } else {
              const vals = JSON.parse(validValues)
              const value =
                categoryToken !== categoryTokenWithIssue || // set valid values to all categories except specified one ...
                i < cutoffPercentage - 1 // ...which should have valid values for less then 'cutoffPercentage' number of items (total results = 100)
                  ? vals[_.random(vals.length - 1)] // one of valid value
                  : null // or may use some of cat.invalidValues[]
              patient[fieldNames] = value
            }
          })

          const resultId = await knex('Result').insert({
            externalId: `Test-${i}`,
            assayId: assayGeneXpertMtbRifId,
            partnerId,
            geographyId,
            siteId, // new site
            deviceId, // new device
            resultWorkflowStatusId,
            resultSourceId,
            resultTypeId,
            sampleId: sample.id, // new sanple
            sampleRunNumber: `${i % 2 + 1}`,
            sampleGroup: `GRP-${i % 5}`,
            resultCategory1: resultCategoryDetectedId,
            patientData: JSON.stringify(patient),
            startedOn: subMinutes(now, 10),
            endedOn: subMinutes(now, 5),
            createdOn: now,
            createdBy: myanmarAdminId,
            updatedOn: now,
            updatedBy: myanmarAdminId,
          })
          resultIds.push(resultId)
        })
      )

      issueEventIds = []

      messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        factDataCategoryLow,
        resolveIssues,
        escalateIssues,
      })
    })
  )

  after(async () =>
    run(async knex => {
      await waitForIdle(2000)

      if (issueEventIds && issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', issueEventIds)
          .delete()
      }
      issueEventIds = []

      await cleanUpIssues(knex, issueIds)

      await knex('Result')
        .whereIn('id', resultIds)
        .delete()
      const sampleIds = samples.map(x => x.id)
      await knex('Sample')
        .whereIn('id', sampleIds)
        .delete()
      await knex('Device')
        .where('id', deviceId)
        .delete()
      await knex('JobContext')
        .whereIn('id', jobContextIds)
        .delete()
      await knex('Site')
        .where('id', siteId)
        .delete()

      await queuePurge()
    })
  )

  it('trigger DataCategoryLow issue for testing site', async () => {
    await runTestWithKnex(async knex => {
      // current month
      const period = {
        name: 'current month',
        dateFrom: startOfMonth(now),
        dateTo: now,
      }
      // get item for our testing category
      const dataCategory = dataCategories.find(
        x => x.externalId === categoryTokenWithIssue
      )
      const { externalId: categoryToken, name: categoryName } = dataCategory
      const props = { period, siteId, dataCategory }
      const periodName = period.name
      const categoryStatus = await getDataCategoryStatus(knex, props)
      const { numValid } = categoryStatus

      assert.equal(
        numValid, // this is from db
        totalValid, // this is how many valid items we inserted in before()
        `Number of results for specified data categories not match`
      )

      // percentage is less than threshold
      let { percentage } = categoryStatus
      expect(percentage).to.be.lessThan(dataCategory.cutoffPercentage)
      percentage =
        percentage < 10
          ? Math.round(10 * percentage) / 10 // ##.#
          : Math.round(percentage) // ##

      // trigger issue and wait for idle
      const payload = {
        categoryToken,
        categoryName,
        periodName,
        siteId,
        percentage,
      }
      messageContext.factDataCategoryLow(payload)
      await waitForAction(factDataCategoryLow(payload))
      await waitForIdle(2000) // 2sec to let MQ handle all db updates

      // get latest issue for curent (siteId, issueType)
      const issue = await knex('Issue as i')
        .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
        .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .innerJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
        .where({
          'i.siteId': siteId,
          'it.externalId': issueType,
        })
        .orderBy('ie.createdOn', 'desc')
        .first(
          'i.id',
          'i.level',
          'ie.id as issueEventId',
          'ie.data',
          'it.externalId as issueType',
          'is.externalId as issueStatus'
        )
      // to delete in after()
      issueEventIds.push(issue.issueEventId)
      issueIds.push(issue.id)

      // compare requested issueType with saved in db
      assert.equal(
        issue.issueType,
        issueType,
        `issue types do not match - ${issueType} and ${issue.issueType}`
      )

      // issue should have status Active
      assert.equal(
        issue.issueStatus,
        'Active',
        `issueStatus (${issue.issueStatus}) is not Active`
      )

      // get issue notifications sorted by Job Function
      const notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
        .where('n.issueId', issue.id)
        .orderBy('jf.name') // Lab User, Regional Officer
        .orderBy('nt.createdOn') // items are in same order as they happen
        .select(
          'u.name as userName',
          'jf.name as jobFunction',
          'nt.level',
          'nt.canAcknowledge',
          'am.message as alertMessage'
        )

      expect(notifications.length).to.equal(3)
      const [notifLU, notifRO1, notifRO2] = notifications

      // helper func for asserting similar things for each notification
      const assertNotif = (
        notification,
        userNamePrefix,
        jobFunction,
        level,
        canAcknowledge
      ) => {
        expect(notification.userName).to.include(userNamePrefix)
        assert.equal(notification.jobFunction, jobFunction)
        assert.equal(notification.level, level)
        assert.equal(notification.canAcknowledge, canAcknowledge)
      }
      // see /seeds/dataCategory.js for NotificationType items
      assertNotif(notifLU, USER_LU_NAME_PREFIX, 'Lab User', 1, 1)
      assertNotif(notifRO1, USER_RO_NAME_PREFIX, 'Regional Officer', 1, 1)
      assertNotif(notifRO2, USER_RO_NAME_PREFIX, 'Regional Officer', 1, 0)

      // check alert message
      assert.equal(
        notifRO1.alertMessage,
        processUsingHandlebarsSyntax(
          `Data category '{{issue.data.categoryName}}' for {{issue.data.periodName}} is low ({{issue.data.percentage}}%)`,
          {
            issue: {
              data: {
                categoryName,
                periodName,
                percentage,
              },
            },
          }
        )
      )
    })
  })
})
