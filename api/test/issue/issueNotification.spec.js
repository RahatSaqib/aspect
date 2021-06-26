const chai = require('chai')
const _ = require('lodash')
const { knex } = require('../../src/db')
const { shouldNotifyIssue } = require('../../src/notification/service')
const {
  issueTypeToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')

const { assert, expect } = chai
async function getPersonByName(personName) {
  return knex('Person as p')
    .join('Job as j', 'p.id', 'j.personId')
    .join('JobContext as jc', 'jc.jobId', 'j.id')
    .where({ name: personName })
    .first(
      'p.id as personId',
      'p.lastPartnerId as partnerId',
      'p.geographyId',
      'j.jobFunctionId',
      'jc.siteId'
    )
}
describe.only('Issue Escalation', () => {
  async function getPersonByName(personName) {
    return knex('Person as p')
      .join('Job as j', 'p.id', 'j.personId')
      .join('JobContext as jc', 'jc.jobId', 'j.id')
      .where({ name: personName })
      .first(
        'p.id as personId',
        'p.lastPartnerId as partnerId',
        'p.geographyId',
        'j.jobFunctionId',
        'jc.siteId'
      )
  }
  let clinician = {}
  let regionalOfficer = {}
  let issueToDeleteId
  beforeEach(async () => {
    clinician = await getPersonByName('Clinician')
    regionalOfficer = await getPersonByName('Galit')

    const { id: resultIdClinician } = await knex('Result')
      .where({ geographyId: clinician.geographyId })
      .first()
    const { id: resultIdRegionalOfficer } = await knex('Result')
      .where({ geographyId: regionalOfficer.geographyId })
      .first()
    assert.isNotNull(clinician)
    assert.isNotNull(resultIdClinician)
    assert.isNotNull(regionalOfficer)
    assert.isNotNull(resultIdClinician)
    const issueTypeId = await issueTypeToId('ResultReceived')
    const issueStatusId = await issueStatusToId('OK')
    ;[issueToDeleteId] = await knex('Issue').insert({
      partnerId: regionalOfficer.partnerId,
      resultId: resultIdRegionalOfficer,
      siteId: regionalOfficer.siteId,
      issueTypeId,
      issueStatusId,
      createdOn: new Date(),
      updatedOn: new Date(),
      geographyId: regionalOfficer.geographyId,
      data: '{"siteId": 54, "numberOfResults": 5}',
    })
  })

  // afterEach(async () => {
  //   await knex('Issue').where('id', issueToDeleteId).delete()
  // })

  it('should should send notification to the clinician jobFunction', async () => {
    const issue = await shouldNotifyIssue(
      knex,
      issueToDeleteId,
      regionalOfficer.personId,
      regionalOfficer.jobFunctionId
    )
    assert.isFalse(_.isNil(issue))
  })
})
