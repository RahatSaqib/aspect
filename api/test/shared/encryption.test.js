const { assert } = require('chai')
const encryption = require('../../src/shared/encryption')

describe('encryption shared util', () => {
  describe('oneDirectionalMd5Hash', () => {
    const { oneDirectionalMd5Hash } = encryption

    it('should calculate one directional hash on strings the same way that gxAlert does', () => {
      // Result IDs in GxAlert are calculated by hashing the result sample ID.
      // If we want to correlate results between GxAlert and Aspect, we need to
      // use the same one directional hashing algorithm
      const sampleIdsAndHashedSampleIds = {
        'LL MP 1352': 'db9ddd2622857210c51f0f390a5ffc68',
        LLMP1348: 'e084216d626c1d36cbc51d0c56642d6e',
        'LL MP 1351': '9961ae0eedf84219a0e2e2299842c5dc',
        BWL6855: '3905cabadcde926bb432034c736aa5df',
        'sanou souleymane': '1977583733f63264e43166784f19b29e',
        'bado jean y a': '8483070fdf94c900c3faac2777dd260c',
        'yameogo george': 'b4372be81bd3d5874ea39ff8750561e7',
        'SMP-106426': 'b667fc59ea6fa80de6e3a5e13edb05fb',
        '17049199': '7647ff7bf741a5d2a920906371d8ad95',
        '17049087': '39b40d62022af64c19436ea2fd762076',
        '2301': '2b45c629e577731c4df84fc34f936a89',
        '12224': 'eafd9b2037cb218fafd3aa05535c123e',
        '01-1601-17': 'acb6dbc6bbb71f10c41cd0b2201d2bff',
      }

      for (const sampleId in sampleIdsAndHashedSampleIds) {
        if (typeof sampleIdsAndHashedSampleIds[sampleId] === 'string') {
          const hashedSampleId = oneDirectionalMd5Hash(sampleId)
          assert.equal(hashedSampleId, sampleIdsAndHashedSampleIds[sampleId])
        }
      }
      const hashedUndefined = oneDirectionalMd5Hash()
      assert.isUndefined(hashedUndefined)
      const hashedNull = oneDirectionalMd5Hash(null)
      assert.isNull(hashedNull)
    })
  })
})
