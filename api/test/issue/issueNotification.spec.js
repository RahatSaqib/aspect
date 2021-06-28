const chai = require('chai')
const _ = require('lodash')

const { knex } = require('../../src/db')
const { shouldNotifyIssue } = require('../../src/notification/service')
const {
  issueTypeToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')

const { assert, expect } = chai
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

const beforeEachForPerson = async (
  personName,
  resultInItsGeography = true,
  resultOutsideItsSite = false
) => {
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
describe.only('Issue Escalation', () => {
  // afterEach(async () => {
  //   await knex('Issue').whereIn('id', issueToDeleteId).delete()
  // })

  describe('Clinician Job Function', () => {
    let clinician

    beforeEach(async () => {
      clinician = await beforeEachForPerson('Clinician')
    })
    it('should should send notification to the clinician jobFunction', async () => {
      const issue = await shouldNotifyIssue(
        knex,
        _.last(issueToDeleteId),
        clinician.personId,
        clinician.jobFunctionId
      )
      assert.isFalse(_.isNil(issue))
    })
  })
  describe('Regional Manager Job Function', () => {
    let rm
    let rmInDifferentStateResult

    beforeEach(async () => {
      rm = await beforeEachForPerson('Regional Manager')
      rmInDifferentStateResult = await beforeEachForPerson(
        'Regional Manager',
        false,
        true
      )
    })
    it('should send notification to the Regional Manager jobFunction', async () => {
      const issue = await shouldNotifyIssue(
        knex,
        issueToDeleteId[issueToDeleteId.length - 2],
        rm.personId,
        rm.jobFunctionId
      )
      assert.isFalse(_.isNil(issue))
    })
    it('should not send notification to the Regional Manager jobFunction', async () => {
      const issue = await shouldNotifyIssue(
        knex,
        _.last(issueToDeleteId),
        rmInDifferentStateResult.personId,
        rmInDifferentStateResult.jobFunctionId
      )
      console.log(issue)
      assert.isTrue(_.isNil(issue))
    })
  })
})
