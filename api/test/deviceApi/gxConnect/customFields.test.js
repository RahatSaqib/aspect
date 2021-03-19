const { assert } = require('chai')
const mapGxConnectCustomFields = require('../../../src/plugin/deviceType/GxConnect/customFields')
const aspectFields = require('./customFieldsForm.json')
const mappingResult = require('./mappingResult.json')

describe('Extracting data from Result Text HIV VL', () => {
  it('it extract the number of copies and categorizes it', () => {
    const mappingOutput = mapGxConnectCustomFields(aspectFields)
    assert.deepEqual(mappingOutput, mappingResult)
  })
})
