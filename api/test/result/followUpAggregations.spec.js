const chai = require('chai')
const _ = require('lodash')
const { format } = require('date-fns')
const jwtDecode = require('jwt-decode')

const shared = require('../utils/sharedToken')
const { addConstraints, getConstraints } = require('../../src/auth/constraints')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai

function queryResultFollowUpLastItems(knex, followUpTypes) {
  const fields = []
  followUpTypes.forEach(followUpType => {
    fields.push(
      // largest ResultFollowUp.id for specified 'followUpType'
      knex.raw(
        `MAX(case when _fut.externalId='${followUpType}' then _rfu.id else null end) as ${followUpType}ResultFollowUpId`
      )
    )
  })
  const rfuLastIds = knex('ResultFollowUp as _rfu')
    .innerJoin('FollowUp as _fu', '_rfu.followUpId', '_fu.id')
    .innerJoin('FollowUpType as _fut', '_fu.followUpTypeId', '_fut.id')
    .select([
      '_rfu.resultId',
      // 'treatmentResultFollowUpId', 'outcomeResultFollowUpId', etc
      ...fields,
    ])
    .groupBy('_rfu.resultId')

  return rfuLastIds
}

describe('Result Follow-Up Aggregations for reports', () => {
  const path = '/api/result/follow-up-aggregations'

  const getValue = groupKey => {
    return groupKey === 'null' ? null : groupKey
  }
  let resultsForUser = null

  before(async () => {
    shared.checkToken(server, path)
    // get actual username from shared token
    const { name } = jwtDecode(shared.token)

    const followUpTypes = await knex('FollowUpType').pluck('externalId')
    const fields = []
    followUpTypes.forEach(followUpType => {
      fields.push(`${followUpType}FollowUp.externalId as ${followUpType}FollowUp`)
      fields.push(`${followUpType}FollowUpType.externalId as ${followUpType}FollowUpType`)
    })

    // get data constraints
    const dataConstraints = await getConstraints({ name })
    resultsForUser = await knex('Result as r')
      .innerJoin('Device as d', 'd.id', 'r.deviceId')
      .innerJoin('Site as s', 's.id', 'r.siteId')
      .innerJoin('Assay as a', 'a.id', 'r.assayId')
      .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
      .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
      .leftJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
      .leftJoin('Geography as g', 's.geographyId', 'g.id')
      .leftJoin('State as st', 'st.id', 'g.stateId')
      .innerJoin('ResultCategoryAssay as rca', function () {
        this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
      })
      .leftJoin('ResultCategoryAssay as rсa2', function () {
        this.on('r.assayId', 'rсa2.assayId').andOn('r.resultCategory2', 'rсa2.resultCategoryId')
      })
      .leftJoin(queryResultFollowUpLastItems(knex, followUpTypes).as('rfu'), 'r.id', 'rfu.resultId')
      .modify(qb => {
        followUpTypes.forEach(followUpType => {
          qb.leftJoin(
            `ResultFollowUp as ${followUpType}ResultFollowUp`,
            `rfu.${followUpType}ResultFollowUpId`,
            `${followUpType}ResultFollowUp.id`
          )
            .leftJoin(
              `FollowUp as ${followUpType}FollowUp`,
              `${followUpType}ResultFollowUp.followUpId`,
              `${followUpType}FollowUp.id`
            )
            .leftJoin(
              `FollowUpType as ${followUpType}FollowUpType`,
              `${followUpType}FollowUp.followUpTypeId`,
              `${followUpType}FollowUpType.id`
            )
        })
      })
      .modify(addConstraints, dataConstraints, {
        device: 'd',
        geography: 'g',
        site: 's',
      })
      .where('rca.reportable', true)
      .select([
        'r.id',
        knex.raw('IFNULL(r.endedOn, r.startedOn) as endedOn'),
        'd.name as deviceName',
        'st.name as stateName',
        's.name as siteName',
        'rc1.externalId as resultCategory1',
        'rc1.i18nKey as resultCategory1I18nKey',
        'rc2.externalId as resultCategory2',
        'rc2.i18nKey as resultCategory2I18nKey',
        'a.name as assayName',
        ...fields,
      ])
  })

  it('should return all treatment results grouped by default `followUp`', async () =>
    server
      .get(path)
      .query({
        followUpType: 'treatment',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => !!o.treatmentFollowUp)
          .groupBy('treatmentFollowUp')
          .map((value, key) => ({
            followUp: getValue(key),
            followUpI18nKey: getValue(key),
            cnt: value.length,
          }))
          .orderBy('followUp')
          .value()

        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data).orderBy('followUp').value()
        assert.deepEqual(orderedResponse, expectedResponse)
      }))

  it('should return all treatment results grouped by followUp and month', async () => {
    const groupNames = ['followUp', 'month']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        followUpType: 'treatment',
        assay: ['DaktariHivVL', 'DaktariHcv'],
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => !!o.treatmentFollowUp)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${o.treatmentFollowUp}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              followUp: getValue(groups[1]),
              followUpI18nKey: getValue(groups[1]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data).orderBy(groupNames).value()
        expect(expectedResponse).to.containSubset(orderedResponse)
      })
  })

  it('should return all treatment results grouped by followUp, month and state', async () => {
    const groupNames = ['followUp', 'month', 'state']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        followUpType: 'treatment',
        assay: 'DaktariHivVL',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => !!o.treatmentFollowUp)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${o.treatmentFollowUp}_${o.stateName}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              followUp: getValue(groups[1]),
              followUpI18nKey: getValue(groups[1]),
              state: getValue(groups[2]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data).orderBy(groupNames).value()
        expect(expectedResponse).to.containSubset(orderedResponse)
      })
  })

  it('should return all treatment results grouped by followUp and day', async () => {
    const groupNames = ['followUp', 'day']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        followUpType: 'treatment',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => !!o.treatmentFollowUp)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM-dd')}_${o.treatmentFollowUp}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              day: getValue(groups[0]),
              followUp: getValue(groups[1]),
              followUpI18nKey: getValue(groups[1]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data).orderBy(groupNames).value()
        assert.deepEqual(orderedResponse, expectedResponse)
      })
  })

  it('should return all treatment results grouped by followUp, month and category, and filtered by site', async () => {
    const groupNames = ['followUp', 'month', 'resultCategory1']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        followUpType: 'treatment',
        siteName: 'Cuyahoga',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => o.treatmentFollowUp && o.siteName.indexOf('Cuyahoga') >= 0)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${o.treatmentFollowUp}_${o.resultCategory1}_${
              o.resultCategory1I18nKey
            }`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              followUp: getValue(groups[1]),
              followUpI18nKey: getValue(groups[1]),
              resultCategory1: getValue(groups[2]),
              resultCategory1I18nKey: getValue(groups[3]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data).orderBy(groupNames).value()
        assert.deepEqual(orderedResponse, expectedResponse)
      })
  })

  it('should throw an error if groupBy is not supported', async () =>
    server
      .get(path)
      .query({
        groupBy: 'GroupieGroup',
        followUpType: 'treatment',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 400)
        assert.equal(res.body.message.substring(0, 24), '"groupBy" must be one of')
      }))

  it('should return all outcome results grouped by month and followUp, and filtered by site', async () => {
    const groupNames = ['month', 'followUp']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        followUpType: 'outcome',
        siteName: 'Cuyahoga',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => o.outcomeFollowUp && o.siteName.indexOf('Cuyahoga') >= 0)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${o.outcomeFollowUp}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              followUp: getValue(groups[1]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data).orderBy(groupNames).value()
        assert.deepEqual(orderedResponse, expectedResponse)
      })
  })
})
