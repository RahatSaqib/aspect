const {
  resultDataMappings,
} = require('../../../src/deviceApiRaw/dataProcessors/philippinesNtrlPmdt/mappings')
const {
  getResultDataMapper,
} = require('../../../src/deviceApiRaw/dataProcessors/common/mapping')
const {
  dstAssayBdMgitAst,
  dstAssayGenericDst,
  smearAssaySmear,
  genexpertGxMtbRif,
  lpaAssayLpa,
  tbLampAssayTbLamp,
} = require('./pmdtMappings')
const { testMappings } = require('./common')

const mapResultData = getResultDataMapper(resultDataMappings)

describe('Philippines PMDT Data Processor', () => {
  describe('result data mapping', () => {
    it('dst - assayBdMgitAst', async () => {
      testMappings(dstAssayBdMgitAst, mapResultData)
    })

    it('dst - assayGenericDst', async () => {
      testMappings(dstAssayGenericDst, mapResultData)
    })

    it.skip('culture - assayBdMgitGnd', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })

    it.skip('culture - assayCulture', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
      // Unexistent assay in DB
    })

    it('smear - assaySmear', async () => {
      testMappings(smearAssaySmear, mapResultData)
    })

    it('genexpert - GxMtbRif', async () => {
      testMappings(genexpertGxMtbRif, mapResultData)
    })

    it.skip('genexpert - GxMtbRifUltra', async () => {
      // I DIDN'T FIND ANY EXISTING RESULTS
    })

    it('lpa - assayLPA', async () => {
      testMappings(lpaAssayLpa, mapResultData)
    })

    it('tb lamp - assayTbLamp', async () => {
      testMappings(tbLampAssayTbLamp, mapResultData)
    })
  })
})
