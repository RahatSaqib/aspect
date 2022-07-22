module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const _ = require('lodash')

const labClinic = require('./fixtures/labClinic.json')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ name: 'Philippines' }).first('id')

  const philippinesCountry = await knex('Country as c')
    .where({ 'c.a3': 'PHL' })
    .first('c.id', 'c.culture', 'c.timezone')

  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: countryId } = philippinesCountry

  const states = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .select('g.countryId', 's.id', 's.name')
  const lgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
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

  await Promise.all(
    _.map(labClinic.clinics, async clinic => {
      const state = statesByName[clinic.stateName.toLowerCase()] || { id: null }
      const { id: clinicGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: state.id,
          lgaId: (state.lgas[clinic.lgaName.toLowerCase()] || { id: null }).id,
        })
        .first()

      const siteData = {
        partnerId,
        geographyId: clinicGeographyId,
        name: clinic.name,
        shortName: clinic.shortName,
        externalId: clinic.externalId,
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        ...auditFields,
      }
      const existingSite = await knex('Site')
        .where('externalId', clinic.externalId)
        .first('id', 'geographyId', 'latitude', 'longitude')
      if (!existingSite) {
        await knex('Site').insert(siteData)
      } else if (
        existingSite.geographyId !== clinicGeographyId ||
        existingSite.latitude !== clinic.latitude ||
        existingSite.longitude !== clinic.longitude
      ) {
        await knex('Site').where('id', existingSite.id).update({
          geographyId: clinicGeographyId,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
        })
      }
    })
  )
}
