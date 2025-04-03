const { assert } = require('chai')
const _ = require('lodash')
const { getResultCategories } = require('../../src/plugin/deviceType/gxUtils')
const assayResults = require('../deviceApi/geneXpert/notVLResultTextMappings')
const { basicResultPayload } = require('../deviceApi/geneXpert/geneXpertConstants')

const getPayloadsCollection = trackedResults => {
  return _.map(trackedResults, assertion => {
    const {
      resultText,
      resultCategory1ExternalId: expectedCategory1,
      resultCategory2ExternalId: expectedCategory2,
      assayExternalId,
    } = assertion
    const payload = _.merge(
      {
        type: {
          id: 'someDeviceType',
        },
      },
      { name: `MyAwsomeDevice${Math.random() * 1000}` },
      basicResultPayload,
      {
        result: {
          id: `new result ${Math.floor(Math.random() * 1000)}`,
          startedOn: new Date(),
          data: { resultText },
          assay: { id: assayExternalId },
          sample: {
            id: `new sample ${Math.floor(Math.random() * 1000)}`,
          },
          instrument: {
            serial: `new instrument ${Math.floor(Math.random() * 1000)}`,
          },
        },
      }
    )
    return { payload, expectedCategory1, expectedCategory2 }
  })
}
describe('Extracting data from Result Text and categorize them', async () => {
  _.each(_.keys(assayResults), key => {
    const assayTypeResults = assayResults[key]

    it(`should obtain  ${key} proper result categories base on it result text property`, async () => {
      getPayloadsCollection(assayTypeResults).forEach(result => {
        const payload = _.assign({}, result.payload.result)
        const assayExternalId = _.get(payload, 'assay.id')
        const resultText = _.get(payload, 'data.resultText')
        const payloadCategory = getResultCategories(assayExternalId, resultText)
        const expected = {
          resultCategory1Id: result.expectedCategory1,
          resultCategory2Id: result.expectedCategory2,
        }
        const actual = {
          resultCategory1Id: _.get(payloadCategory[0], 'id', null),
          resultCategory2Id: _.get(payloadCategory[1], 'id', null),
        }
        assert.deepEqual(expected, actual)
      })
    })
  })
})
