const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { format } = require('date-fns')
const jwtDecode = require('jwt-decode')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const {
  getQueryForResultsListAndExport,
  queryResultFollowUpLastItems,
} = require('../../src/result/service')
const { getConstraints } = require('../../src/auth/constraints')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result Follow-Up Aggregations for reports', () => {
  const path = '/api/result/follow-up-aggregations'

  shared.checkToken(server, path)

  let resultsForUser = null

  before(() =>
    runTestWithKnex(async knex => {
      // get actual username from shared token
      const { name } = jwtDecode(shared.token)
      // get data constraints
      const dataConstraints = await getConstraints({ name })
      const resultQuery = getQueryForResultsListAndExport({}, dataConstraints)
      resultsForUser = await resultQuery
        .clone()
        .leftJoin(
          queryResultFollowUpLastItems().as('rfu'),
          'r.id',
          'rfu.resultId'
        )
        .leftJoin('FollowUp as fu', 'rfu.followUpId', 'fu.id')
        .leftJoin('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
        .where('rca.reportable', true)
        .whereNotNull('fu.externalId')
        .select([
          'r.id',
          knex.raw('IFNULL(r.endedOn, r.startedOn) as endedOn'),
          'd.name as deviceName',
          'c.name as countryName',
          'st.name as stateName',
          'lg.name as lgaName',
          'rc1.name as resultCategory1Name',
          'rc2.name as resultCategory2Name',
          'a.name as assayName',
          'a.id as assayId',
          'r.deviceId',
          'si.name as siteName',
          'dt.name as deviceTypeName',
          'fu.externalId as followUp',
          'fut.externalId as followUpType',
        ])
    })
  )

  it('should return all reportable results grouped by the default (followUp) if query string is empty', async () =>
    server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .groupBy('followUp')
          .map((value, key) => ({
            followUp: key,
            cnt: value.length,
          }))
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by followUp and month and should allow multiple assays', async () =>
    server
      .get(path)
      .query({
        groupBy: ['followUp', 'month'],
        assay: ['DaktariHivVL', 'DaktariHcv'],
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.followUp
            }`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: groups[0],
              followUp: groups[1],
              cnt: value.length,
            }
          })
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by followUp, month and state if specified in query string', async () =>
    server
      .get(path)
      .query({
        groupBy: ['followUp', 'month', 'state'],
        assay: 'DaktariHivVL',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.followUp
            }_${o.stateName}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: groups[0],
              followUp: groups[1],
              state: groups[2],
              cnt: value.length,
            }
          })
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by followUp and day if specified in query string', async () =>
    server
      .get(path)
      .query({
        groupBy: ['followUp', 'day'],
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM-dd')}_${
              o.followUp
            }`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              day: groups[0],
              followUp: groups[1],
              cnt: value.length,
            }
          })
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by followUp, month and category and filtered by site if specified in query string', async () =>
    server
      .get(path)
      .query({
        groupBy: ['followUp', 'month', 'resultCategory1'],
        siteName: 'Cuyahoga',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => o.siteName.indexOf('Cuyahoga') >= 0)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.followUp
            }_${o.resultCategory1Name.replace(' ', '')}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: groups[0],
              followUp: groups[1],
              resultCategory1: groups[2],
              cnt: value.length,
            }
          })
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should throw an error if groupBy is not supported', async () =>
    server
      .get(`${path}?groupBy=GroupieGroup`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 400)
        assert.equal(res.body.message.substring(0, 21), 'child "groupBy" fails')
      }))

  it('should return all results grouped by month, followUp and followUpType and filtered by site', async () =>
    server
      .get(path)
      .query({
        groupBy: ['month', 'followUp', 'followUpType'],
        siteName: 'Cuyahoga',
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(o => o.siteName.indexOf('Cuyahoga') >= 0)
          .map(o => ({
            joinedValues: `${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.followUp
            }_${o.followUpType}`,
          }))
          .groupBy('joinedValues')
          .map((value, key) => {
            const groups = key.split('_')
            return {
              month: groups[0],
              followUp: groups[1],
              followUpType: groups[2],
              cnt: value.length,
            }
          })
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))
})
