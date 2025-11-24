const bcrypt = require('bcrypt')
const _ = require('lodash')
const Promise = require('bluebird')

const { getPartnerByExternalId } = require('../utils')
const config = require('../../src/config')

module.exports = async (knex, partnerData, contacts) => {
  const now = new Date()

  const {
    partner: { externalId: partnerExternalId },
    adminUserName,
    partnerAbbreviation,
    defaultPassword = 'WelcomeToAspect',
  } = partnerData

  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  const jobFunctions = await knex('JobFunction')
    .where({ partnerId })
    .select()
    .then(items =>
      items.reduce((jobFunctionMap, jobFunction) => {
        jobFunctionMap[jobFunction.name] = jobFunction.id
        return jobFunctionMap
      }, {})
    )

  // audit fields
  const { id: adminId } = await knex('User').where({ name: adminUserName }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const country = await knex('Country as c')
    .where({ 'c.abbreviation': partnerAbbreviation })
    .first('c.id', 'c.culture', 'c.timezone')

  const countryGeography = await knex('Geography')
    .where('countryId', country.id)
    .whereNull('stateId')
    .whereNull('lgaId')
    .first('id')

  const { id: countryId } = country

  const states = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': country.id })
    .whereNull('lgaId')
    .select('g.countryId', 's.id', 's.name')

  // Lgas with states
  const lgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': country.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')

  const provincesByName = states.reduce((provinceMemo, province) => {
    provinceMemo[province.name.toLowerCase()] = province
    const provinceDistricts = lgas.filter(l => l.stateName === province.name)

    if (provinceDistricts) {
      provinceMemo[province.name.toLowerCase()].districts = provinceDistricts.reduce((districtMemo, district) => {
        districtMemo[district.name.toLowerCase()] = district
        return districtMemo
      }, {})
    }
    return provinceMemo
  }, {})
  const siteIds = (
    await knex('Geography as g')
      .join('Site as s', 'g.id', 's.geographyId')
      .where('g.countryId', countryId)
      .select('s.id', 's.shortName')
      .distinct('s.id', 's.shortName', 's.name')
  ).reduce((siteMap, site) => {
    siteMap[site.shortName] = site.id
    siteMap[site.name] = site.id
    return siteMap
  }, {})

  await Promise.each(contacts, async person => {
    let userId = null
    userId = await getOrCreateUserForPerson(person, knex, userId, defaultPassword, now)

    const province =
      !_.isEmpty(person.geographies) && person.geographies[0].stateName
        ? provincesByName[person.geographies[0].stateName.toLowerCase()] || {
            id: null,
            districts: {},
          }
        : {
            id: null,
            districts: {},
          }
    const district =
      province.districts && !_.isEmpty(person.geographies) && person.geographies[0].lgaName
        ? province.districts[person.geographies[0].lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: geographyId } = !_.isEmpty(person.geographies)
      ? await knex('Geography')
          .where({
            countryId,
            stateId: province.id,
            lgaId: district.id,
          })
          .first()
      : { id: countryGeography.id }
    let personId = null
    const existingPerson = await knex('Person')
      .where({ userId })
      .orWhere(qb => {
        if (person.personEmailAddress) {
          qb.where({
            name: person.personName,
            email: person.personEmailAddress,
          })
        } else {
          qb.where({ name: person.personName })
        }
      })
      .first()
    if (existingPerson) {
      if (
        existingPerson.personCell !== person.personCell ||
        existingPerson.name !== person.personName ||
        existingPerson.timezone !== person.timezone ||
        existingPerson.title !== person.title ||
        existingPerson.geographyId !== geographyId ||
        existingPerson.email !== person.personEmailAddress ||
        existingPerson.cell !== person.personCell ||
        existingPerson.phone !== person.personPhone ||
        existingPerson.hidePatientId !== person.hidePatientId ||
        existingPerson.hideSampleId !== person.hideSampleId ||
        existingPerson.hideNotes !== person.hideNotes
      ) {
        await knex('Person')
          .where('id', existingPerson.id)
          .update({
            name: person.personName,
            timezone: person.timezone,
            title: person.title || null,
            geographyId,
            email: person.personEmailAddress || null,
            cell: person.personCell || null,
            phone: person.personPhone || null,
            hidePatientId: person.hidePatientId,
            hideSampleId: person.hideSampleId,
            hideNotes: person.hideNotes,
            updatedOn: now,
            updatedBy: adminId,
          })
      }
      personId = existingPerson.id

      await knex('PersonTag').where({ personId }).delete()
    } else {
      ;[personId] = await knex('Person').insert({
        name: person.personName,
        timezone: person.timezone,
        geographyId,
        title: person.title || null,
        email: person.personEmailAddress || null,
        cell: person.personCell || null,
        phone: person.personPhone || null,
        userId,
        canLogIn: !!userId,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        hidePatientId: person.hidePatientId,
        hideSampleId: person.hideSampleId,
        hideNotes: person.hideNotes,
        culture: 'en-US',
        ...auditFields,
      })
    }

    if (person.tags && person.tags.length > 0) {
      // Insert missing Tag records
      let tags = await knex('Tag').where({ partnerId }).whereIn('title', person.tags)
      await Promise.each(
        person.tags.filter(tagTitle => !tags.map(t => t.title).includes(tagTitle)),
        async t => knex('Tag').insert({ title: t, partnerId })
      )

      // Insert all the PersonTag records
      tags = await knex('Tag').where({ partnerId }).whereIn('title', person.tags)
      await knex('PersonTag').insert(
        tags.map(t => ({
          tagId: t.id,
          personId,
        }))
      )
    }

    if (!_.isEmpty(person.jobFunctions)) {
      await Promise.each(person.jobFunctions, async jobFunctionName => {
        if (
          !['Super Admin', 'Regional Officer'].includes(jobFunctionName) &&
          !_.isEmpty(person.sites) &&
          person.sites.some(site => !!siteIds[site.shortName || site.name])
        ) {
          const jobFunctionId = jobFunctions[jobFunctionName]
          const existingJobContexts = await knex('JobContext')
            .whereNotNull('siteId')
            .andWhere({ personId, jobFunctionId })
            .select()
          const expectedJobContexts = person.sites
            .filter(site => !!siteIds[site.shortName || site.name])
            .map(site => ({
              personId,
              jobFunctionId,
              siteId: siteIds[site.shortName || site.name],
            }))
          const jobContextItem = expectedJobContexts.filter(
            expectedJobContext =>
              !_.some(existingJobContexts, jobContext => jobContext.siteId === expectedJobContext.siteId)
          )
          if (!_.isEmpty(jobContextItem)) {
            await knex('JobContext').insert(jobContextItem)
          }
          const existingJobContextsToRemove = existingJobContexts.filter(
            existingJobContext =>
              !_.some(expectedJobContexts, {
                siteId: existingJobContext.siteId,
              })
          )

          await knex('JobContext')
            .where({ personId, jobFunctionId })
            .whereNull('geographyId')
            .whereIn(
              'siteId',
              existingJobContextsToRemove.map(existingJobContextToRemove => existingJobContextToRemove.siteId)
            )
            .delete()
          await Promise.each(
            existingJobContextsToRemove.filter(existingJobContextToRemove => !!existingJobContextToRemove.geographyId),
            existingJobContextToUpdate =>
              knex
                .where({
                  personId,
                  jobFunctionId,
                  geographyId: existingJobContextToUpdate.geographyId,
                })
                .update({ siteId: null })
          )
        }
        if (
          ['Super Admin', 'Regional Officer', 'Data Viewer'].includes(jobFunctionName) &&
          !_.isEmpty(person.geographies)
        ) {
          const jobFunctionId = jobFunctions[jobFunctionName]
          const existingJobContexts = await knex('JobContext')
            .whereNotNull('geographyId')
            .andWhere({ personId, jobFunctionId })
            .select()
          let expectedJobContexts = []
          await Promise.each(person.geographies, async geography => {
            const jobProvince = geography.stateName
              ? provincesByName[geography.stateName.toLowerCase()] || {
                  id: null,
                  districts: {},
                }
              : {
                  id: null,
                  districts: {},
                }
            const jobDistrict =
              jobProvince.districts && geography.lgaName
                ? jobProvince.districts[geography.lgaName.toLowerCase()] || {
                    id: null,
                  }
                : {
                    id: null,
                  }
            const { id: jobGeographyId } = await knex('Geography')
              .where({
                countryId,
                stateId: jobProvince.id,
                lgaId: jobDistrict.id,
              })
              .first()
            expectedJobContexts = [
              ...expectedJobContexts,
              {
                personId,
                jobFunctionId,
                geographyId: jobGeographyId,
              },
            ]
          })
          const jobContextItem = expectedJobContexts.filter(
            expectedJobContext =>
              !_.some(existingJobContexts, jobContext => jobContext.geographyId === expectedJobContext.geographyId)
          )
          if (!_.isEmpty(jobContextItem)) {
            await knex('JobContext').insert(jobContextItem)
          }
          const existingJobContextsToRemove = existingJobContexts.filter(
            existingJobContext =>
              !_.some(expectedJobContexts, {
                geographyId: existingJobContext.geographyId,
              })
          )
          await knex('JobContext')
            .where({ personId, jobFunctionId })
            .whereNull('siteId')
            .whereIn(
              'geographyId',
              existingJobContextsToRemove.map(existingJobContextToRemove => existingJobContextToRemove.geographyId)
            )
            .delete()
          await Promise.each(
            existingJobContextsToRemove.filter(existingJobContextToRemove => !!existingJobContextToRemove.siteId),
            existingJobContextToUpdate =>
              knex
                .where({
                  personId,
                  jobFunctionId,
                  siteId: existingJobContextToUpdate.siteId,
                })
                .update({ geographyId: null })
          )
        }
      })
    }
  })
}

async function getOrCreateUserForPerson(person, knex, userId, defaultPassword, now) {
  const saltRounds = parseInt(config.passwordSaltRounds, 10)
  if (person.username) {
    const existingUser = await knex('User').where('name', person.username).first('id')
    if (existingUser) {
      userId = existingUser.id
    } else {
      const pw = bcrypt.hashSync(person.password || defaultPassword, saltRounds)
      const baseUserData = {
        password: pw,
        failedPasswordAttempts: 0,
        legacyPassword: person.getPasswordFromGxAlert ? 1 : 0,
        lockedOut: 0,
      }
      ;[userId] = await knex('User').insert({
        name: person.username,
        approved: 1,
        createdOn: now,
        ...baseUserData,
      })
    }
  }
  return userId
}
