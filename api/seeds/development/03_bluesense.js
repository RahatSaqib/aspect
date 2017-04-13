module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

function* seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = yield knex('User').where({ name: 'bluesense' }).first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = yield knex('User').insert({
    name: 'bluesense',
    password: bcrypt.hashSync('blue2017', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId
  }

  // Reuse previously seeded "static" data
  const partnerTypes = yield rowsAsObject(knex, 'PartnerType')
  const [partnerId] = yield knex('Partner').insert({
    name: 'BlueSense',
    partnerTypeId: partnerTypes.Operating.id,
    deviceLogHistoryDays: 365
  })
  const deviceTypeCategories = yield rowsAsObject(knex, 'DeviceTypeCategory')
  const assayTypes = yield rowsAsObject(knex, 'AssayType')

  // Bluesense Device Type
  const [deviceTypeId] = yield knex('DeviceType').insert({
    name: 'BluBox',
    manufacturer: 'BlueSense',
    deviceTypeCategoryId: deviceTypeCategories.Lab.id,
  })

  yield knex('Assay').insert({
    name: 'BlueSense Dengue',
    i18nKey: 'assayBluesenseDengue',
    externalId: 'Dengue',
    assayTypeId: assayTypes.Dengue.id,
    deviceTypeId,
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result Text',
        type: 'string'
      }
    })

  })

  yield knex('Assay').insert({
    name: 'BlueSense Zika',
    i18nKey: 'assayBluesenseZika',
    externalId: 'Zika',
    assayTypeId: assayTypes.Zika.id,
    deviceTypeId,
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result Text',
        type: 'string'
      }
    })
  })

  const modules = yield knex('Permission')
    .reduce((memo, row) => {
      if (!memo[row.module]) {
        memo[row.module] = {}
      }
      memo[row.module][row.activity] = row.id
      return memo
    }, {})


  // Create clinics for every state in Malawi
  const [usCountry] = yield knex('Country as c')
    .where({ 'c.a3': 'USA' })
    .select('c.id', 'c.culture', 'c.timezone')

  const { culture, timezone, id: countryId } = usCountry

  const { id: geographyId } = yield knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // Permissions for BlueSense Admin
  const [adminPersonId] = yield knex('Person').insert(Object.assign({
    userId: adminId,
    name: 'BlueSense Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone
  }, auditFields))

  const [jobFunctionIdAdmin] = yield knex('JobFunction').insert({
    name: 'Admin',
    partnerId
  })

  yield knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.deviceApiKey.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin }])

  const [jobIdAdmin] = yield knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin }])
  yield knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  // sites
  for (const siteNum of ['1', '2', '3']) {
    const siteData = Object.assign({
      partnerId,
      geographyId,
      name: `Site ${siteNum}`,
      shortname: `Site ${siteNum}`,
      externalId: `site${siteNum}`
    }, auditFields)
    yield knex('Site').insert(siteData)
  }
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table)
    .reduce((memo, row) => {
      memo[row[column]] = row
      return memo
    }, {})
}
