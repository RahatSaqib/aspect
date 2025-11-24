const _ = require('lodash')
const { query, knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function buildGeographySelectList() {
  const countriesStatesAndLGAs = await query('Get countries, states and LGAs for select lists')
    .from('Country as c')
    .innerJoin('Geography as g', 'g.countryId', 'c.id')
    .leftJoin('State as s', 's.id', 'g.stateId')
    .leftJoin('Lga as l', 'l.id', 'g.lgaId')
    .orderBy(['c.name', 's.name', 'l.name'], 'asc')
    .select(
      'c.id as countryId',
      'c.name as countryName',
      's.id as stateId',
      's.name as stateName',
      'l.id as lgaId',
      'l.name as lgaName'
    )

  const result = {
    ok: true,
    data: _.map(_.uniqBy(countriesStatesAndLGAs, 'countryId'), countryRecord => ({
      id: countryRecord.countryId,
      name: countryRecord.countryName,
      states: _.map(
        _.filter(
          _.uniqBy(countriesStatesAndLGAs, 'stateId'),
          stateRecord => stateRecord.stateId && stateRecord.countryId === countryRecord.countryId
        ),
        stateRecord => ({
          id: stateRecord.stateId,
          name: stateRecord.stateName,
          lgas: _.map(
            _.filter(
              _.uniqBy(countriesStatesAndLGAs, 'lgaId'),
              lgaRecord =>
                lgaRecord.lgaId &&
                lgaRecord.countryId === countryRecord.countryId &&
                lgaRecord.stateId === stateRecord.stateId
            ),
            lgaRecord => ({
              id: lgaRecord.lgaId,
              name: lgaRecord.lgaName,
            })
          ),
        })
      ),
    })),
  }

  return result
}

async function countrySelectList(request) {
  const { params, auth } = request
  const { countryId, stateId } = params
  const dataConstraints = auth ? await getConstraints(auth.credentials) : null
  const addConstraintsLocal = auth ? addConstraints : _.identity

  let countries = []
  if (!countryId) {
    countries = await query('Get countries for select list')
      .from('Country as c')
      .leftJoin('Geography as g', 'g.countryId', 'c.id')
      .modify(addConstraintsLocal, dataConstraints, request.query?.all ? {} : { geography: 'g' })
      .whereNull('g.stateId')
      .whereNull('g.lgaId')
      .orderBy(['c.name'], 'asc')
      .select('c.id', 'c.name', 'c.abbreviation', 'c.a3')
  } else if (!stateId) {
    const countriesAndStates = await query('Get countries and country states for select lists')
      .from('Country as c')
      .innerJoin('Geography as g', 'g.countryId', 'c.id')
      .leftJoin('State as s', function () {
        this.on('s.id', 'g.stateId').on({ 'g.countryId': knex.raw(countryId) })
      })
      .modify(addConstraintsLocal, dataConstraints, { geography: 'g' })
      .orderBy(['c.name', 's.name'], 'asc')
      .distinct('c.id as countryId', 'c.name as countryName', 's.id as stateId', 's.name as stateName')
    countries = _.map(_.uniqBy(countriesAndStates, 'countryId'), countryRecord => ({
      id: countryRecord.countryId,
      name: countryRecord.countryName,
    }))

    const selectedCountry = _.find(countries, { id: countryId })

    const selectedCountryStates = _.map(
      _.filter(countriesAndStates, stateRecord => stateRecord.stateId != null),
      stateRecord => ({
        id: stateRecord.stateId,
        name: stateRecord.stateName,
      })
    )

    selectedCountry.states = _.sortBy(selectedCountryStates, 'name')
  } else {
    const countriesStatesAndLgas = await query('Get countries, country states and state LGAs for select lists')
      .from('Country as c')
      .innerJoin('Geography as g', 'g.countryId', 'c.id')
      .leftJoin('State as s', function () {
        this.on('s.id', 'g.stateId').on({ 'g.countryId': knex.raw(countryId) })
      })
      .leftJoin('Lga as l', function () {
        this.on('l.id', 'g.lgaId').on({ 'g.stateId': knex.raw(stateId) })
      })
      .modify(addConstraintsLocal, dataConstraints, { geography: 'g' })
      .orderBy(['c.name', 's.name', 'l.name'], 'asc')
      .distinct(
        'c.id as countryId',
        'c.name as countryName',
        's.id as stateId',
        's.name as stateName',
        'l.id as lgaId',
        'l.name as lgaName'
      )
    countries = _.map(_.uniqBy(countriesStatesAndLgas, 'countryId'), countryRecord => ({
      id: countryRecord.countryId,
      name: countryRecord.countryName,
    }))

    const selectedCountry = _.find(countries, { id: countryId })

    const selectedCountryStates = _.map(
      _.uniqBy(
        _.filter(countriesStatesAndLgas, stateRecord => stateRecord.stateId != null),
        'stateId'
      ),
      stateRecord => ({
        id: stateRecord.stateId,
        name: stateRecord.stateName,
      })
    )
    selectedCountry.states = _.sortBy(selectedCountryStates, 'name')

    const selectedState = _.find(selectedCountry.states, { id: stateId })
    const selectedStateLgas = _.map(
      _.filter(countriesStatesAndLgas, lgaRecord => lgaRecord.lgaId != null),
      lgaRecord => ({
        id: lgaRecord.lgaId,
        name: lgaRecord.lgaName,
      })
    )

    selectedState.lgas = _.sortBy(selectedStateLgas, 'name')
  }

  return { ok: true, data: countries }
}

async function stateSelectListForUser(request) {
  const { countryId } = request.params
  const { all, onlyAssociatedSites } = request.query
  const dataConstraints = await getConstraints(request.auth.credentials)
  return getStates(dataConstraints, { countryId, all, onlyAssociatedSites })
}

async function stateSelectList(request) {
  const { stateId } = request.params
  return getStates(null, { stateId })
}

async function getStates(dataConstraints, { countryId, stateId, all, onlyAssociatedSites }) {
  let states = []
  const statesAndLgas = await query(
    stateId ? 'Get states and state LGAs for select lists' : 'Get states for select list'
  )
    .from('State as s')
    .innerJoin('Geography as g', 'g.stateId', 's.id')
    .leftJoin('Lga as l', function () {
      this.on('l.id', 'g.lgaId')
      if (stateId) {
        this.andOn({ 'g.stateId': knex.raw(stateId) })
      }
    })
    .modify(q => {
      if (countryId) q.where('g.countryId', countryId)
    })
    .modify(q => {
      if (onlyAssociatedSites)
        q.innerJoin('Site as si', 'si.geographyId', 'g.id').innerJoin('Device as d', 'd.siteId', 'si.id')
    })
    .modify(q => {
      if (dataConstraints) q.modify(addConstraints, dataConstraints, all ? {} : { geography: 'g' })
    })
    .orderBy(['s.name'], 'asc')
    .distinct('s.id as stateId', 's.name as stateName', 'l.id as lgaId', 'l.name as lgaName')

  states = _.reduce(
    _.groupBy(statesAndLgas, 'stateId'),
    (acc, items) => {
      const [{ stateId, stateName }] = items // get state values from 1st item
      const lgas = items
        .filter(({ lgaId }) => !!lgaId) // include only not null'ed lga's
        .map(({ lgaId, lgaName }) => ({
          id: lgaId,
          name: lgaName,
        }))
      acc = [
        ...acc,
        {
          id: stateId,
          name: stateName,
          lgas: _.sortBy(lgas, 'name'),
        },
      ]
      return acc
    },
    []
  )
  states = _.sortBy(states, 'name')

  return { ok: true, data: states }
}

async function lgaSelectList(request) {
  const { params, auth } = request
  const { all } = request.query
  const dataConstraints = await getConstraints(auth.credentials)
  const lgas = await query('Get LGAs for select list')
    .from('Lga as l')
    .innerJoin('Geography as g', 'g.lgaId', 'l.id')
    .where('g.stateId', params.stateId)
    .modify(addConstraints, dataConstraints, all ? {} : { geography: 'g' })
    .orderBy(['l.name'], 'asc')
    .distinct('l.id', 'l.name')

  return { ok: true, data: lgas }
}

/**
 * Adds geographyId field to @see {updates}, searching in DB for a record matching countryId, stateId and lgaId
 * @param {Object} updates - Object with countryId, stateId and lgaId data.
 * @param {number} fallbackCountryId - default country Id of no countryId is specified. This prevents the method to return a wrong country
 * if no one is specified, as in a multi country environment this could be a problem. Although, returning the first geography in DB is still
 * the default behaviour if this parameter is not specified.
 * @returns - Input object transformed, now containing geographyId field added, with matching id if a record is found or null if not.
 */
async function transformGeographyFromUpdates(updates, fallbackCountryId) {
  const geoFieldNames = ['countryId', 'stateId', 'lgaId']
  const geoFields = _.pick(updates, geoFieldNames)
  const transformedFields = _.omit(updates, geoFieldNames)

  if (!geoFields?.countryId) {
    geoFields.countryId = fallbackCountryId
  }
  const geography = await knex('Geography').where(geoFields).first('id')
  transformedFields.geographyId = geography ? geography.id : null

  return transformedFields
}

module.exports = {
  buildGeographySelectList,
  countrySelectList,
  stateSelectList,
  stateSelectListForUser,
  lgaSelectList,
  transformGeographyFromUpdates,
}
