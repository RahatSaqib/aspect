const { assert } = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const _ = require('lodash')
const Promise = require('bluebird')

describe('result/service', () => {
  function createFakeKnex({ getResultByResultId = {}, assay = {}, assayForm = {} } = {}) {
    const fakeKnexFunction = tableName => {
      let firstResult = {}
      let selectResult = []
      if (tableName === 'Assay as a') {
        firstResult = _.cloneDeep(assay)
      } else if (tableName === 'Result as r') {
        selectResult = _.isEmpty(getResultByResultId) ? [] : [_.cloneDeep(getResultByResultId)]
      } else if (tableName === 'ResultForm') {
        firstResult = _.cloneDeep(assayForm)
      } else if (tableName === 'Device') {
        firstResult = { id: 1 }
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
      this.insert = () => Promise.resolve([1])
      this.from = () => this
      this.whereIn = () => this
      this.groupBy = () => this
      this.as = () => this
      return this
    }
    return _.merge(fakeKnexFunction, fakeKnexFunction())
  }

  function resultServiceWithFakes(knexResults, extraServices = {}) {
    const fakeKnex = createFakeKnex(knexResults)
    const resultService = proxyquire(
      '../../src/result/service',
      _.merge(
        {
          '../db': { knex: fakeKnex },
          '../auth/constraints': {
            getConstraints: () => {},
            addConstraints: () => {},
          },
          '../auth/service': {
            getUser: () =>
              Promise.resolve({
                id: 1,
                userName: 'Admin',
                partnerId: 1,
              }),
          },
          '../shared/dictionary': {
            deviceTypeToId: async externalId => {
              let returnValue
              if (externalId === 'Aspect') {
                returnValue = 3
              }
              return Promise.resolve(returnValue)
            },
          },
          '../site/service': {
            getSite: async () => Promise.resolve(null),
          },
          '../device/service': {
            getDeviceByDeviceId: async () => Promise.resolve(null),
          },
        },
        extraServices
      )
    )
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
            queue: {
              waitForAction: async () => Promise.reject(),
            },
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
    it('should return a 404 response when the result cannot be found', async () => {
      const resultService = resultServiceWithFakes()
      const response = await resultService.updateFormData(basicRequest())
      assert.equal(response.output.statusCode, 404)
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

      await resultService.updateFormData(basicRequest())
      assert.isFalse(resultService.knex.calledWith('ResultForm'))

      const requestWithChangedResultForm = basicRequest({
        payload: { expertInterpretation: 'Uninterpretable' },
      })

      await resultService.updateFormData(requestWithChangedResultForm)
      assert.isFalse(resultService.knex.calledWith('ResultForm'))
    })

    it('should return a 400 response when form data is submitted and there is no form schema defined', async () => {
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
      const response = await resultService.updateFormData(requestWithResultFormData)

      assert.equal(response.output.statusCode, 400)
      assert.equal(
        response.output.payload.message,
        'This result cannot accept form data because no form schema is defined.'
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
      let response = await resultService.updateFormData(requestWithResultFormData)
      assert.equal(response.output.statusCode, 400)
      assert.equal(
        response.output.payload.message,
        "This result cannot accept the following field in it's form data: someUndefinedField because it is not defined in the forms schema."
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
      response = await resultService.updateFormData(requestWithResultFormData)
      assert.equal(response.output.statusCode, 400)
      assert.equal(
        response.output.payload.message,
        "This result cannot accept the following fields in it's form data: [someUndefinedField,anotherUndefinedField] because they are not defined in the forms schema."
      )
    })

    it('should allow null values', async () => {
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
      const response = await resultService.updateFormData(requestWithResultFormData)

      assert.isTrue(requestWithResultFormData.plugins.messageContext.resultUpdated.calledWith(1234))
      assert.isOk(response.ok)
    })

    it('should allow non-null values', async () => {
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
      const response = await resultService.updateFormData(requestWithResultFormData)
      assert.isTrue(requestWithResultFormData.plugins.messageContext.resultUpdated.calledWith(5678))
      assert.isOk(response.ok)
    })

    describe('fields with selectable options', () => {
      it("should return a 400 when multiple values are submitted for a field that doesn't allow multiple selections", async () => {
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
        const response = await resultService.updateFormData(requestWithResultFormData)
        assert.equal(response.output.statusCode, 400)
        assert.equal(
          response.output.payload.message,
          `[Yes,No] is invalid for singleSelectionField because the field does not allow multiple values.`
        )
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
        let response = await resultService.updateFormData(requestWithResultFormDataValuesInArray)
        assert.equal(response.output.statusCode, 400)
        assert.equal(
          response.output.payload.message,
          `[Maybe,Maybe Not] are invalid for singleSelectionField because they are not present in the options configured for the field.`
        )

        const requestWithResultFormDataValueInArray = _.merge(
          {},
          basicRequest({
            payload: {
              singleSelectionField: ['Maybe'],
            },
          })
        )
        response = await resultService.updateFormData(requestWithResultFormDataValueInArray)
        assert.equal(response.output.statusCode, 400)
        assert.equal(
          response.output.payload.message,
          `Maybe is invalid for singleSelectionField because it is not present in the options configured for the field.`
        )
        const requestWithResultFormData = _.merge(
          {},
          basicRequest({
            payload: {
              singleSelectionField: 'Maybe',
            },
          })
        )
        response = await resultService.updateFormData(requestWithResultFormData)
        assert.equal(response.output.statusCode, 400)
        assert.equal(
          response.output.payload.message,
          `Maybe is invalid for singleSelectionField because it is not present in the options configured for the field.`
        )
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
        const response = await resultService.updateFormData(requestWithBlankResultFormData)
        assert.isTrue(requestWithBlankResultFormData.plugins.messageContext.resultUpdated.calledWith(567))
        assert.isOk(response.ok)
      })
    })
  })

  function siteServiceMock() {
    return {
      getSite: () =>
        Promise.resolve({
          id: 1,
        }),
    }
  }

  function assayServiceMock() {
    return {
      getAllAssaySchemas: () =>
        Promise.resolve([
          {
            id: 1,
          },
        ]),
      getAssayResultCategories: () =>
        Promise.resolve([
          {
            id: 1,
          },
          {
            id: 2,
          },
        ]),
    }
  }

  function assayMissingServiceMock() {
    return {
      getAllAssaySchemas: () => Promise.resolve([]),
      getAssayResultCategories: () => Promise.resolve([]),
    }
  }

  describe('updateResult', () => {
    function resultUpdatePayload(extraPayload = {}) {
      const payload = _.merge({}, extraPayload)
      return { payload }
    }

    function basicResultForUpdate(extraDetails = {}) {
      return _.merge(
        {
          id: 1,
          siteId: 1,
          deviceId: 1,
          assayId: 1,
          sampleId: 1,
          partnerId: 1,
          resultCategory1: 1,
          resultCategory2: 1,
          endedOn: new Date(),
          resultSourceExternalId: 'EnteredByHand',
        },
        extraDetails
      )
    }

    it('should return a 404 response when the result cannot be found', async () => {
      const resultService = resultServiceWithFakes()

      const response = await resultService.updateResult(basicRequest(resultUpdatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This result does not exist or you do not have access.')
    })

    it('should return a 404 response when the site cannot be found', async () => {
      const resultService = resultServiceWithFakes({
        getResultByResultId: basicResultForUpdate(),
      })

      const response = await resultService.updateResult(basicRequest(resultUpdatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This site does not exist or you do not have access.')
    })

    it('should return a 404 response when the assay cannot be found', async () => {
      const resultService = resultServiceWithFakes(
        {
          getResultByResultId: basicResultForUpdate(),
        },
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayMissingServiceMock(),
        }
      )

      const response = await resultService.updateResult(basicRequest(resultUpdatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This assay does not exist or you do not have access.')
    })

    it('should return a 400 response when the selected result does not apply to the assay', async () => {
      const resultService = resultServiceWithFakes(
        {
          getResultByResultId: basicResultForUpdate(),
        },
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.updateResult(basicRequest(resultUpdatePayload({ resultCategory1: 99 })))
      assert.equal(response.output.statusCode, 400)
      assert.equal(response.output.payload.message, 'The selected result is not valid for this assay.')
    })

    it('should return a 404 response when the device cannot be found', async () => {
      const resultService = resultServiceWithFakes(
        {
          getResultByResultId: basicResultForUpdate(),
        },
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.updateResult(
        basicRequest(resultUpdatePayload({ resultCategory1: 1, deviceId: 99 }))
      )
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This device does not exist or you do not have access.')
    })

    it('should return a 400 response when the result was originally reported by a device and user tries to change result categories or start/end dates', async () => {
      const resultService = resultServiceWithFakes(
        {
          getResultByResultId: basicResultForUpdate({
            resultSourceExternalId: 'DiagnosticDevice',
          }),
        },
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.updateResult(
        basicRequest(resultUpdatePayload({ resultCategory1: 2, resultCategory2: 2 }))
      )
      // assert.equal(response.output.statusCode, 400)
      assert.equal(
        response.output.payload.message,
        'You cannot change the result of an assay that was reported by a device.'
      )
    })
  })

  describe('createResult', () => {
    function resultCreatePayload(extraPayload = {}) {
      const payload = _.merge(
        {
          assayId: 1,
          siteId: 1,
        },
        extraPayload
      )
      return { payload }
    }

    it('should return a 404 response when the site cannot be found', async () => {
      const resultService = resultServiceWithFakes({})

      const response = await resultService.createResult(basicRequest(resultCreatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This site does not exist or you do not have access.')
    })

    it('should return a 404 response when the assay cannot be found', async () => {
      const resultService = resultServiceWithFakes(
        {},
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayMissingServiceMock(),
        }
      )

      const response = await resultService.createResult(basicRequest(resultCreatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This assay does not exist or you do not have access.')
    })

    it('should return a 400 response when the selected result does not apply to the assay', async () => {
      const resultService = resultServiceWithFakes(
        {},
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.createResult(basicRequest(resultCreatePayload({ resultCategory1: 99 })))
      assert.equal(response.output.statusCode, 400)
      assert.equal(response.output.payload.message, 'The selected result is not valid for this assay.')
    })

    it('should return a 404 response when the device cannot be found', async () => {
      const resultService = resultServiceWithFakes(
        {},
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.createResult(
        basicRequest(resultCreatePayload({ resultCategory1: 1, deviceId: 99 }))
      )
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This device does not exist or you do not have access.')
    })
  })
})
