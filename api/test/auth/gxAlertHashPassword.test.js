const chai = require('chai')
const { gxAlertHashPassword } = require('../../src/auth/gxalert')

const { expect } = chai

describe('This test is for testing the password hashing method of gxalert', () => {
  it('validate hashPassword algorithm case 1', async () => {
    const password = 'test123'
    const passwordKey = 'DqZGEd02RADwL79HTJdmFA=='
    const hash = gxAlertHashPassword(password, passwordKey)

    expect(hash).to.equal('mNP4tovfYHN8MAg2Ik3wt5OlvXcuIBy+zJ0ch8K00K4=')
  })

  it('validate hashPassword algorithm case 2', async () => {
    const password = 'y8Yv^M%8cCirAaeP'
    const passwordKey = '0ZhUmNpzKb1SYunffCNaoQ=='
    const hash = gxAlertHashPassword(password, passwordKey)

    expect(hash).to.equal('hC5xPI6pYAdbi6OBodE3d6GQUAWD59GcjqAcK0v1tLw=')
  })

  it('validate hashPassword algorithm case 3', async () => {
    const password = 'G6F1enRxBu'
    const passwordKey = '+K9DeslHt7BtZ8uPs8W0jA=='
    const hash = gxAlertHashPassword(password, passwordKey)

    expect(hash).to.equal('nwkK7y/H9pNvI7Ygxb1CUOPZYG1cb0xCLNPn5KDP8W4=')
  })
})
