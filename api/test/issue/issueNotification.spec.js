const chai = require('chai')
const _ = require('lodash')

const { knex } = require('../../src/db')
const { shouldNotify } = require('../../src/notification/service')
const { issueTypeToId, issueStatusToId } = require('../../src/shared/dictionary')

const { assert } = chai
const issueToDeleteId = []
async function getPersonByName(personName) {
  return knex('Person as p')
    .join('Geography as g', 'g.id', 'p.geographyId')
    .join('Job as j', 'p.id', 'j.personId')
    .join('JobContext as jc', 'jc.jobId', 'j.id')
    .where({ name: personName })
    .first(
      'p.id as personId',
      'p.lastPartnerId as partnerId',
      'p.geographyId',
      'j.jobFunctionId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'jc.siteId'
    )
}

const beforeEachForPerson = async (personName, resultInItsGeography = true, resultOutsideItsSite = false) => {
  const person = await getPersonByName(personName)

  const { id: resultId } = _.pick(
    await knex('Result as r')
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('Geography as g', 'g.id', 'd.geographyId')
      .where(builder => {
        builder.where('g.countryId', person.countryId)
        const operator = resultInItsGeography ? '=' : '<>'
        builder.andWhere('g.stateId', operator, person.stateId)
      })
      .whereNotNull('g.lgaId')
      .select('r.id')
  )

  assert.isNotNull(person)
  assert.isNotNull(resultId)
  const issueTypeId = await issueTypeToId('ResultReceived')
  const issueStatusId = await issueStatusToId('OK')

  const { siteId, geographyId } =
    !resultInItsGeography || resultOutsideItsSite
      ? _.pick(
          await knex('Site as s')
            .join('Geography as g', 'g.id', 's.geographyId')
            .where(builder => {
              builder.where('g.countryId', person.countryId)
              const operator = resultInItsGeography ? '=' : '<>'
              builder.andWhere('g.stateId', operator, person.stateId)
            })
            .whereNotNull('g.lgaId')
            .select('s.id as siteId', 'g.id as GeographyId')
        )
      : { siteId: person.siteId, geographyId: person.geographyId }
  const issueId = await knex('Issue').insert({
    partnerId: person.partnerId,
    resultId,
    siteId,
    issueTypeId,
    issueStatusId,
    createdOn: new Date(),
    updatedOn: new Date(),
    geographyId,
    data: `{"siteId": ${person.siteId}, "numberOfResults": 5}`,
  })
  issueToDeleteId.push(issueId)
  return person
}
describe.only('Issue Notification', () => {
  after(async () => {
    await knex('Issue').whereIn('id', issueToDeleteId).delete()
  })

  describe('Clinician Job Function', () => {
    let clinician
    let clinicianInDifferentSiteResult

    before(async () => {
      clinician = await beforeEachForPerson('Clinician')
      clinicianInDifferentSiteResult = await beforeEachForPerson('Clinician', false, true)
    })
    it('Should send notification to the clinician jobFunction', async () => {
      const clinicianIssueInItsSiteId = issueToDeleteId[issueToDeleteId.length - 2] // the first issue inserted in before each
      const issue = await shouldNotify(
        knex,
        { issueId: clinicianIssueInItsSiteId },
        clinician.personId,
        clinician.jobFunctionId
      )
      assert.isFalse(_.isNil(issue))
    })
    it('Should NOT send notification to the clinician jobFunction', async () => {
      const clicnicianNotItsSiteIssueId = _.last(issueToDeleteId) // the last issue inserted in before each
      const issue = await shouldNotify(
        knex,
        { issueId: clicnicianNotItsSiteIssueId },
        clinicianInDifferentSiteResult.personId,
        clinicianInDifferentSiteResult.jobFunctionId
      )
      assert.isTrue(_.isNil(issue))
    })
  })
  describe('Regional Manager Job Function', () => {
    let rm
    let rmInDifferentStateResult

    before(async () => {
      rm = await beforeEachForPerson('Regional Manager')
      rmInDifferentStateResult = await beforeEachForPerson('Regional Manager', false, true)
    })
    it('should send notification to the Regional Manager jobFunction', async () => {
      const rmIssueInItsSiteId = issueToDeleteId[issueToDeleteId.length - 2] // the first issue inserted in before each
      const issue = await shouldNotify(knex, { issueId: rmIssueInItsSiteId }, rm.personId, rm.jobFunctionId)
      assert.isFalse(_.isNil(issue))
    })
    it('should NOT send notification to the Regional Manager jobFunction', async () => {
      const rmNotItsSiteIssueId = _.last(issueToDeleteId) // the last issue inserted in before each

      const issue = await shouldNotify(
        knex,
        { issueId: rmNotItsSiteIssueId },
        rmInDifferentStateResult.personId,
        rmInDifferentStateResult.jobFunctionId
      )

      assert.isTrue(_.isNil(issue))
    })
  })
})
