const supertest = require('supertest')
const bcrypt = require('bcrypt')
const Promise = require('bluebird')
const _ = require('lodash')

const { knex } = require('../../src/db')
const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const server = supertest.agent('http://localhost:8080')

async function getAccessToken(username, password) {
  return server
    .post('/api/auth')
    .send({
      name: username,
      password,
      clientName: 'Mocha/Chai',
    })
    .then(res => res.body.access)
}

async function createUser(
  partnerName,
  countryAbbreviation,
  username,
  password,
  jobs = [
    {
      jobFunctionExternalId: 'admin',
      stateName: null,
      lgaName: null,
      siteExternalId: null,
      assayExternalId: null,
      assayTypeExternalId: null,
      deviceTypeExternalId: null,
      diseaseExternalId: null,
    },
  ]
) {
  const partner = await knex('Partner')
    .where('name', partnerName)
    .first()
  if (!partner) {
    throw new Error(`partnerName ${partnerName} not found in the database`)
  }
  const country = await knex('Country')
    .where('abbreviation', countryAbbreviation)
    .first()
  if (!country) {
    throw new Error(
      `countryAbbreviation ${countryAbbreviation} not found in the database`
    )
  }
  const geography = await knex('Geography')
    .where('countryId', country.id)
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()
  const user = await knex('User')
    .where('name', username)
    .first()
  if (user) {
    throw new Error(`username ${username} already exists in the database`)
  }
  const [userId] = await knex('User').insert({
    name: username,
    password: bcrypt.hashSync(password, saltRounds),
    legacyPassword: 0,
    approved: 1,
    lockedOut: 0,
    createdOn: new Date(),
    failedPasswordAttempts: 0,
  })

  const [personId] = await knex('Person').insert({
    userId,
    name: username,
    lastPartnerId: partner.id,
    lastCountryId: country.id,
    timezone: country.timezone,
    culture: country.culture,
    createdOn: new Date(),
    updatedOn: new Date(),
    geographyId: geography.id,
  })
  const licenseIds = await knex('License')
    .whereNull('partnerId')
    .orWhere('partnerId', partner.id)
    .select()
    .pluck('id')
  await Promise.each(licenseIds, async licenseId =>
    knex('LicensePerson').insert({
      licenseId,
      personId,
      acceptedOn: new Date(),
      ip: '1.2.3.4',
    })
  )
  const jobFunctions = _.uniq(jobs.map(job => job.jobFunctionExternalId))
  await Promise.each(jobFunctions, async jobFunctionExternalId => {
    const jobFunction = await knex('JobFunction')
      .where('externalId', jobFunctionExternalId)
      .first()
    const [jobId] = await knex('Job').insert({
      personId,
      jobFunctionId: jobFunction.id,
    })
    const jobFunctionJobs = jobs.filter(
      job => job.jobFunctionExternalId === jobFunctionExternalId
    )
    await Promise.each(jobFunctionJobs, async jobFunctionJob => {
      let jobGeography = {}
      const job = {
        jobFunctionExternalId: 'admin',
        stateName: null,
        lgaName: null,
        siteExternalId: null,
        assayExternalId: null,
        assayTypeExternalId: null,
        deviceTypeExternalId: null,
        diseaseExternalId: null,
        ...jobFunctionJob,
      }
      if (job.stateName || job.lgaName) {
        jobGeography = await knex('Geography as g')
          .leftJoin('State as s', 'g.stateId', 's.id')
          .leftJoin('Lga as l', 'g.lgaId', 'l.id')
          .where('countryId', country.id)
          .andWhere(function() {
            if (job.stateName) {
              this.where('s.name', job.stateName)
            } else {
              this.whereNull('g.stateId')
            }
          })
          .andWhere(function() {
            if (job.lgaName) {
              this.where('l.name', job.lgaName)
            } else {
              this.whereNull('g.lgaId')
            }
          })
          .first('g.*')
      }
      const site =
        (await knex('Site')
          .where('externalId', job.siteExternalId)
          .first()) || {}
      const deviceType =
        (await knex('DeviceType')
          .where('externalId', job.deviceTypeExternalId)
          .first()) || {}
      const assayType =
        (await knex('AssayType')
          .where('externalId', job.assayTypeExternalId)
          .first()) || {}
      const assay =
        (await knex('Assay')
          .where('externalId', job.assayExternalId)
          .first()) || {}
      const disease =
        (await knex('Disease')
          .where('externalId', job.diseaseExternalId)
          .first()) || {}
      await knex('JobContext').insert({
        jobId,
        geographyId: jobGeography.id,
        siteId: site.id,
        assayTypeId: assayType.id,
        assayId: assay.id,
        deviceTypeId: deviceType.id,
        diseaseId: disease.id,
      })
    })
  })
  return userId
}

async function removeUser(userId) {
  const personIds = await knex('Person')
    .where({ userId })
    .select('id')
    .pluck('id')
  const jobIds = await knex('Job')
    .whereIn('personId', personIds)
    .select('id')
    .pluck('id')
  await knex('JobContext')
    .whereIn('jobId', jobIds)
    .del()
  await knex('Job')
    .whereIn('id', jobIds)
    .del()
  await knex('Person')
    .where({ userId })
    .del()
  await knex('User')
    .where({ id: userId })
    .del()
}

module.exports = {
  getAccessToken,
  createUser,
  removeUser,
}
