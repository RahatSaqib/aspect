module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const { subDays } = require('date-fns')

const { issueTypeToId, issueStatusToId } = require('../../src/shared/dictionary')

const now = new Date()

async function seed(knex) {
  // some realistic issue data
  const issueDatas = [
    {
      issueTypeId: await issueTypeToId('TooManyInvalidResultsModule'),
      data: {
        moduleSerial: '654323',
        totalResults: 30,
        resultOutcome: 'Invalid',
        resultCategoryId: 'Invalid',
        resultsWithErrors: 7,
      },
    },
    {
      issueTypeId: await issueTypeToId('ProbeCheckTooHighLot'),
      data: {
        totalResults: 134,
        consumableLot: '12345',
        resultOutcome: 'Error',
        resultErrorCode: '5006',
        resultsWithErrors: 7,
      },
    },
    {
      issueTypeId: await issueTypeToId('ProbeCheckFailedModule'),
      data: {
        moduleSerial: '654322',
        totalResults: 20,
        resultOutcome: 'Error',
        resultErrorCode: '5017',
        resultsWithErrors: 4,
      },
    },
    {
      issueTypeId: await issueTypeToId('SignalLossDetectedInAmplificationCurveModule'),
      data: {
        moduleSerial: '654321',
        totalResults: 22,
        resultOutcome: 'Error',
        resultErrorCode: '5011',
        resultsWithErrors: 5,
      },
    },
    {
      issueTypeId: await issueTypeToId('AssaySpecificTerminationError2Lot'),
      data: {
        assayId: 15,
        totalResults: 29,
        consumableLot: '50234',
        resultOutcome: 'Error',
        resultErrorCode: '2097',
        resultsWithErrors: 4,
      },
    },
  ]

  const issueStatusId = await issueStatusToId('Active')

  const devices = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .select('d.partnerId', 'd.geographyId', 'd.siteId', 'd.deviceId')

  // seed one issue type some time in the last two months for every 6th GeneXpert device:
  const issues = _.sampleSize(devices, devices.length / 6).map(d => {
    const issueData = _.sample(issueDatas)
    const randomDate = subDays(now, _.random(1, 60))

    return {
      ...d,
      issueTypeId: issueData.issueTypeId,
      issueStatusId,
      level: 1,
      createdOn: randomDate,
      updatedOn: randomDate,
      data: JSON.stringify(issueData.data),
    }
  })

  await Promise.each(issues, issue => knex('Issue').insert(issue))
}
