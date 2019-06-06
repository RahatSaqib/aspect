const { assert } = require('chai')
const { runTest } = require('../utils/generatorFunctionUtils')

const astmString = `H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|19981019184200
P|1
O|1|0970038018^1||^^^MGIT_960_AST
R|1|^^^AST_MGIT^439309967349^EMB^5.0^ug/ml|INST_COMPLETE^1234^R|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A02
R|2|^^^AST_MGIT^439309967349^RIF^1.0^ug/ml|INST_COMPLETE^12^S|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A03
L|1|N
`

describe('ASTM parser', () => {
  const { getAstmField } = require('../../src/shared/astm')

  it('should return null if no ASTM message passed in', () => {
    const astmPosition = 'H,1,1,1'
    const expectedResult = null

    return runTest(getAstmField, [null, astmPosition])(resultString => {
      assert.deepEqual(resultString, expectedResult)
    })
  })

  it('should return null if no ASTM position passed in', () => {
    const astmPosition = null
    const expectedResult = null

    return runTest(getAstmField, [astmString, astmPosition])(resultString => {
      assert.deepEqual(resultString, expectedResult)
    })
  })

  it('should return null if invalid ASTM position', () => {
    const astmPosition = 'X,1'
    const expectedResult = null

    return runTest(getAstmField, [astmString, astmPosition])(resultString => {
      assert.deepEqual(resultString, expectedResult)
    })
  })

  it('should return the sender name if H,5,1,1 is passed in', () => {
    const astmPosition = 'H,5,1,1'
    const expectedResult = 'Becton Dickinson'

    return runTest(getAstmField, [astmString, astmPosition])(resultString => {
      assert.deepEqual(resultString, expectedResult)
    })
  })

  it('should return the growth units of the second result row if R,4,2,2 is passed in', () => {
    const astmPosition = 'R,4,2,2'
    const expectedResult = '12'

    return runTest(getAstmField, [astmString, astmPosition])(resultString => {
      assert.deepEqual(resultString, expectedResult)
    })
  })
})
