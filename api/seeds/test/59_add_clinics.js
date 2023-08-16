const Promise = require('bluebird')
const _ = require('lodash')
const { seed } = require('../utils')
const labClinic = require('./fixtures/labClinic.json')
const { siteTypeToId } = require('../../src/shared/dictionary')

module.exports = seed(async knex => {
  const { id: usCountryId } = await knex('Country').where('abbreviation', 'US').first('id')

  const states = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': usCountryId })
    .select('g.countryId', 's.id', 's.name')
  const lgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': usCountryId })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const statesByName = states.reduce((stateMemo, state) => {
    stateMemo[state.name.toLowerCase()] = state
    const stateLgas = _.filter(lgas, {
      stateName: state.name,
    })
    if (stateLgas) {
      state.lgas = stateLgas.reduce((lgaMemo, lga) => {
        lgaMemo[lga.name.toLowerCase()] = lga
        return lgaMemo
      }, {})
    }
    return stateMemo
  }, {})

  const { id: partnerOneId } = await knex('Partner').where('externalId', 'partnerOne').first('id')

  const clinicSiteTypeId = await siteTypeToId('clinic')

  const now = new Date()
  const { id: adminId } = await knex('Person').where('name', 'admin').first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  await Promise.each(labClinic.clinics, async clinic => {
    const { id: clinicGeographyId } = await knex('Geography')
      .where({
        countryId: usCountryId,
        stateId: (statesByName[clinic.stateName.toLowerCase()] || { id: null }).id,
      })
      .first()

    // sites
    const siteData = {
      partnerId: partnerOneId,
      geographyId: clinicGeographyId,
      name: clinic.name,
      shortName: clinic.shortName,
      externalId: clinic.externalId,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      siteTypeId: clinicSiteTypeId,
      ...auditFields,
    }
    return knex('Site').insert(siteData)
  })
}, __filename)
