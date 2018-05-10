const { assert } = require('chai')
const stringProcessor = require('../../src/notification/stringProcessor')
const { runTest } = require('../utils/generatorFunctionUtils')

describe('notification/stringProcessor', () => {
  describe('process', () => {
    const sampleString =
      'Device in {{site.state}}, {{site.country}} is currently offline'
    const expectedResult = 'Device in Ohio, United States is currently offline'
    const site = {
      shortName: 'Cuyoga, OH #1',
      state: 'Ohio',
      country: 'United States',
    }
    it('should replace matching words in the template string', () =>
      runTest(stringProcessor.processStringTemplate, [sampleString, site])(
        resultString => {
          assert.deepEqual(resultString, expectedResult)
        }
      ))
  })

  describe('process', () => {
    const sampleString = 'Hello {{person.name}}'
    const expectedResult = 'Hello '
    const inputObject = {
      site: {
        shortName: 'Cuyoga, OH #1',
        state: 'Ohio',
        country: 'United States',
      },
    }
    it('should handle missing word replacements in input inputObject', () =>
      runTest(stringProcessor.processStringTemplate, [
        sampleString,
        inputObject,
      ])(resultString => {
        assert.deepEqual(resultString, expectedResult)
      }))
  })
  describe('process', () => {
    const sampleString = 'Device {{device.shortName}} is offline'
    const expectedResult = 'Device  is offline'
    const inputObject = {
      device: {
        state: 'Ohio',
        country: 'United States',
      },
    }
    it('should handle missing value in the input object', () =>
      runTest(stringProcessor.processStringTemplate, [
        sampleString,
        inputObject,
      ])(resultString => {
        assert.deepEqual(resultString, expectedResult)
      }))
  })
  describe('process', () => {
    const sampleString =
      'New {{result.assayName}} result from Device {{device.shortName}} at {{site.state}}, {{site.country}}'
    const expectedResult =
      'New HivVl result from Device Eldoret #1 at Uasin Gishu, Kenya'
    const site = {
      state: 'Uasin Gishu',
      country: 'Kenya',
    }
    const device = {
      shortName: 'Eldoret #1',
      name: 'Uasin Gishu County, Eldoret #1',
    }
    const result = {
      endedOn: '2018-02-20',
      patientId: 'P001-005',
      assayName: 'HivVl',
      sampleId: 'GRP-HIV-2',
    }

    it('should handle multiple objects in the input object', () =>
      runTest(stringProcessor.processStringTemplate, [
        sampleString,
        site,
        device,
        result,
      ])(resultString => {
        assert.deepEqual(resultString, expectedResult)
      }))
  })
})
