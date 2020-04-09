const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { format } = require('date-fns')
const jwtDecode = require('jwt-decode')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { queryResultFollowUpLastItems } = require('../../src/result/service')
const { addConstraints, getConstraints } = require('../../src/auth/constraints')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result Follow-Up Aggregations for reports', () => {
  const path = '/api/result/follow-up-aggregations'

  shared.checkToken(server, path)

  const getValue = groupKey => {
    return groupKey === 'null' ? null : groupKey
  }
  let resultsForUser = null

  before(() =>
    runTestWithKnex(async knex => {
      // get actual username from shared token
      const { name } = jwtDecode(shared.token)

      const followUpTypes = (
        await knex('FollowUpType').select('externalId')
      ).map(x => x.externalId)
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
        .innerJoin('ResultCategoryAssay as rca', function() {
          this.on('r.assayId', 'rca.assayId').andOn(
            'r.resultCategory1',
            'rca.resultCategoryId'
          )
        })
        .leftJoin('ResultCategoryAssay as rсa2', function() {
          this.on('r.assayId', 'rсa2.assayId').andOn(
            'r.resultCategory2',
            'rсa2.resultCategoryId'
          )
        })
        .leftJoin(
          queryResultFollowUpLastItems(followUpTypes).as('rfu'),
          'r.id',
          'rfu.resultId'
        )
        .modify(qb => {
          followUpTypes.forEach(followUpType => {
            qb.leftJoin(
              `ResultFollowUp as ${followUpType}ResultFollowUp`,
              `rfu.${followUpType}ResultFollowUpId`,
              `${followUpType}ResultFollowUp.id`
            ).leftJoin(
              `FollowUp as ${followUpType}FollowUp`,
              `${followUpType}ResultFollowUp.followUpId`,
              `${followUpType}FollowUp.id`
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
          'rc2.externalId as resultCategory2',
          'a.name as assayName',
          // add fields like
          // `treatmentFollowUp.externalId as treatment` and
          // `outcomeFollowUp.externalId as outcome`
          ...followUpTypes.map(
            followUpType =>
              `${followUpType}FollowUp.externalId as ${followUpType}`
          ),
        ])
    })
  )

  it('should return all reportable results grouped by the default followUpType (treatment) if query string is empty', async () =>
    server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .groupBy('treatment')
          .map((value, key) => ({
            treatment: getValue(key),
            cnt: value.length,
          }))
          .orderBy('treatment')
          .value()

        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data)
          .orderBy('treatment')
          .value()
        assert.deepEqual(orderedResponse, expectedResponse)
      }))

  it('should return all results grouped by `treatment` followUpType and month and should allow multiple assays', async () =>
    server
      .get(path)
      .query({
        groupBy: ['treatment', 'month'],
        assay: ['DaktariHivVL', 'DaktariHcv'],
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.treatment
            }`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              treatment: getValue(groups[1]),
              cnt: value.length,
            }
          })
          .orderBy(['treatment', 'month'])
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data)
          .orderBy(['treatment', 'month'])
          .value()
        assert.deepEqual(orderedResponse, expectedResponse)
      }))

  it('should return all results grouped by `treatment` followUpType, month and state if specified in query string', async () =>
    server
      .get(path)
      .query({
        groupBy: ['treatment', 'month', 'state'],
        assay: 'DaktariHivVL',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.treatment
            }_${o.stateName}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              treatment: getValue(groups[1]),
              state: getValue(groups[2]),
              cnt: value.length,
            }
          })
          .orderBy(['treatment', 'month', 'state'])
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data)
          .orderBy(['treatment', 'month', 'state'])
          .value()
        assert.deepEqual(orderedResponse, expectedResponse)
      }))

  it('should return all results grouped by `treatment` followUpType and day if specified in query string', async () => {
    const groupNames = ['treatment', 'day']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM-dd')}_${
              o.treatment
            }`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              day: getValue(groups[0]),
              treatment: getValue(groups[1]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data)
          .orderBy(groupNames)
          .value()
        assert.deepEqual(orderedResponse, expectedResponse)
      })
  })

  it('should return all results grouped by `treatment` followUpType, month and category and filtered by site if specified in query string', async () => {
    const groupNames = ['treatment', 'month', 'resultCategory1']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        siteName: 'Cuyahoga',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => o.siteName.indexOf('Cuyahoga') >= 0)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.treatment
            }_${o.resultCategory1}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              treatment: getValue(groups[1]),
              resultCategory1: getValue(groups[2]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data)
          .orderBy(groupNames)
          .value()
        assert.deepEqual(orderedResponse, expectedResponse)
      })
  })

  it('should throw an error if groupBy is not supported', async () =>
    server
      .get(`${path}?groupBy=GroupieGroup`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 400)
        assert.equal(res.body.message.substring(0, 21), 'child "groupBy" fails')
      }))

  it('should return all results grouped by month, `outcome` followUpType and filtered by site', async () => {
    const groupNames = ['month', 'outcome']
    return server
      .get(path)
      .query({
        groupBy: groupNames,
        siteName: 'Cuyahoga',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => o.siteName.indexOf('Cuyahoga') >= 0)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.outcome
            }`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: getValue(groups[0]),
              outcome: getValue(groups[1]),
              cnt: value.length,
            }
          })
          .orderBy(groupNames)
          .value()
        assert.equal(res.status, 200)
        const orderedResponse = _.chain(res.body.data)
          .orderBy(groupNames)
          .value()
        assert.deepEqual(orderedResponse, expectedResponse)
      })
  })
})
