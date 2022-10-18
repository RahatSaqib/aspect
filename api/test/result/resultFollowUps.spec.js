const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const { assayToId, diseaseToId } = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Result Follow Up', () => {
  describe('GET', () => {
    const path = '/api/result/follow-ups'

    before(async () => {
      shared.checkToken(server, path)
    })

    it('should return a list of possible result follow ups', async () => {
      await server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body, 'total')
          assert.isAtLeast(res.body.data.length, 7)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'i18nKey')
          assert.property(res.body.data[0], 'type')
          assert.property(res.body.data[0].type, 'id')
          assert.property(res.body.data[0].type, 'name')
          assert.property(res.body.data[0].type, 'externalId')
          assert.property(res.body.data[0].type, 'i18nKey')
          assert.property(res.body.data[0], 'assays')
          assert.typeOf(res.body.data[0].assays, 'array')
        })
    })

    it('should return a list of possible result follow ups filtered by disease', async () => {
      const diseaseId = await diseaseToId('hiv')
      const res = await server.get(`${path}?diseaseId=${diseaseId}`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.property(res.body, 'total')
      assert.isAtLeast(res.body.data.length, 5)
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'name')
      assert.property(res.body.data[0], 'externalId')
      assert.property(res.body.data[0], 'i18nKey')
      assert.property(res.body.data[0], 'type')
      assert.property(res.body.data[0].type, 'id')
      assert.property(res.body.data[0].type, 'name')
      assert.property(res.body.data[0].type, 'externalId')
      assert.property(res.body.data[0].type, 'i18nKey')
      assert.property(res.body.data[0], 'assays')
      assert.typeOf(res.body.data[0].assays, 'array')
    })
    it('should return a list of possible result follow ups filtered by assay', async () => {
      const assayId = await assayToId('abbottM2000DBSHivVL')
      const res = await server.get(`${path}?assayId=${assayId}`).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.property(res.body, 'total')
      assert.isAtLeast(res.body.data.length, 5)
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'name')
      assert.property(res.body.data[0], 'externalId')
      assert.property(res.body.data[0], 'i18nKey')
      assert.property(res.body.data[0], 'type')
      assert.property(res.body.data[0].type, 'id')
      assert.property(res.body.data[0].type, 'name')
      assert.property(res.body.data[0].type, 'externalId')
      assert.property(res.body.data[0].type, 'i18nKey')
      assert.property(res.body.data[0], 'assays')
      assert.typeOf(res.body.data[0].assays, 'array')

      assert.isAtLeast(
        _.intersection(
          _.map(res.body.data, elem => elem.externalId),
          ['rrvl', 'iaac', 'st2o3lr', 'mcr', 'cured', 'died']
        ).length,
        6
      )
    })
  })

  describe('POST', () => {
    const resultId = 1
    const path = `/api/result/follow-up/${resultId}`

    it('Should add a follow up to a result and update treatment status', async () => {
      const { id: followUpId } = await knex('FollowUp').where('externalId', 'drtb-prexdr').first('id')

      const date = new Date('2019-08-01')
      const resultFollowUpExternalId = '1234'

      const responseFirst = await server
        .post(`${path}`)
        .send({ followUpId, date, externalId: resultFollowUpExternalId })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(responseFirst.statusCode, 200)

      // should have follow up with the externalId 'drtb-prexdr'
      const { externalId: externalIdFollowUp, date: followUpDate } = await knex('ResultFollowUp as rfu')
        .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
        .where('rfu.resultId', resultId)
        .where('rfu.externalId', resultFollowUpExternalId)
        .first('fu.externalId', 'rfu.date')

      assert.equal(externalIdFollowUp, 'drtb-prexdr')
      assert.equal(date.getTime(), followUpDate.getTime())

      const responseSecond = await server
        .post(`${path}`)
        .send({ followUpId, externalId: resultFollowUpExternalId })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(responseSecond.statusCode, 400, 'Should return error if external ID already exists')

      // should have a treatment status of "On Treatment"
      const { externalId } = await knex('Result as r')
        .join('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
        .join('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
        .where('resultId', resultId)
        .first('rts.externalId')

      assert.equal(externalId, 'OnTreatment')
    })

    it('should return an error if result does not exist', async () => {
      await server
        .post('/api/result/follow-up/987654321')
        .send({ externalId: '1234', followUpExternalId: 'drtb-bbsr' })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 404)
        })
    })
  })

  describe('PUT', () => {
    const resultId = 1
    const path = `/api/result/follow-up/${resultId}`

    it('Should update the date of a result follow up', async () => {
      const date = new Date('2019-09-01')

      const existingFollowUp = await knex('ResultFollowUp')
        .where('resultId', resultId)
        .where('externalId', '1234')
        .first('followUpId')

      const response = await server
        .put(`${path}`)
        .send({ externalId: '1234', date })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.statusCode, 200)

      const updatedFollowUp = await knex('ResultFollowUp')
        .where('resultId', resultId)
        .where('externalId', '1234')
        .first('date', 'followUpId')

      assert.equal(date.getTime(), updatedFollowUp.date.getTime())
      assert.equal(existingFollowUp.followUpId, updatedFollowUp.followUpId)
    })

    it('Should update the follow up of a result follow up', async () => {
      const existingFollowUp = await knex('ResultFollowUp')
        .where('resultId', resultId)
        .where('externalId', '1234')
        .first('date', 'followUpId')

      const response = await server
        .put(`${path}`)
        .send({ externalId: '1234', followUpExternalId: 'drtb-bbsr' })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.statusCode, 200)

      const updatedFollowUp = await knex('ResultFollowUp as rfu')
        .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
        .where('resultId', resultId)
        .where('rfu.externalId', '1234')
        .first('rfu.date', 'fu.externalId')

      assert.equal(existingFollowUp.date.getTime(), updatedFollowUp.date.getTime())
      assert.equal('drtb-bbsr', updatedFollowUp.externalId)
    })

    it('should return an error if follow up does not exist', async () => {
      await server
        .put(`${path}`)
        .send({ externalId: 'VWXYZ', followUpExternalId: 'drtb-bbsr' })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 404)
        })
    })
  })

  describe('DELETE', () => {
    const resultId = 1
    const path = `/api/result/follow-up/${resultId}`

    it('Should delete the follow up with the given external ID', async () => {
      const response = await server
        .delete(`${path}`)
        .send({ externalId: '1234' })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.statusCode, 200)
      assert.typeOf(response.body, 'Object')
      assert.property(response.body, 'data')
      assert.typeOf(response.body.data, 'Object')
      assert.property(response.body.data, 'id')
      assert.property(response.body.data, 'externalId')
      assert.property(response.body.data, 'resultData')

      // should not have any follow ups
      const followUps = await knex('ResultFollowUp').where('resultId', resultId).where('externalId', '1234').first('id')

      assert(!followUps)
    })

    it('Should return result details even if follow up was not found', async () => {
      const response = await server
        .delete(`${path}`)
        .send({ externalId: 'VWXYZ' })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.statusCode, 200)
      assert.typeOf(response.body, 'Object')
      assert.property(response.body, 'data')
      assert.typeOf(response.body.data, 'Object')
      assert.property(response.body.data, 'id')
      assert.property(response.body.data, 'externalId')
      assert.property(response.body.data, 'resultData')

      // should not have any follow ups
      const followUps = await knex('ResultFollowUp').where('resultId', resultId).where('externalId', '1234').first('id')

      assert(!followUps)
    })
  })
})
