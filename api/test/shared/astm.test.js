const { assert } = require('chai')
const { getAstmField } = require('../../src/shared/astm')

const standardBDMGITAstmString = `H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|19981019184200
P|1
O|1|0970038018^1||^^^MGIT_960_AST
R|1|^^^AST_MGIT^439309967349^EMB^5.0^ug/ml|INST_COMPLETE^1234^R|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A02
R|2|^^^AST_MGIT^439309967349^RIF^1.0^ug/ml|INST_COMPLETE^12^S|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A03
L|1|N
`

describe('ASTM parser', () => {
  it('should return null if no ASTM message passed in', () => {
    const astmPosition = 'H,1,1,1'
    const expectedResult = null
    const resultString = getAstmField(null, astmPosition)
    assert.equal(resultString, expectedResult)
  })

  it('should return null if no ASTM position passed in', () => {
    const astmPosition = null
    const expectedResult = null
    const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
    assert.equal(resultString, expectedResult)
  })

  it('should return null if invalid ASTM position', () => {
    const astmPosition = 'X,1'
    const expectedResult = null
    const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
    assert.equal(resultString, expectedResult)
  })

  describe('When the message is from a BD MGIT DST', () => {
    it('should return the sender name if H,5,1,1 is passed in', () => {
      const astmPosition = 'H,5,1,1'
      const expectedResult = 'Becton Dickinson'
      const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
      assert.equal(resultString, expectedResult)
    })

    it('should return the growth units of the second result row if R,4,2,2 is passed in', () => {
      const astmPosition = 'R,4,2,2'
      const expectedResult = '12'
      const resultString = getAstmField(standardBDMGITAstmString, astmPosition)
      assert.equal(resultString, expectedResult)
    })
  })

  describe('When repeat delimiters are present in the message', () => {
    it('should allow the caller to find the value using the number of the repetition', () => {
      const repeatDelimiterAstmString = `H|\\^&|||My^Host^Computer|||||ASI^1.0^s/n||P|1|19930631
P|1||PID1234||Doe^John|Smith|19500522|M|||||Jones^Bob^^^Dr|||||300.0^Anxiety\\311.0^Depression|
O|1|SID1000||^^^10^Test10^protocol1\\^^^22^Test22|S|19930631|19930629||||N||||SERUM|Miller^John^^^Dr|||||||||O|
P|2||PID2222||Small^Jane|Smith|19400820|M|||||Jones^John^^^Dr||||||
O|1|SID1001||^^^20^Test20^protocol4|R|19930631|19930629||||N||||SERUM|Ahmad^Joe^^^Dr|||||||||O|
L|1|N
`
      const astmPosition = 'O,5[2],1,5'
      const expectedResult = 'Test22'
      const secondTestOrderForJohnDoe = getAstmField(
        repeatDelimiterAstmString,
        astmPosition
      )
      assert.equal(secondTestOrderForJohnDoe, expectedResult)
    })
  })
})
