const chai = require('chai')

const DefaultCOBAS = require('../../src/deviceApiRaw/dataProcessors/cobas')

const { assert } = chai

describe('Device API Raw cobas Data Processor', () => {
  const request = {
    payload: {
      header:
        'H|^&|||LIS^00000000-0000-0000-0000-000000001116^UserID^0.0.0.1^1394.LIS2|||||cobas 4800|TSDWN^REAL|P|1|YYYYMMDDhhmmss\n',
      body: 'P|1\nO|1|BarcodeID1||^^^^^RunType|||YYYYMMDDhhmmss||||N||||||||||||||Y\nL|1|N\n\r',
    },
  }
  const badRequest = {
    payload: {
      header:
        'H|^&|||LIS^00000000-0000-0000-0000-000000001116^UserID^0.0.0.1^1394.LIS2|||||notcobas 4800|TSDWN^REAL|P|1|YYYYMMDDhhmmss\n',
      body: 'P|1\nO|1|BarcodeID1||^^^^^RunType|||YYYYMMDDhhmmss||||N||||||||||||||Y\nL|1|N\n\r',
    },
  }

  it('it test the header, return true if it is cobas device or not', async () => {
    assert.isTrue(await DefaultCOBAS.canProcessRequest(request))
    assert.isFalse(await DefaultCOBAS.canProcessRequest(badRequest))
  })
})
