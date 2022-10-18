const { resultDataMappings } = require('../../../src/deviceApiRaw/dataProcessors/philippinesNtrlRitm/mappings')
const { testTypes } = require('../../../src/deviceApiRaw/dataProcessors/common/mapping')
const { dstAssayGenericDst, smearAssaySmear, genexpertGxMtbRif } = require('./ritmMappings')
const { testMappings } = require('./common')

describe('Philippines RITM Data Processor', () => {
  describe('result data mapping', () => {
    it.skip('dst - assayBdMgitAst', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })

    it('dst - assayGenericDst', async () => {
      testMappings(dstAssayGenericDst, resultDataMappings, testTypes.DST)
    })

    it.skip('culture - assayBdMgitGnd', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })

    it.skip('culture - assayGenericCulture', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
      // Unexistent assay in DB
    })

    it('smear - assaySmear', async () => {
      testMappings(smearAssaySmear, resultDataMappings, testTypes.SMEAR)
    })

    it('genexpert - GxMtbRif', async () => {
      testMappings(genexpertGxMtbRif, resultDataMappings, testTypes.GENEXPERT)
    })

    it.skip('genexpert - GxMtbRifUltra', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })

    it.skip('lpa - assayTbLamp', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })
  })
})
