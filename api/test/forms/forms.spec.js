const chai = require('chai')

const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert } = chai

describe.skip('Forms routes', () => {
  const path = '/api/get-forms'
  const COMMON_FIELDS = ['name', 'i18nKey', 'fieldType', 'order', 'caption', 'i18nKeyCaption', 'controlType']
  before(() => {
    shared.checkToken(server, path)
  })

  async function getDiseaseId(externalId) {
    const { id: diseaseId } = (await knex('Disease').where({ externalId }).first('id')) || {}
    return diseaseId
  }

  describe('GET', () => {
    function checkResponseCommonForms(elem, fieldsToTest = COMMON_FIELDS) {
      assert.isTrue(!_.isNil(elem))
      assert.property(elem, 'diseaseId')
      assert.property(elem, 'assayId')
      assert.hasAllKeys(_.orderBy(elem.fields, field => field.order)[0], fieldsToTest)
      assert.property(elem, 'formTypeId')
      assert.property(elem, 'fields')
      assert.typeOf(elem.fields, 'array')
      assert.property(elem, 'refForms')
      assert.typeOf(elem.refForms, 'array')
    }
    describe('Result Web Forms', () => {
      it('should return a form by TB disease and formtype result web form', async () => {
        const diseaseId = await getDiseaseId('tb')

        const res = await server
          .get(`${path}?diseaseId=${diseaseId}&formType=resultFormWeb`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isTrue(!_.isNil(res.body))
        const { TBProbes, TBResult } = res.body

        const fields = _.concat(COMMON_FIELDS, ['title'])
        checkResponseCommonForms(TBResult, fields)

        checkResponseCommonForms(TBProbes, _.concat(COMMON_FIELDS, ['condition']))
      })
      it('should return a form by hiv disease and formtype result web form', async () => {
        const diseaseId = await getDiseaseId('hiv')

        const res = await server
          .get(`${path}?diseaseId=${diseaseId}&formType=resultFormWeb`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isTrue(!_.isNil(res.body))
        const { HIVProbes, HIVResult } = res.body
        checkResponseCommonForms(HIVProbes, _.concat(COMMON_FIELDS, ['encrypted', 'required', 'title', 'validation']))
        checkResponseCommonForms(HIVResult, _.concat(COMMON_FIELDS, ['encrypted', 'required', 'validation']))
      })

      it('should return a form by covid disease and formtype result web form', async () => {
        const diseaseId = await getDiseaseId('covid19')
        const res = await server
          .get(`${path}?diseaseId=${diseaseId}&formType=resultFormWeb`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isTrue(!_.isNil(res.body))

        const { CovidResult } = res.body
        assert.isTrue(!_.isNil(CovidResult))
        checkResponseCommonForms(
          CovidResult,
          _.concat(COMMON_FIELDS, [
            'itemsSource',
            'required',
            'encrypted',
            'resultDbColumn',
            'typeOfOptionSource',
            'itemsSourceConfig',
          ])
        )
      })
    })
    describe('Case creation Web Forms', () => {
      it('should return a form by TB disease', async () => {
        const diseaseId = await getDiseaseId('tb')

        const res = await server
          .get(`${path}?diseaseId=${diseaseId}&formType=CaseCreation`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isTrue(!_.isNil(res.body))
        const { TBCaseHealthCondition, TBCaseTreatment } = res.body
        checkResponseCommonForms(TBCaseHealthCondition, [
          'controlType',
          'fieldType',
          'i18nKey',
          'items',
          'name',
          'order',
          'required',
          'title',
          'typeOfOptionSource',
        ])
        checkResponseCommonForms(
          TBCaseTreatment,
          _.concat(COMMON_FIELDS, ['items', 'required', 'title', 'typeOfOptionSource', 'encrypted'])
        )
      })
      it('should return a form by hiv disease and formtype', async () => {
        const diseaseId = await getDiseaseId('hiv')

        const res = await server
          .get(`${path}?diseaseId=${diseaseId}&formType=CaseCreation`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isTrue(!_.isNil(res.body))

        const { HIVCaseHealthCondition, HIVCaseTreatment } = res.body
        checkResponseCommonForms(
          HIVCaseHealthCondition,
          _.concat(COMMON_FIELDS, ['items', 'required', 'title', 'typeOfOptionSource'])
        )
        checkResponseCommonForms(
          HIVCaseTreatment,
          _.concat(COMMON_FIELDS, ['items', 'required', 'title', 'typeOfOptionSource'])
        )
      })

      it('should return a form by covid disease and formtype', async () => {
        const diseaseId = await getDiseaseId('covid19')
        const res = await server
          .get(`${path}?diseaseId=${diseaseId}&formType=CaseCreation`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.isTrue(!_.isNil(res.body))

        const { CovidCaseHealthCondition, CovidCaseTreatment, CovidCaseAditionalData } = res.body
        checkResponseCommonForms(
          CovidCaseTreatment,
          _.concat(COMMON_FIELDS, ['items', 'required', 'title', 'typeOfOptionSource'])
        )
        checkResponseCommonForms(
          CovidCaseAditionalData,
          _.concat(COMMON_FIELDS, ['items', 'required', 'title', 'typeOfOptionSource'])
        )
        checkResponseCommonForms(
          CovidCaseHealthCondition,
          _.concat(COMMON_FIELDS, ['items', 'required', 'title', 'typeOfOptionSource'])
        )
      })
    })
  })
})
