const chai = require('chai')
const _ = require('lodash')
const { format } = require('date-fns')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = require('../utils/testUtils')

const { assert, expect } = chai

describe('/result/clinical-indicator-aggregations', () => {
  const path = '/api/result/clinical-indicator-aggregations'

  shared.checkToken(server, path)

  let resultsForUser = null
  let reportableResultCategories = null
  let assays = null
  shared.checkToken(server, path)

  const getResultsForUser = () =>
    server
      .get('/api/result?size=999999')
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => res.body.data)

  before(() =>
    runTestWithKnex(async knex => {
      resultsForUser = await getResultsForUser()
      assays = await knex('Assay').select('id', 'externalId')
      reportableResultCategories = await knex('ResultCategoryAssay as rca')
        .join('ResultCategory as rc', 'rca.resultCategoryId', 'rc.id')
        .where('rca.reportable', true)
        .distinct('rc.externalId')
        .pluck('externalId')
    })
  )

  it('should return all reportable results grouped by the default (resultCategory1) if query string is empty', async () =>
    server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            resultCategory1: o.resultCategory1Name.replace(' ', ''),
          }))
          .filter(function (o) {
            return reportableResultCategories.indexOf(o.resultCategory1) > -1
          })
          .groupBy('resultCategory1')
          .map((value, key) => ({
            resultCategory1: key,
            cnt: value.length,
          }))
          .value()

        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by month and should allow multiple assays', async () =>
    server
      .get(`${path}?groupBy=month&assay=DaktariHivVL&assay=DaktariHcv`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(function (o) {
            return (
              // only reportable should be included
              reportableResultCategories.indexOf(
                o.resultCategory1Name.replace(' ', '')
              ) > -1
            )
          })
          .map(o => ({
            month: format(new Date(o.endedOn), 'yyyy-MM'),
          }))
          .groupBy('month')
          .map((value, key) => ({
            month: key,
            cnt: value.length,
          }))
          .value()
        assert.equal(res.status, 200)
        expect(expectedResponse).to.containSubset(res.body.data)
      }))

  it('should return all results grouped by month and state if specified in query string', async () =>
    server
      .get(`${path}?groupBy=month&groupBy=state&assay=DaktariHivVL`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(function (o) {
            return (
              reportableResultCategories.indexOf(
                o.resultCategory1Name.replace(' ', '')
              ) > -1
            )
          })
          .map(o => ({
            stateMonth: `${o.stateName}_${format(
              new Date(o.endedOn),
              'yyyy-MM'
            )}`,
          }))
          .groupBy('stateMonth')
          .map((value, key) => ({
            state: key.substring(0, key.indexOf('_')),
            month: key.substring(key.indexOf('_') + 1),
            cnt: value.length,
          }))
          .value()
        assert.equal(res.status, 200)
        expect(expectedResponse).to.containSubset(res.body.data)
      }))

  it('should return all results grouped by day if specified in query string', async () =>
    server
      .get(`${path}?groupBy=day`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(function (o) {
            return (
              reportableResultCategories.indexOf(
                o.resultCategory1Name.replace(' ', '')
              ) > -1
            )
          })
          .map(o => ({ day: format(new Date(o.endedOn), 'yyyy-MM-dd') }))
          .groupBy('day')
          .map((value, key) => ({ day: key, cnt: value.length }))
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by month and category and filtered by site if specified in query string', async () =>
    server
      .get(`${path}?groupBy=month&groupBy=resultCategory1&siteName=Cuyahoga`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(function (o) {
            return (
              // only reportable should be included
              reportableResultCategories.indexOf(
                o.resultCategory1Name.replace(' ', '')
              ) > -1 && o.siteName.indexOf('Cuyahoga') >= 0
            )
          })
          .map(o => ({
            categoryMonth: `${o.resultCategory1Name.replace(' ', '')}_${format(
              new Date(o.endedOn),
              'yyyy-MM'
            )}`,
          }))
          .groupBy('categoryMonth')
          .map((value, key) => ({
            resultCategory1: key.substring(0, key.indexOf('_')),
            month: key.substring(key.indexOf('_') + 1),
            cnt: value.length,
          }))
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it('should return all results grouped by month and assay', async () =>
    server
      .get(`${path}?groupBy=month&groupBy=assay`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            categoryMonth: `${
              _.find(assays, assay => assay.id === o.assayId).externalId
            }_${format(new Date(o.endedOn), 'yyyy-MM')}`,
          }))
          .groupBy('categoryMonth')
          .map((value, key) => ({
            assay: key.substring(0, key.indexOf('_')),
            month: key.substring(key.indexOf('_') + 1),
            cnt: value.length,
          }))
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))
  it('should throw an error if groupby is not supported', async () =>
    server
      .get(`${path}?groupBy=GroupieGroup`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 400)
        assert.equal(
          res.body.message.substring(0, 24),
          '"groupBy" must be one of'
        )
      }))
})
