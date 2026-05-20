const { assert } = require('chai')
const sinon = require('sinon')
const { getMatchingSample } = require('../../../src/sample/common/db')

function createQueryBuilderMock(selectRows) {
  const chain = {}
  chain.join = sinon.stub().returns(chain)
  chain.leftJoin = sinon.stub().returns(chain)
  chain.where = sinon.stub().returns(chain)
  chain.andWhere = sinon.stub().callsFake(cb => {
    const sub = {
      whereNull: sinon.stub().returnsThis(),
      orWhere: sinon.stub().returnsThis(),
    }
    cb(sub)
    return chain
  })
  chain.orderBy = sinon.stub().returns(chain)
  chain.select = sinon.stub().resolves(selectRows)
  const knex = sinon.stub().returns(chain)
  return { knex, chain }
}

describe('sample/common/db getMatchingSample', () => {
  const externalId = 'xdr 29-26'
  const startedOn = new Date('2026-01-01')

  it('adds originSiteId filter when originSiteId is provided', async () => {
    const row = { id: 1, externalId, originSiteId: 1123 }
    const { knex, chain } = createQueryBuilderMock([row])

    const result = await getMatchingSample(knex, externalId, startedOn, 1123)

    assert.deepEqual(result, row)
    const siteScoped = chain.where.getCalls().some(c => c.args[0] === 's.originSiteId' && c.args[1] === 1123)
    assert.isTrue(siteScoped, 'expected .where(s.originSiteId, …)')
  })

  it('does not add originSiteId filter when originSiteId is null or undefined', async () => {
    const row = { id: 1, externalId, originSiteId: 99 }
    const { knex, chain } = createQueryBuilderMock([row])

    await getMatchingSample(knex, externalId, startedOn, null)
    let siteScoped = chain.where.getCalls().some(c => c.args[0] === 's.originSiteId')
    assert.isFalse(siteScoped)

    chain.where.resetHistory()
    await getMatchingSample(knex, externalId, startedOn, undefined)
    siteScoped = chain.where.getCalls().some(c => c.args[0] === 's.originSiteId')
    assert.isFalse(siteScoped)
  })

  it('returns null when more than one candidate matches', async () => {
    const { knex } = createQueryBuilderMock([{ id: 1 }, { id: 2 }])

    const result = await getMatchingSample(knex, externalId, startedOn, 1123)

    assert.isNull(result)
  })

  it('returns null when no candidates match', async () => {
    const { knex } = createQueryBuilderMock([])

    const result = await getMatchingSample(knex, externalId, startedOn, 1123)

    assert.isNull(result)
  })

  it('returns null for short external ids without querying', async () => {
    const knex = sinon.stub()

    const result = await getMatchingSample(knex, 'short', startedOn, 1)

    assert.isNull(result)
    assert.isFalse(knex.called)
  })
})
