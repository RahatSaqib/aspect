const { assert } = require('chai')
const { extractSampleId } = require('../../../../src/plugin/partner/Angola/extractSampleId')
const { extractSampleId: defaultExtractSampleId } = require('../../../../src/plugin/deviceType/extractSampleId')

describe('extractSampleId - Angola Implementation', () => {
  describe('Angola Pattern Tests', () => {
    it('should extract Angola pattern sampleId from result.sample.id', () => {
      const result = {
        sample: {
          id: 'A344B0AD89-250604-XA5',
        },
      }
      assert.equal(extractSampleId(result), 'A344B0AD89-250604-XA5')
    })

    it('should extract Angola pattern sampleId from result.data.sampleId', () => {
      const result = {
        data: {
          sampleId: 'C5BE87323F-250611-F48',
        },
      }
      assert.equal(extractSampleId(result), 'C5BE87323F-250611-F48')
    })

    it('should extract Angola pattern from result.data.patientId', () => {
      const result = {
        sample: {
          id: '',
        },
        data: {
          patientId: '1D7EE825E4-250613-4AY',
        },
      }
      assert.equal(extractSampleId(result), '1D7EE825E4-250613-4AY')
    })

    it('should extract Angola pattern from notes', () => {
      const result = {
        notes: 'Sample ID: A344B0AD89-250604-XA5 was processed',
      }
      assert.equal(extractSampleId(result), 'A344B0AD89-250604-XA5')
    })

    it('should extract Angola pattern from data.notes', () => {
      const result = {
        data: {
          notes: 'Processing sample 1D7EE825E4-250613-4AY for analysis',
        },
      }
      assert.equal(extractSampleId(result), '1D7EE825E4-250613-4AY')
    })

    it('should extract first Angola pattern when multiple are present', () => {
      const result = {
        notes: 'Samples: A344B0AD89-250604-XA5 and C5BE87323F-250611-F48 were processed',
      }
      assert.equal(extractSampleId(result), 'A344B0AD89-250604-XA5')
    })
  })

  describe('Fallback to Default Pattern Tests', () => {
    it('should fall back to default pattern when Angola pattern not found', () => {
      const result = {
        sample: {
          id: '123-456789-012',
        },
      }
      assert.equal(extractSampleId(result), '123-456789-012')
    })

    it('should fall back to default pattern from notes', () => {
      const result = {
        notes: 'Sample ID: 123-456789-012 was processed',
      }
      assert.equal(extractSampleId(result), '123-456789-012')
    })

    it('should fall back to default pattern from patientId', () => {
      const result = {
        data: {
          patientId: '987-654321-098',
        },
      }
      assert.equal(extractSampleId(result), '987-654321-098')
    })

    it('should return invalid format from sample.id if no valid patterns found anywhere', () => {
      const result = {
        sample: {
          id: 'invalid-format',
        },
      }
      assert.equal(extractSampleId(result), 'invalid-format')
    })

    it('should return null when no valid sampleId found anywhere', () => {
      const result = {
        notes: 'No valid sample ID in this note',
      }
      assert.isNull(extractSampleId(result))
    })
  })

  describe('Pattern Priority Tests', () => {
    it('should prefer default pattern over Angola pattern when both are present', () => {
      const result = {
        sample: {
          id: 'A344B0AD89-250604-XA5',
        },
        data: {
          patientId: '123-456789-012',
        },
      }
      // Now default pattern (123-456789-012) should win over Angola pattern
      assert.equal(extractSampleId(result), '123-456789-012')
    })

    it('should find default pattern in notes even when Angola pattern is in sample.id', () => {
      const result = {
        sample: {
          id: 'invalid-format',
        },
        notes: 'Angola sample: C5BE87323F-250611-F48 and default 123-456789-012',
      }
      // Default pattern should be found first in notes
      assert.equal(extractSampleId(result), '123-456789-012')
    })

    it('should use Angola pattern only when default pattern is not found', () => {
      const result = {
        sample: {
          id: 'A344B0AD89-250604-XA5',
        },
        notes: 'No default pattern here, only Angola format',
      }
      // Only Angola pattern present, so it should be used
      assert.equal(extractSampleId(result), 'A344B0AD89-250604-XA5')
    })
  })
})
