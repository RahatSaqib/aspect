const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const matchType = require('../../../../src/plugin/result/geneXpert/resultMatchType')

const fakeVersion1 = '1.0.0'
const fakeDate = '2023-05-01'
const fakePreviousDate = '2023-04-01'
const fakeInstrumentSerial = 29965547
const fakeConsumableSerial = 87464445
const fakeNotMatchingInstrumentSerial = 666667
const fakeNotMatchingConsumableSerial = 99999996
const fakeGxAlertUniqueId = '719533_425027_c984b7da'
const fakeNotMatchingGxAlertUniqueId = '978654_454655_qr79g87'

const resultDetails = {
  partnerId: 1,
  gxAlertUniqueId: fakeGxAlertUniqueId,
  instrumentSerial: fakeInstrumentSerial,
  cartridgeSerial: fakeConsumableSerial,
  createdOn: fakeDate,
}
const directMatch = {
  id: 100,
  externalId: fakeGxAlertUniqueId,
  instrumentSerial: fakeInstrumentSerial,
  consumableSerial: fakeConsumableSerial,
  createdOn: fakeDate,
}

const matchByGxAlertUniqueIdOnly = {
  id: 80,
  partnerId: 1,
  externalId: fakeGxAlertUniqueId,
  instrumentSerial: fakeNotMatchingInstrumentSerial,
  consumableSerial: fakeNotMatchingConsumableSerial,
  createdOn: fakeDate,
}

const matchByConsumableOnly = {
  id: 90,
  partnerId: 1,
  externalId: fakeNotMatchingGxAlertUniqueId,
  instrumentSerial: fakeInstrumentSerial,
  consumableSerial: fakeConsumableSerial,
  createdOn: fakeDate,
}

describe('findResult', () => {
  let findResult
  const knexStub = {
    select: sinon.stub().returnsThis(),
    from: sinon.stub().returnsThis(),
    leftJoin: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis(),
    orWhere: sinon.stub().returnsThis(),
    andWhere: sinon.stub().returnsThis(),
    raw: sinon.stub().returnsThis(),
  }

  beforeEach(() => {
    findResult = proxyquire('../../../../src/plugin/result/geneXpert/resultIdentification/findResult_v1', {
      knex: () => knexStub,
    }).findResult
  })

  it('should handle an exact match', async () => {
    knexStub.then = sinon.stub().resolves([directMatch])

    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(directMatch)
    expect(result.matchType, 'matchType').to.equal(matchType.EXACT_MATCH)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates).to.have.lengthOf(0)
  })

  it('should match exact even if there is an inexact match before, and inform possible duplicate', async () => {
    knexStub.then = sinon.stub().resolves([
      matchByConsumableOnly,
      directMatch,
      matchByGxAlertUniqueIdOnly,
      {
        ...matchByConsumableOnly,
        createdOn: fakePreviousDate,
        id: 1027,
      },
    ])

    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(directMatch)
    expect(result.matchType, 'matchType').to.equal(matchType.EXACT_MATCH)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates).to.have.lengthOf(3)
  })

  it('should find a result if the best candidate matchs only by gxAlertUniqueId', async () => {
    knexStub.then = sinon.stub().resolves([matchByGxAlertUniqueIdOnly, matchByConsumableOnly])

    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(matchByGxAlertUniqueIdOnly)
    expect(result.matchType, 'matchType').to.equal(matchType.ONLY_EXTERNAL_ID)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates).to.have.lengthOf(1)
  })

  it('should find a result if the best candidate matchs only by consumable', async () => {
    knexStub.then = sinon.stub().resolves([matchByConsumableOnly])

    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(matchByConsumableOnly)
    expect(result.matchType, 'matchType').to.equal(matchType.ONLY_CONSUMABLE)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates).to.have.lengthOf(0)
  })

  it('two matching by consumable only, it should take the older one and inform possible duplicate', async () => {
    const olderMatch = { ...matchByConsumableOnly, createdOn: fakePreviousDate, id: 1025 }
    knexStub.then = sinon.stub().resolves([matchByConsumableOnly, olderMatch])

    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(olderMatch)
    expect(result.matchType, 'matchType').to.equal(matchType.ONLY_CONSUMABLE)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates, 'possible duplicates').to.have.lengthOf(1)
  })

  it('duplicates by gxAlertUniqueId should pick the one that matchs consumable', async () => {
    knexStub.then = sinon
      .stub()
      .resolves([
        { ...directMatch, id: 1, consumableSerial: fakeNotMatchingInstrumentSerial },
        directMatch,
        matchByConsumableOnly,
      ])

    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(directMatch)
    expect(result.matchType, 'matchType').to.equal(matchType.EXACT_MATCH)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates, 'possible duplicates').to.have.lengthOf(2)
  })

  it('should return a MISSING_RESULT_DATA if not enough data to identify a result is provided.', async () => {
    knexStub.then = sinon.stub().resolves([])
    const result = await findResult(
      {
        partnerId: 1,
        gxAlertUniqueId: null,
        instrumentSerial: null,
        cartridgeSerial: null,
        createdOn: fakeDate,
      },
      knexStub
    )

    expect(result.matchingResult, 'matchingResult').to.deep.equal(null)
    expect(result.matchType, 'matchType').to.equal(matchType.MISSING_RESULT_DATA)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates).to.have.lengthOf(0)
  })

  it('should return a NO_MATCH if there is no and existing result.', async () => {
    knexStub.then = sinon.stub().resolves([])
    const result = await findResult(resultDetails, knexStub)

    expect(result.matchingResult, 'matchingResult').to.deep.equal(null)
    expect(result.matchType, 'matchType').to.equal(matchType.NO_MATCH)
    expect(result.algorithm, 'algorithm').to.equal(fakeVersion1)
    expect(result.possibleDuplicates).to.have.lengthOf(0)
  })

  it('should throw a database exception', async () => {
    chai.use(chaiAsPromised)
    const error = new Error('Database error')
    knexStub.then = sinon.stub().rejects(error)
    await expect(findResult(resultDetails, knexStub)).to.be.rejectedWith(error)
  })
})
