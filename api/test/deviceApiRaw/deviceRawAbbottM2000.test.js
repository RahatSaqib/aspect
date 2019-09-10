const chai = require('chai')
const fs = require('fs')
const path = require('path')
const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')

const { assert } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  let vlPklPayload = ''
  let abbottStandardInterfaceExample = ''

  before(() => {
    // The example below is an obfuscated copy of a PKL taken from the Abbott M2000 running HIV Viral Load Tests
    vlPklPayload = fs.readFileSync(
      path.join(__dirname, 'abbottM2000VL.pkl'),
      'utf8'
    )
    // The example below is adapted from the Abbott Standard Interface RS-232 Manual
    // https://kb.systemone.id/display/AS/CHAI+LIMS+Import+File+Produced+from+the+CHAI+-+Abbott+M2000+Connector?preview=%2F68357610%2F211490207%2FAbbott+Standard+Interface+Manual.pdf
    abbottStandardInterfaceExample = fs.readFileSync(
      path.join(__dirname, 'abbottStandardInterface.pkl'),
      'utf8'
    )
  })

  it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
    const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
      payload: vlPklPayload,
    })
    assert.isOk(isM2000Payload)
    const isAbbotStandardInterfacePayload = await DefaultAbbottM2000.canProcessRequest(
      { payload: abbottStandardInterfaceExample }
    )
    assert.isOk(isAbbotStandardInterfacePayload)
  })

  it('should be able to parse a PKL file into results', async () => {
    /*
    const m2000DataProcessorViralLoad = new DefaultAbbottM2000({
      payload: vlPklPayload,
    })
    await m2000DataProcessorViralLoad.processRequest()
    */
    const m2000DataProcessorStandardInterfaceExample = new DefaultAbbottM2000({
      payload: abbottStandardInterfaceExample,
    })
    await m2000DataProcessorStandardInterfaceExample.processRequest()
    // console.log(JSON.stringify(m2000DataProcessorStandardInterfaceExample.results))
    // console.log(m2000DataProcessorStandardInterfaceExample.results.length)
  })
})
