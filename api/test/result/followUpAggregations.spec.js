const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { format } = require('date-fns')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result Follow-Up Aggregations for reports', () => {
  const path = '/api/result/follow-up-aggregations'

  shared.checkToken(server, path)

  let resultsForUser = null

  shared.checkToken(server, path)

  // get list of results with 3 additional fields - followUp, followUpType, reportable,
  // and filter out by 'reportable' only
  const getResultsForUser = () =>
    server
      .get('/api/result')
      .query({
        withFollowUp: true,
      })
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => res.body.data.filter(x => x.followUp && x.reportable))

  before(() =>
    runTestWithKnex(async () => {
      resultsForUser = await getResultsForUser()
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
