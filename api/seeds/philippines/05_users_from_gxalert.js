module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')

const contacts = require('./fixtures/contacts.json')
const config = require('../../src/config')
const { getPartnerByName } = require('../utils')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, 'Philippines')

  const jobFunctions = await knex('JobFunction')
    .where({ partnerId })
    .select()
    .then(async items =>
      items.reduce((jobFunctionMap, jobFunction) => {
        jobFunctionMap[jobFunction.name] = jobFunction.id
        return jobFunctionMap
      }, {})
    )

  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const philippinesCountry = await knex('Country as c')
    .where({ 'c.a3': 'PHL' })
    .first('c.id', 'c.culture', 'c.timezone')
  const philippinesGeography = await knex('Geography')
    .where('countryId', philippinesCountry.id)
    .whereNull('stateId')
    .whereNull('lgaId')
    .first('id')
  const { id: countryId } = philippinesCountry
  const philippinesRegions = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': philippinesCountry.id })
    .select('g.countryId', 's.id', 's.name')
  const philippinesDistricts = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': philippinesCountry.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const provincesByName = philippinesRegions.reduce(
    (provinceMemo, province) => {
      provinceMemo[province.name.toLowerCase()] = province
      const provinceDistricts = _.filter(philippinesDistricts, {
        stateName: province.name,
      })
      if (provinceDistricts) {
        provinceMemo[
          province.name.toLowerCase()
        ].districts = provinceDistricts.reduce((districtMemo, district) => {
          districtMemo[district.name.toLowerCase()] = district
          return districtMemo
        }, {})
      }
      return provinceMemo
    },
    {}
  )

  const siteIds = await knex('Geography as g')
    .join('Site as s', 'g.id', 's.geographyId')
    .where('g.countryId', countryId)
    .select('s.id', 's.shortName')
    .distinct('s.id', 's.shortName')
    .reduce((siteMap, site) => {
      siteMap[site.shortName] = site.id
      return siteMap
    }, {})

  await Promise.each(contacts, async person => {
    let userId = null
    if (person.username) {
      const existingUser = await knex('User')
        .where('name', person.username)
        .first('id')
      if (existingUser) {
        userId = existingUser.id
      } else {
        const pw = bcrypt.hashSync(
          person.password || 'WelcomeToAspect',
          saltRounds
        )
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
      province.districts &&
      !_.isEmpty(person.geographies) &&
      person.geographies[0].lgaName
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
      : { id: philippinesGeography.id }
    let personId = null
    const existingPerson = await knex('Person')
      .where({ userId })
      .orWhere({ name: person.personName, email: person.personEmailAddress })
      .first()
    if (existingPerson) {
      if (
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
            title: person.title,
            geographyId,
            email: person.personEmailAddress,
            cell: person.personCell,
            phone: person.personPhone,
            hidePatientId: person.hidePatientId,
            hideSampleId: person.hideSampleId,
            hideNotes: person.hideNotes,
            updatedOn: now,
            updatedBy: adminId,
          })
      }
      personId = existingPerson.id
    } else {
      ;[personId] = await knex('Person').insert({
        name: person.personName,
        timezone: person.timezone,
        geographyId,
        title: person.title,
        email: person.personEmailAddress,
        cell: person.personCell,
        phone: person.personPhone,
        userId,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        hidePatientId: person.hidePatientId,
        hideSampleId: person.hideSampleId,
        hideNotes: person.hideNotes,
        culture: 'en',
        ...auditFields,
      })
    }
    if (!_.isEmpty(person.jobFunctions)) {
      await Promise.each(person.jobFunctions, async jobFunctionName => {
        let { id: jobId } =
          (await knex('Job')
            .where({ personId, jobFunctionId: jobFunctions[jobFunctionName] })
            .first()) || {}
        if (!jobId) {
          ;[jobId] = await knex('Job').insert({
            personId,
            jobFunctionId: jobFunctions[jobFunctionName],
          })
        }
        if (
          !['Admin', 'Regional Officer'].includes(jobFunctionName) &&
          !_.isEmpty(person.sites) &&
          _.some(person.sites, site => !!siteIds[site.shortName])
        ) {
          const existingJobContexts = await knex('JobContext')
            .whereNotNull('siteId')
            .andWhere({ jobId })
            .select()
          const expectedJobContexts = person.sites
            .filter(site => !!siteIds[site.shortName])
            .map(site => ({
              jobId,
              siteId: siteIds[site.shortName],
            }))
          await knex('JobContext').insert(
            expectedJobContexts.filter(
              expectedJobContext =>
                !_.some(
                  existingJobContexts,
                  jobContext => jobContext.siteId === expectedJobContext.siteId
                )
            )
          )
          const existingJobContextsToRemove = existingJobContexts.filter(
            existingJobContext =>
              !_.some(expectedJobContexts, {
                siteId: existingJobContext.siteId,
              })
          )
          await knex('JobContext')
            .where('jobId', jobId)
            .whereNull('geographyId')
            .whereIn(
              'siteId',
              existingJobContextsToRemove.map(
                existingJobContextToRemove => existingJobContextToRemove.siteId
              )
            )
            .delete()
          await Promise.each(
            existingJobContextsToRemove.filter(
              existingJobContextToRemove =>
                !!existingJobContextToRemove.geographyId
            ),
            existingJobContextToUpdate =>
              knex
                .where({
                  jobId,
                  geographyId: existingJobContextToUpdate.geographyId,
                })
                .update({ siteId: null })
          )
        }
        if (
          ['Admin', 'Regional Officer', 'Data Viewer'].includes(
            jobFunctionName
          ) &&
          !_.isEmpty(person.geographies)
        ) {
          const existingJobContexts = await knex('JobContext')
            .whereNotNull('geographyId')
            .andWhere({ jobId })
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
                jobId,
                geographyId: jobGeographyId,
              },
            ]
          })
          await knex('JobContext').insert(
            expectedJobContexts.filter(
              expectedJobContext =>
                !_.some(
                  existingJobContexts,
                  jobContext =>
                    jobContext.geographyId === expectedJobContext.geographyId
                )
            )
          )
          const existingJobContextsToRemove = existingJobContexts.filter(
            existingJobContext =>
              !_.some(expectedJobContexts, {
                geographyId: existingJobContext.geographyId,
              })
          )
          await knex('JobContext')
            .where('jobId', jobId)
            .whereNull('siteId')
            .whereIn(
              'geographyId',
              existingJobContextsToRemove.map(
                existingJobContextToRemove =>
                  existingJobContextToRemove.geographyId
              )
            )
            .delete()
          await Promise.each(
            existingJobContextsToRemove.filter(
              existingJobContextToRemove => !!existingJobContextToRemove.siteId
            ),
            existingJobContextToUpdate =>
              knex
                .where({
                  jobId,
                  siteId: existingJobContextToUpdate.siteId,
                })
                .update({ geographyId: null })
          )
        }
      })
    }
  })
}
