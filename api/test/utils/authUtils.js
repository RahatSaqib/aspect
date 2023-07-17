const bcrypt = require('bcrypt')
const Promise = require('bluebird')
const _ = require('lodash')

const { knex } = require('../../src/db')
const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const server = require('./testUtils')

async function getAccessToken(username, password, clientName = 'Mocha/Chai') {
  return server
    .post('/api/auth')
    .send({
      name: username,
      password,
      clientName,
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
  const partner = await knex('Partner').where('name', partnerName).first()
  if (!partner) {
    throw new Error(`partnerName ${partnerName} not found in the database`)
  }
  const country = await knex('Country').where('abbreviation', countryAbbreviation).first()
  if (!country) {
    throw new Error(`countryAbbreviation ${countryAbbreviation} not found in the database`)
  }
  const geography = await knex('Geography')
    .where('countryId', country.id)
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()
  const user = await knex('User').where('name', username).first()
  let userId
  if (user) {
    userId = user.id
    await knex('User')
      .where('id', userId)
      .update({
        name: username,
        password: bcrypt.hashSync(password, saltRounds),
        legacyPassword: 0,
        approved: 1,
        lockedOut: 0,
        createdOn: new Date(),
        failedPasswordAttempts: 0,
      })
  } else {
    ;[userId] = await knex('User').insert({
      name: username,
      password: bcrypt.hashSync(password, saltRounds),
      legacyPassword: 0,
      approved: 1,
      lockedOut: 0,
      createdOn: new Date(),
      failedPasswordAttempts: 0,
    })
  }

  const person = await knex('Person').where({ userId }).first()
  let personId
  if (person) {
    personId = person.id
    await knex('Person').where('id', personId).update({
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
  } else {
    ;[personId] = await knex('Person').insert({
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
  }
  const licenseIds = await knex('License as l')
    .whereNull('l.partnerId')
    .orWhere('l.partnerId', partner.id)
    .pluck('l.id')
  await Promise.each(licenseIds, async licenseId => {
    const licensePerson = await knex('LicensePerson')
      .where({
        licenseId,
        personId,
      })
      .select()
    if (_.isEmpty(licensePerson)) {
      await knex('LicensePerson').insert({
        licenseId,
        personId,
        acceptedOn: new Date(),
        ip: '1.2.3.4',
      })
    } else {
      await Promise.each(licensePerson, async lp => {
        if (lp.acceptedOn && lp.ip) {
          return Promise.resolve()
        }
        await knex('LicensePerson')
          .where(_.pick(lp, ['licenseId', 'personId']))
          .update({
            acceptedOn: new Date(),
            ip: '1.2.3.4',
          })
      })
    }
  })
  const jobFunctions = _.uniq(jobs.map(job => job.jobFunctionExternalId))
  await Promise.each(jobFunctions, async jobFunctionExternalId => {
    const jobFunction = await knex('JobFunction').where('externalId', jobFunctionExternalId).first()
    let jobId
    const job = await knex('Job')
      .where({
        personId,
        jobFunctionId: jobFunction.id,
      })
      .first()
    if (job) {
      jobId = job.id
    } else {
      ;[jobId] = await knex('Job').insert({
        personId,
        jobFunctionId: jobFunction.id,
      })
    }
    const jobFunctionJobs = jobs.filter(job => job.jobFunctionExternalId === jobFunctionExternalId)
    await knex('JobContext').where({ jobId }).del()
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
          .andWhere(function () {
            if (job.stateName) {
              this.where('s.name', job.stateName)
            } else {
              this.whereNull('g.stateId')
            }
          })
          .andWhere(function () {
            if (job.lgaName) {
              this.where('l.name', job.lgaName)
            } else {
              this.whereNull('g.lgaId')
            }
          })
          .first('g.*')
      }
      const site = (await knex('Site').where('externalId', job.siteExternalId).first()) || {}
      const deviceType = (await knex('DeviceType').where('externalId', job.deviceTypeExternalId).first()) || {}
      const assayType = (await knex('AssayType').where('externalId', job.assayTypeExternalId).first()) || {}
      const assay = (await knex('Assay').where('externalId', job.assayExternalId).first()) || {}
      const disease = (await knex('Disease').where('externalId', job.diseaseExternalId).first()) || {}
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
  if (!userId) {
    return Promise.resolve()
  }
  const personIds = await knex('Person').where({ userId }).pluck('id')
  const jobIds = await knex('Job').whereIn('personId', personIds).pluck('id')
  await knex('JobContext').whereIn('jobId', jobIds).del()
  await knex('Job').whereIn('id', jobIds).del()
  await knex('LicensePerson').whereIn('personId', personIds).del()
  await knex('Person').where({ userId }).del()
  await knex('RefreshToken').where({ userId }).del()
  await knex('Result').where({ createdBy: userId }).del()
  await knex('Device').where({ createdBy: userId }).del()
  const siteIds = await knex('Site').where('createdBy', userId).pluck('id')
  await knex('Sample').whereIn('originSiteId', siteIds).del()
  await knex('Site').where({ createdBy: userId }).del()
  await knex('LoginHistory').where('userId', '>', 0).del()
  await knex('User').where({ id: userId }).del()
}

async function getUserByToken(token) {
  const response = await server
    .get('/api/account-details/current')
    .set('Authorization', `Bearer ${token}`)
    .send()
    .then(res => res.body.data)
  return response
}

async function getAdminId() {
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first()
  return adminId
}

module.exports = {
  getUserByToken,
  getAccessToken,
  createUser,
  removeUser,
  getAdminId,
}
