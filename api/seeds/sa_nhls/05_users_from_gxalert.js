module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')

const gxAlertContacts = require('./fixtures/gxAlertContacts.json')
const config = require('../../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  const existingUser = await knex('User')
    .where('name', 'sergio.carmona@nhls.ac.za')
    .first()
  if (existingUser) {
    return
  }

  const { id: partnerId } = await knex('Partner')
    .where('name', 'South Africa NHLS')
    .first('id')

  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where({ name: 'Admin', partnerId })
    .first('id')
  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where({ name: 'Regional Officer', partnerId })
    .first('id')
  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({ name: 'Lab User', partnerId })
    .first('id')
  const jobFunctions = {
    jobFunctionIdAdmin,
    jobFunctionIdRegionalOfficer,
    jobFunctionIdLabUser,
  }

  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const southAfricaCountry = await knex('Country as c')
    .where({ 'c.a3': 'ZAF' })
    .first('c.id', 'c.culture', 'c.timezone')
  const { id: countryId } = southAfricaCountry
  const southAfricaProvinces = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 's.id', 's.name')
  const southAfricaDistricts = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const provincesByName = southAfricaProvinces.reduce(
    (provinceMemo, province) => {
      provinceMemo[province.name.toLowerCase()] = province
      const provinceDistricts = _.filter(southAfricaDistricts, {
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

  await Promise.each(gxAlertContacts, async person => {
    let userId = null
    if (person.username) {
      const pw = bcrypt.hashSync(person.password, saltRounds)
      const baseUserData = {
        password: pw,
        failedPasswordAttempts: 0,
        legacyPassword: 1,
        lockedOut: 0,
      }
      ;[userId] = await knex('User').insert({
        name: person.username,
        approved: 1,
        createdOn: now,
        ...baseUserData,
      })
    }

    const province = person.stateName
      ? provincesByName[person.stateName.toLowerCase()] || {
          id: null,
          districts: {},
        }
      : {
          id: null,
          districts: {},
        }
    const district =
      province.districts && person.lgaName
        ? province.districts[person.lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: geographyId } = await knex('Geography')
      .where({
        countryId,
        stateId: province.id,
        lgaId: district.id,
      })
      .first()

    const [personId] = await knex('Person').insert({
      name: person.personName,
      timezone: person.timezone,
      culture: person.culture,
      geographyId,
      title: person.title,
      email: person.emailAddress,
      cell: person.mobile,
      userId,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      hidePatientId: person.hidePatientId,
      hideSampleId: person.hideSampleId,
      hideNotes: person.hideNotes,
      ...auditFields,
    })

    if (!_.isEmpty(person.tags)) {
      const tagsInDatabase = await knex('Tag')
        .whereIn('title', person.tags)
        .andWhere('partnerId', partnerId)
        .select()
      const tagsToInsert = _.filter(
        _.uniq(person.tags),
        tagTitle => !_.some(tagsInDatabase, { title: tagTitle })
      )
      await Promise.each(tagsToInsert, async tagToInsert => {
        const [tagId] = await knex('Tag').insert({
          title: tagToInsert,
          partnerId,
        })
        tagsInDatabase.push({
          id: tagId,
          title: tagToInsert,
          partnerId,
        })
      })

      const personTagsInDatabase = await knex('PersonTag').where(
        'personId',
        personId
      )
      const tagsToAppendToPerson = _.filter(
        tagsInDatabase,
        tagInDatabase =>
          !_.some(personTagsInDatabase, { tagId: tagInDatabase.id })
      )
      await Promise.each(tagsToAppendToPerson, async tag =>
        knex('PersonTag').insert({ tagId: tag.id, personId })
      )
    }
    const [jobId] = await knex('Job').insert({
      personId,
      jobFunctionId: jobFunctions[person.jobFunctionId],
    })
    if (jobFunctions[person.jobFunctionId] === jobFunctionIdLabUser) {
      await knex('JobContext').insert({
        jobId,
        siteId: siteIds[person.deploymentShortName],
      })
    } else {
      await knex('JobContext').insert({ jobId, geographyId })
    }
  })
}
