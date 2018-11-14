const { assert } = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const _ = require('lodash')
const Promise = require('bluebird')
const { runTest } = require('../utils/generatorFunctionUtils')

describe('result/service', () => {
  function createFakeKnex({
    getResultByResultId = {},
    assay = {},
    assayForm = {},
  } = {}) {
    const fakeKnexFunction = tableName => {
      let firstResult = {}
      let selectResult = []
      if (tableName === 'Assay as a') {
        firstResult = _.cloneDeep(assay)
      } else if (tableName === 'Result as r') {
        selectResult = _.isEmpty(getResultByResultId)
          ? []
          : [_.cloneDeep(getResultByResultId)]
      } else if (tableName === 'ResultForm') {
        firstResult = _.cloneDeep(assayForm)
      }
      this.join = () => this
      this.innerJoin = () => this
      this.leftJoin = () => this
      this.where = () => this
      this.modify = () => this
      this.orderBy = () => this
      this.raw = () => this
      this.select = () => {
        const resultsPromise = Promise.resolve(selectResult)
        resultsPromise.map = () => resultsPromise
        return resultsPromise
      }
      this.first = () => Promise.resolve(firstResult)
      this.update = () => Promise.resolve()
      return this
    }
    return _.merge(fakeKnexFunction, fakeKnexFunction())
  }

  function resultServiceWithFakes(knexResults) {
    const fakeKnex = createFakeKnex(knexResults)
    const resultService = proxyquire('../../src/result/service', {
      '../db': { knex: fakeKnex },
      '../auth/constraints': {
        getConstraints: () => {},
        addConstraints: () => {},
      },
      '../auth/service': {
        getUser: () =>
          Promise.resolve({
            id: 1,
          }),
      },
    })
    resultService.knex = fakeKnex
    sinon.spy(resultService, 'knex')
    return resultService
  }

  function basicRequest(extraDetails = {}, knex) {
    if (!knex) {
      knex = createFakeKnex()
    }
    return _.merge(
      {
        auth: { credentials: {} },
        params: { resultId: 1 },
        payload: {},
        plugins: {
          messageContext: {
            bindActionCreators: () => {},
            transact: async transaction => transaction(knex),
            resultUpdated: sinon.spy(),
          },
        },
      },
      extraDetails
    )
  }

  function basicResult(extraDetails = {}) {
    return _.merge(
      {
        resultData: '{}',
        patientData: '{}',
        assayId: 1,
        partnerId: 1,
      },
      extraDetails
    )
  }

  function basicAssay(extraDetails = {}) {
    return _.merge(
      {
        resultDataSchema: '{}',
        patientDataSchema: '{}',
      },
      extraDetails
    )
  }

  describe('updateFormData', () => {
    it('should return a 404 response when the result cannot be found', () => {
      const resultService = resultServiceWithFakes()

      return runTest(resultService.updateFormData, [basicRequest()])(
        response => {
          assert.equal(response.output.statusCode, 404)
        }
      )
    })

    it('should only look up the result form schema if the submitted form data has changed', async () => {
      const resultService = resultServiceWithFakes({
        getResultByResultId: basicResult({
          formData: JSON.stringify({
            expertInterpretation: 'Negative',
          }),
        }),
        assay: basicAssay(),
      })

      await runTest(resultService.updateFormData, [basicRequest()])(() => {
        assert.isFalse(resultService.knex.calledWith('ResultForm'))
      })
      const requestWithChangedResultForm = basicRequest({
        payload: { expertInterpretation: 'Uninterpretable' },
      })
      return runTest(resultService.updateFormData, [
        requestWithChangedResultForm,
      ])(() => {
        assert.isFalse(resultService.knex.calledWith('ResultForm'))
      })
    })

    it('should return a 400 response when form data is submitted and there is no form schema defined', () => {
      const resultService = resultServiceWithFakes({
        getResultByResultId: basicResult({
          formData: null,
        }),
        assay: basicAssay(),
        assayForm: null,
      })
      const requestWithResultFormData = basicRequest({
        payload: { expertInterpretation: 'Positive' },
      })
      return runTest(resultService.updateFormData, [requestWithResultFormData])(
        response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            'This result cannot accept form data because no form schema is defined.'
          )
        }
      )
    })

    it('should return a 400 response when form data is submitted with fields that are not defined in the form schema', async () => {
      const resultService = resultServiceWithFakes({
        getResultByResultId: basicResult({
          formData: null,
        }),
        assay: basicAssay(),
        assayForm: {
          formSchema: JSON.stringify({
            fields: {
              definedField: {
                control: {
                  type: 'ButtonGroup',
                  options: [
                    {
                      value: 'Yes',
                      i18nText: 'yes',
                    },
                    {
                      value: 'No',
                      i18nText: 'no',
                    },
                  ],
                },
                i18nLabel: 'defineFieldLabel',
              },
            },
            sendChangesOn: 'change',
          }),
        },
      })
      let requestWithResultFormData = _.merge(
        {},
        basicRequest({
          payload: { someUndefinedField: 'A value for the field' },
        })
      )
      await runTest(resultService.updateFormData, [requestWithResultFormData])(
        response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            "This result cannot accept the following field in it's form data: someUndefinedField because it is not defined in the forms schema."
          )
        }
      )

      requestWithResultFormData = _.merge(
        {},
        basicRequest({
          payload: {
            someUndefinedField: 'A value for the field',
            anotherUndefinedField: 'A value for the field',
          },
        })
      )
      return runTest(resultService.updateFormData, [requestWithResultFormData])(
        response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            "This result cannot accept the following fields in it's form data: [someUndefinedField,anotherUndefinedField] because they are not defined in the forms schema."
          )
        }
      )
    })

    it('should allow null values', () => {
      const resultService = resultServiceWithFakes({
        getResultByResultId: basicResult({
          formData: null,
        }),
        assay: basicAssay(),
        assayForm: {
          formSchema: JSON.stringify({
            fields: {
              customField1: {
                control: {
                  type: 'TextBox',
                },
                i18nLabel: 'fieldLabel1',
              },
              customField2: {
                control: {
                  type: 'CheckBox',
                },
                i18nLabel: 'fieldLabel2',
              },
            },
            sendChangesOn: 'change',
          }),
        },
      })
      const requestWithResultFormData = _.merge(
        {},
        basicRequest({
          payload: { customField1: null },
          params: { resultId: 1234 },
        })
      )
      return runTest(resultService.updateFormData, [requestWithResultFormData])(
        response => {
          assert.isTrue(
            requestWithResultFormData.plugins.messageContext.resultUpdated.calledWith(
              1234
            )
          )
          assert.isOk(response.ok)
        }
      )
    })

    it('should allow non-null values', () => {
      const resultService = resultServiceWithFakes({
        getResultByResultId: basicResult({
          formData: null,
        }),
        assay: basicAssay(),
        assayForm: {
          formSchema: JSON.stringify({
            fields: {
              customField1: {
                control: {
                  type: 'TextBox',
                },
                i18nLabel: 'fieldLabel1',
              },
              customField2: {
                control: {
                  type: 'CheckBox',
                },
                i18nLabel: 'fieldLabel2',
              },
            },
            sendChangesOn: 'change',
          }),
        },
      })
      const requestWithResultFormData = _.merge(
        {},
        basicRequest({
          payload: { customField1: 'Some value entered by a user' },
          params: { resultId: 5678 },
        })
      )
      return runTest(resultService.updateFormData, [requestWithResultFormData])(
        response => {
          assert.isTrue(
            requestWithResultFormData.plugins.messageContext.resultUpdated.calledWith(
              5678
            )
          )
          assert.isOk(response.ok)
        }
      )
    })

    describe('fields with selectable options', () => {
      it("should return a 400 when multiple values are submitted for a field that doesn't allow multiple selections", () => {
        const resultService = resultServiceWithFakes({
          getResultByResultId: basicResult(),
          assay: basicAssay(),
          assayForm: {
            formSchema: JSON.stringify({
              fields: {
                singleSelectionField: {
                  control: {
                    type: 'ButtonGroup',
                    options: [
                      {
                        value: 'Yes',
                        i18nText: 'yes',
                      },
                      {
                        value: 'No',
                        i18nText: 'no',
                      },
                    ],
                    allowMultipleSelection: false,
                  },
                  i18nLabel: 'singleSelectionFieldLabel',
                },
              },
              sendChangesOn: 'change',
            }),
          },
        })
        const requestWithResultFormData = _.merge(
          {},
          basicRequest({
            payload: {
              singleSelectionField: ['Yes', 'No'],
            },
          })
        )
        return runTest(resultService.updateFormData, [
          requestWithResultFormData,
        ])(response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            `[Yes,No] is invalid for singleSelectionField because the field does not allow multiple values.`
          )
        })
      })

      it("should return a 400 when a value is submitted for a selection field that doesn't contain the value in it's options", async () => {
        const resultService = resultServiceWithFakes({
          getResultByResultId: basicResult(),
          assay: basicAssay(),
          assayForm: {
            formSchema: JSON.stringify({
              fields: {
                singleSelectionField: {
                  control: {
                    type: 'ButtonGroup',
                    options: [
                      {
                        value: 'Yes',
                        i18nText: 'yes',
                      },
                      {
                        value: 'No',
                        i18nText: 'no',
                      },
                    ],
                  },
                  i18nLabel: 'singleSelectionFieldLabel',
                },
              },
              sendChangesOn: 'change',
            }),
          },
        })
        const requestWithResultFormDataValuesInArray = _.merge(
          {},
          basicRequest({
            payload: {
              singleSelectionField: ['Maybe', 'Maybe Not'],
            },
          })
        )
        await runTest(resultService.updateFormData, [
          requestWithResultFormDataValuesInArray,
        ])(response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            `[Maybe,Maybe Not] are invalid for singleSelectionField because they are not present in the options configured for the field.`
          )
        })
        const requestWithResultFormDataValueInArray = _.merge(
          {},
          basicRequest({
            payload: {
              singleSelectionField: ['Maybe'],
            },
          })
        )
        await runTest(resultService.updateFormData, [
          requestWithResultFormDataValueInArray,
        ])(response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            `Maybe is invalid for singleSelectionField because it is not present in the options configured for the field.`
          )
        })
        const requestWithResultFormData = _.merge(
          {},
          basicRequest({
            payload: {
              singleSelectionField: 'Maybe',
            },
          })
        )
        return runTest(resultService.updateFormData, [
          requestWithResultFormData,
        ])(response => {
          assert.equal(response.output.statusCode, 400)
          assert.equal(
            response.output.payload.message,
            `Maybe is invalid for singleSelectionField because it is not present in the options configured for the field.`
          )
        })
      })

      it('should update the result when a valid value is passed', async () => {
        const resultService = resultServiceWithFakes({
          getResultByResultId: basicResult(),
          assay: basicAssay(),
          assayForm: {
            formSchema: JSON.stringify({
              fields: {
                singleSelectionField: {
                  control: {
                    type: 'ButtonGroup',
                    options: [
                      {
                        value: 'Yes',
                        i18nText: 'yes',
                      },
                      {
                        value: 'No',
                        i18nText: 'no',
                      },
                      {
                        value: '',
                        i18nText: 'unknown',
                      },
                    ],
                  },
                  i18nLabel: 'singleSelectionFieldLabel',
                },
              },
              sendChangesOn: 'change',
            }),
          },
        })
        const requestWithBlankResultFormData = _.merge(
          {},
          basicRequest(
            {
              payload: {
                singleSelectionField: 'No',
              },
              params: {
                resultId: 567,
              },
            },
            resultService.knex
          )
        )
        return runTest(resultService.updateFormData, [
          requestWithBlankResultFormData,
        ])(response => {
          assert.isTrue(
            requestWithBlankResultFormData.plugins.messageContext.resultUpdated.calledWith(
              567
            )
          )
          assert.isOk(response.ok)
        })
      })
    })
  })
})
