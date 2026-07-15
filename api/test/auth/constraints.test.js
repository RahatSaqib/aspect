const { addConstraints } = require('../../src/auth/constraints')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

describe('addConstraints should add disabled sites filter, only when applicable', async () => {
  const defaultSiteAlias = '__constraints_Site'
  // Let's add some production like dataConstraints
  const dataConstraints = {
    partner: { id: 1 },
    country: { id: 3 },
    person: { id: 3 },
    $or: [
      {
        site: { id: 3 },
        result: { reportableSiteId: 3 },
        jobFunction: { id: 4, isAdmin: 0 },
      },
    ],
  }

  it('Adds Site disabled filter if result alias is included', async () => {
    await runTestWithKnex(async knex => {
      const queryBuilder = knex('Result as r').first()
      addConstraints(queryBuilder, dataConstraints, { result: 'r' })
      const query = queryBuilder.toString()
      query.should.to.have.string(
        `(\`${defaultSiteAlias}\`.\`id\` is null or \`${defaultSiteAlias}\`.\`disabled\` = 0)`
      )
    })
  })

  it('Adds Site disabled filter if query has device alias but no result alias', async () => {
    await runTestWithKnex(async knex => {
      const queryBuilder = knex('Device as d').first()
      addConstraints(queryBuilder, dataConstraints, { device: 'd' })
      const query = queryBuilder.toString()
      query.should.to.have.string(
        `(\`${defaultSiteAlias}\`.\`id\` is null or \`${defaultSiteAlias}\`.\`disabled\` = 0)`
      )
    })
  })

  it('If Site table alias is in the aliases object, adds Site disabled filter', async () => {
    await runTestWithKnex(async knex => {
      const queryBuilder = knex('Result as r').join('Site as s', 's.id', 'r.siteId').first()

      addConstraints(queryBuilder, dataConstraints, {
        result: 'r',
        site: 'someSiteAlias',
      })

      const query = queryBuilder.toString()
      query.should.to.have.string('(`someSiteAlias`.`id` is null or `someSiteAlias`.`disabled` = 0)')
      const matchs = query.match(/\(`.*`\.`id` is null or `.*`\.`disabled` = 0\)/g)
      matchs.length.should.to.equal(1)
    })
  })

  it('Should have always only one disabled filter on Site', async () => {
    await runTestWithKnex(async knex => {
      const queries = []

      // Given:

      // Only Site alias
      const queryBuilderWithSite = knex('Result as r').join('Site as s', 's.id', 'r.siteId').first()
      addConstraints(queryBuilderWithSite, dataConstraints, {
        site: 's',
      })
      queries.push({
        caseDescription: 'has Site alias',
        alias: 's',
        sql: queryBuilderWithSite.toString(),
      })

      // Only Result alias
      const queryBuilderWithResult = knex('Result as r').first()
      addConstraints(queryBuilderWithResult, dataConstraints, {
        result: 'r',
      })
      queries.push({
        caseDescription: 'has result alias',
        alias: defaultSiteAlias,
        sql: queryBuilderWithResult.toString(),
      })

      // Only Device alias
      const queryBuilderbWithDevice = knex('Device as d').first()
      addConstraints(queryBuilderbWithDevice, dataConstraints, {
        device: 'd',
      })
      queries.push({
        caseDescription: 'has device alias only',
        alias: '__constraints_Site',
        sql: queryBuilderbWithDevice.toString(),
      })

      // then:
      for (const query of queries) {
        const regExpString = `\\(\`${query.alias}\`\\.\`id\` is null or \`${query.alias}\`\\.\`disabled\` = 0\\)`
        const matchs = query.sql.match(new RegExp(regExpString)) ?? []
        matchs.length.should.be.equal(
          1,
          `When the call ${query.caseDescription}, should return one and only one disabled filter clause`
        )
      }
    })
  })

  it(`If there is no alias for Site, Result or Device, then no filter should be added`, async () => {
    await runTestWithKnex(async knex => {
      const queryBuilder = knex('Partner as p').join('Geography as g', 'g.id', 'p.geographyId').first()

      addConstraints(queryBuilder, dataConstraints, {
        partner: 'p',
        geography: 'g',
      })

      const query = queryBuilder.toString()
      query.should.not.match(/\(`.*`\.`id` is null or `.*`\.`disabled` = 0\)/g)
    })
  })
})

describe('addConstraints device approval filtering', async () => {
  const dataConstraints = {
    partner: { id: 1 },
    country: { id: 3 },
    person: { id: 3 },
  }

  // With a cold dictionary cache (no request context in unit tests) tokens resolve
  // through the scalar subquery fallback on the DeviceApproval table.
  const approvalIdSubquery = token => `(select \`id\` from \`DeviceApproval\` where \`token\` = '${token}')`

  const buildDeviceQuerySql = (knex, options) => {
    const queryBuilder = knex('Device as d').first()
    addConstraints(queryBuilder, dataConstraints, { device: 'd' }, options)
    return queryBuilder.toString()
  }

  it('allows approved devices only by default', async () => {
    await runTestWithKnex(async knex => {
      const sql = buildDeviceQuerySql(knex, undefined)
      sql.should.to.have.string(
        `(\`d\`.\`deviceApprovalId\` is null or \`d\`.\`deviceApprovalId\` = ${approvalIdSubquery('approved')})`
      )
    })
  })

  it('excludes decommissioned with <> when approved and pendingDeployment are allowed', async () => {
    await runTestWithKnex(async knex => {
      const sql = buildDeviceQuerySql(knex, { deviceApprovals: ['approved', 'pendingDeployment'] })
      sql.should.to.have.string(
        `(\`d\`.\`deviceApprovalId\` is null or \`d\`.\`deviceApprovalId\` <> ${approvalIdSubquery('decommissioned')})`
      )
    })
  })

  it('excludes pendingDeployment with <> when approved and decommissioned are allowed', async () => {
    await runTestWithKnex(async knex => {
      const sql = buildDeviceQuerySql(knex, { deviceApprovals: ['approved', 'decommissioned'] })
      sql.should.to.have.string(
        `(\`d\`.\`deviceApprovalId\` is null or \`d\`.\`deviceApprovalId\` <> ${approvalIdSubquery(
          'pendingDeployment'
        )})`
      )
    })
  })

  it('adds no approval filter when every token is allowed', async () => {
    await runTestWithKnex(async knex => {
      const sql = buildDeviceQuerySql(knex, {
        deviceApprovals: ['approved', 'pendingDeployment', 'decommissioned'],
      })
      sql.should.not.have.string('deviceApproval')
      sql.should.not.have.string('DeviceApproval')
    })
  })

  it('treats an empty deviceApprovals array as the default (approved only)', async () => {
    await runTestWithKnex(async knex => {
      const sql = buildDeviceQuerySql(knex, { deviceApprovals: [] })
      sql.should.to.have.string(`\`d\`.\`deviceApprovalId\` = ${approvalIdSubquery('approved')}`)
    })
  })

  it('throws on an unknown deviceApprovals token', async () => {
    await runTestWithKnex(async knex => {
      ;(() => buildDeviceQuerySql(knex, { deviceApprovals: ['approved', 'decomissioned'] })).should.throw(
        /unknown deviceApprovals token/
      )
    })
  })

  it('never joins the DeviceApproval or maintenance status tables', async () => {
    await runTestWithKnex(async knex => {
      const approvalCombinations = [
        undefined,
        { deviceApprovals: ['approved', 'pendingDeployment'] },
        { deviceApprovals: ['approved', 'decommissioned'] },
        { deviceApprovals: ['approved', 'pendingDeployment', 'decommissioned'] },
      ]
      for (const options of approvalCombinations) {
        const sql = buildDeviceQuerySql(knex, options)
        sql.should.not.have.string('DeviceMaintenanceStatus')
        sql.should.not.have.string('join `DeviceApproval`')
      }
    })
  })
})
