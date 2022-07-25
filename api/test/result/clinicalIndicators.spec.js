const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { format } = require('date-fns')

const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('/result/clinical-indicator-aggregations', () => {
  const path = '/api/result/clinical-indicator-aggregations'

  let resultsForUser = null
  let reportableResultCategories = null
  let assays = null
  let resultCategories

  const getResultsForUser = () =>
    server
      .get('/api/result?size=999999')
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => res.body.data)

  before(async () => {
    shared.checkToken(server, path)
    resultsForUser = await getResultsForUser()
    assays = await knex('Assay').select('id', 'externalId', 'i18nKey')
    reportableResultCategories = await knex('ResultCategoryAssay as rca')
      .join('Assay as a', 'rca.assayId', 'a.id')
      .join('ResultCategory as rc', 'rca.resultCategoryId', 'rc.id')
      .where('rca.reportable', true)
      .distinct('rc.externalId', 'rc.name', 'a.name as assayName')
    resultCategories = await knex('ResultCategory as rc').select('*')
  })

  // since most of this data is now based on fact tables and we don't run the scheduler in test environments,
  // we have to skip the corresponding tests; at least until we've found a better solution for testing fact tables
  // or for querying results more efficiently
  it.skip('should return all reportable results grouped by the default (resultCategory1) if query string is empty', async () =>
    server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            resultCategory1: o.resultCategory1Name.replace(' ', ''),
            resultCategory1I18nKey: o.resultCategory1I18nKey,
          }))
          .filter(function (o) {
            return _.some(
              reportableResultCategories,
              reportableResultCategory =>
                reportableResultCategory.assayName === o.assayName &&
                reportableResultCategory.name === o.resultCategory1Name
            )
          })
          .map(({ resultCategory1, resultCategory1I18nKey }) => `${resultCategory1}_${resultCategory1I18nKey}`)
          .groupBy()
          .map((value, key) => ({
            resultCategory1: key.split('_')[0],
            resultCategory1I18nKey: key.split('_')[1],
            cnt: value.length,
          }))
          .value()

        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it.skip('should return all results grouped by month and should allow multiple assays', async () =>
    server
      .get(`${path}?groupBy=month&assay=DaktariHivVL&assay=DaktariHcv`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(function (o) {
            return _.some(
              reportableResultCategories,
              reportableResultCategory =>
                reportableResultCategory.assayName === o.assayName &&
                reportableResultCategory.name === o.resultCategory1Name
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
            return _.some(
              reportableResultCategories,
              reportableResultCategory =>
                reportableResultCategory.assayName === o.assayName &&
                reportableResultCategory.name === o.resultCategory1Name
            )
          })
          .map(o => ({
            stateMonth: `${o.stateName}_${format(new Date(o.endedOn), 'yyyy-MM')}`,
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
            return _.some(
              reportableResultCategories,
              reportableResultCategory =>
                reportableResultCategory.assayName === o.assayName &&
                reportableResultCategory.name === o.resultCategory1Name
            )
          })
          .map(o => ({ day: format(new Date(o.endedOn), 'yyyy-MM-dd') }))
          .groupBy('day')
          .map((value, key) => ({ day: key, cnt: value.length }))
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it.skip('should return all results grouped by month and category and filtered by site if specified in query string', async () =>
    server
      .get(`${path}?groupBy=month&groupBy=resultCategory1&siteName=Cuyahoga`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .filter(function (o) {
            return (
              _.some(
                reportableResultCategories,
                reportableResultCategory =>
                  reportableResultCategory.assayName === o.assayName &&
                  reportableResultCategory.name === o.resultCategory1Name
              ) && o.siteName.indexOf('Cuyahoga') >= 0
            )
          })
          .map(o => ({
            categoryMonth: `${o.resultCategory1Name.replace(' ', '')}_${format(new Date(o.endedOn), 'yyyy-MM')}_${
              o.resultCategory1I18nKey
            }`,
          }))
          .groupBy('categoryMonth')
          .map((value, key) => ({
            resultCategory1: key.split('_')[0],
            resultCategory1I18nKey: key.split('_')[2],
            month: key.split('_')[1],
            cnt: value.length,
          }))
          .value()
        assert.equal(res.status, 200)
        assert.deepEqual(res.body.data, expectedResponse)
      }))

  it.skip('should return all results grouped by month and assay', async () =>
    server
      .get(`${path}?groupBy=month&groupBy=assay`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        const expectedResponse = _.chain(resultsForUser)
          .map(o => ({
            categoryMonth: `${_.find(assays, assay => assay.id === o.assayId).externalId}_${format(
              new Date(o.endedOn),
              'yyyy-MM'
            )}_${o.assayI18nKey}`,
          }))
          .groupBy('categoryMonth')
          .map((value, key) => ({
            assay: key.split('_')[0],
            assayI18nKey: key.split('_')[2],
            month: key.split('_')[1],
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
        assert.equal(res.body.message.substring(0, 24), '"groupBy" must be one of')
      }))

  it.skip('for specified assay should return results grouped by month, resultCategory2, resultCategory1', async () =>
    server
      .get(`${path}?assay=DaktariHivVL&groupBy=month&groupBy=resultCategory2&groupBy=resultCategory1`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 200)

        // assayId for 'DaktariHivVL'
        const { id: assayId } = assays.find(assay => assay.externalId === 'DaktariHivVL')
        // normalize/group raw data by month, resultCategory2, resultCategory1
        const expectedResponse = _.chain(resultsForUser)
          .filter(x => +x.assayId === +assayId && ['Detected', 'Not Detected'].includes(x.resultCategory1Name))
          .map(o => ({
            groupingKey: `${
              // month date
              format(new Date(o.endedOn), 'yyyy-MM')
            }_${
              // resultCategory1
              o.resultCategory1I18nKey
                ? resultCategories.find(x => x.i18nKey === o.resultCategory1I18nKey).externalId
                : 'null'
            }_${o.resultCategory1I18nKey ?? 'null'}_${
              // resultCategory2
              o.resultCategory2I18nKey
                ? resultCategories.find(x => x.i18nKey === o.resultCategory2I18nKey).externalId
                : 'null'
            }_${o.resultCategory2I18nKey ?? 'null'}`,
          }))
          .groupBy('groupingKey')
          .map((value, key) => {
            const getValue = val => (val === 'null' ? null : val)

            return {
              month: key.split('_')[0],

              resultCategory1: getValue(key.split('_')[1]),
              resultCategory1I18nKey: getValue(key.split('_')[2]),

              resultCategory2: getValue(key.split('_')[3]),
              resultCategory2I18nKey: getValue(key.split('_')[4]),

              cnt: value.length,
            }
          })
          .value()

        assert.deepEqual(res.body.data, expectedResponse)
      }))
})
