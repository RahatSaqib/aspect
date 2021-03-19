const { assert } = require('chai')
const mapGxConnectCustomFields = require('../../../src/plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const aspectFields = require('./customFieldsForm.json')
const mappingResult = require('./mappingResult.json')

describe('Custom field mapper', () => {
  it('it generates the mapping between aspect dynamic forms and gxconnect expected json', () => {
    const mappingOutput = mapGxConnectCustomFields(aspectFields)
    // we are going to validate the right mapping
    assert.deepEqual(mappingOutput, mappingResult)
  })
})
