const { assert } = require('chai')
const { buildGeneXpertModuleSuffix } = require('../../../../src/plugin/partner/Bangladesh/geneXpertModuleSuffix')

describe('buildGeneXpertModuleSuffix - Bangladesh', () => {
  it('returns empty string when all module fields are empty or zero', () => {
    assert.equal(buildGeneXpertModuleSuffix({}), '')
    assert.equal(buildGeneXpertModuleSuffix({ moduleBayCapacity: 0, gx6cModulesCount: 0, gx10cModulesCount: 0 }), '')
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: null, gx6cModulesCount: null, gx10cModulesCount: null }),
      ''
    )
  })

  it('builds homogeneous GeneXpert suffix with capacity and single module type', () => {
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: null }),
      '(4m 6c)'
    )
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: 4, gx6cModulesCount: 4, gx10cModulesCount: 0 }),
      '(4m 6c)'
    )
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: 16, gx6cModulesCount: null, gx10cModulesCount: 12 }),
      '(16m 10c)'
    )
  })

  it('builds mixed module-type suffix with per-type counts', () => {
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: 16, gx6cModulesCount: 4, gx10cModulesCount: 12 }),
      '(16m, 4x6c, 12x10c)'
    )
  })

  it('omits capacity when absent and shows module count for a single type', () => {
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: null, gx6cModulesCount: 4, gx10cModulesCount: null }),
      '(4x6c)'
    )
    assert.equal(
      buildGeneXpertModuleSuffix({ moduleBayCapacity: 0, gx10cModulesCount: 2, gx6cModulesCount: null }),
      '(2x10c)'
    )
  })

  it('shows capacity-only suffix when module counts are absent', () => {
    assert.equal(buildGeneXpertModuleSuffix({ moduleBayCapacity: 16 }), '(16m)')
  })
})
