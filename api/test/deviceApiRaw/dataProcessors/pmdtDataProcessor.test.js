const { resultDataMappings } = require('../../../src/deviceApiRaw/dataProcessors/philippinesNtrlPmdt/mappings')
const { testTypes } = require('../../../src/deviceApiRaw/dataProcessors/common/mapping')
const {
  dstAssayBdMgitAst,
  dstAssayGenericDst,
  smearAssaySmear,
  genexpertGxMtbRif,
  lpaAssayLpa,
  tbLampAssayTbLamp,
} = require('./pmdtMappings')
const { testMappings } = require('./common')

describe('Philippines PMDT Data Processor', () => {
  describe('result data mapping', () => {
    it('dst - assayBdMgitAst', async () => {
      testMappings(dstAssayBdMgitAst, resultDataMappings, testTypes.DST)
    })

    it('dst - assayGenericDst', async () => {
      testMappings(dstAssayGenericDst, resultDataMappings, testTypes.DST)
    })

    it.skip('culture - assayBdMgitGnd', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })

    it.skip('culture - assayCulture', async () => {
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

    it('lpa - assayLPA', async () => {
      testMappings(lpaAssayLpa, resultDataMappings, testTypes.LPA)
    })

    it('tb lamp - assayTbLamp', async () => {
      testMappings(tbLampAssayTbLamp, resultDataMappings, testTypes.TBLAMP)
    })
  })
})
