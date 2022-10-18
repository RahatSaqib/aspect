const bcrypt = require('bcrypt')
const { partnerName } = require('./fixtures/partnerData')

const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

module.exports = require('../utils').seed(async knex => {
  const now = new Date()
  const { partnerOneId } = await knex('Partner')
    .where({
      name: partnerName,
    })
    .first('id as partnerOneId')
  const { adminId } = await knex('User').where({ name: 'admin' }).first('id as adminId')
  const {
    id: geographyId,
    countryId,
    timezone,
    culture,
  } = await knex('Geography as g')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .where({ 'c.a3': 'USA' })
    .whereNotNull('g.stateId')
    .whereNull('g.lgaId')
    .first('g.id', 'c.id as countryId', 'timezone', 'culture')

  // create regional manager
  const [regionalManagerUserId] = await knex('User').insert({
    name: 'Regional Manager',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const [regionalManagerPersonId] = await knex('Person').insert({
    userId: regionalManagerUserId,
    name: 'Regional Manager',
    lastPartnerId: partnerOneId,
    lastCountryId: countryId,
    timezone,
    culture,
    geographyId,
    ...auditFields,
  })

  const { id: jobFunctionIdRegionalManager } = await knex('JobFunction')
    .where({ externalId: 'regionalOfficer', partnerId: partnerOneId })
    .first()
  const [jobId] = await knex('Job').insert({
    personId: regionalManagerPersonId,
    jobFunctionId: jobFunctionIdRegionalManager,
  })
  await knex('JobContext').insert({ jobId, geographyId })
}, __filename)
