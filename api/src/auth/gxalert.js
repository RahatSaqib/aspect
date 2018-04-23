const { promisify } = require('util')
const bcrypt = require('bcrypt')
const {
  createFetch,
  base,
  accept,
  header,
  method,
  body,
} = require('http-client')

require('isomorphic-fetch')
const config = require('../config')
const { query, transact } = require('../db')

const bcryptHash = promisify(bcrypt.hash)

function getUser(username, knex) {
  return knex
    .from('User as u')
    .innerJoin('Person as p', 'u.id', 'p.userId')
    .where({ 'u.name': username })
    .first(
      'u.lockedOut',
      'u.failedPasswordAttempts',
      'u.password',
      'u.legacyPassword',
      'u.id',
      'u.name',
      'p.culture',
      'p.timezone',
      'p.lastPartnerId as partnerId',
      'p.lastCountryId as countryId'
    )
}

async function validateUserAtGxAlert(username, password, user) {
  const now = new Date()

  // lower name
  username = username.toLowerCase()

  // use GxAlert API to check pw
  const gxFetch = createFetch(
    method('POST'),
    base(config.gxAlertApi),
    accept('application/json'),
    header('Content-Type', 'application/json'),
    body(JSON.stringify({ username, password }), 'application/json')
  )

  const resp = await gxFetch('/auth')
  if (resp.status !== 200) {
    return null
  }

  // user profile from GxAlert
  const gxUser = await resp.json()
  const countryId = await getCountryIdByAbbr(gxUser.country.abbreviation)
  // exit if no country found in Aspect
  // 'null' means username and/or password did not match in GxAlert
  if (!countryId) {
    return null
  }

  // -------------------------------------------
  // check that country has exactly 1 partner
  // -------------------------------------------
  const partners = await query('Get partners from all sites of this country')
    .select('s.partnerId as id')
    .from('Site as s')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .where('g.countryId', countryId)
    .distinct('s.partnerId')
  // exit if not exactly 1 partner in this country
  if (!partners || partners.length !== 1) {
    return null
  }

  const partner = partners[0]
  // -------------------------------------------
  // calculate jobFunctionId
  // -------------------------------------------
  const allJobFunctions = await query('Get job functions for this partner')
    .from('JobFunction')
    .where('partnerId', partner.id)
    .select('id', 'name')

  let jobFunction
  // items from 'my_aspnet_roles': readonly, write, inventory, service, report
  // items from 'role': deployment, lga, state, national
  if (gxUser.dotNetRoles.includes('admin') || gxUser.role === 'national') {
    jobFunction = allJobFunctions.find(x => x.name === 'Admin')
  }
  if (!jobFunction && gxUser.role === 'state') {
    jobFunction =
      allJobFunctions.find(x => x.name === 'Manager') ||
      allJobFunctions.find(x => x.name === 'Regional Officer')
  }
  if (!jobFunction) {
    jobFunction =
      allJobFunctions.find(x => x.name === 'Clinician') ||
      allJobFunctions.find(x => x.name === 'Lab User')
  }
  const jobFunctionId = jobFunction ? jobFunction.id : null

  // -------------------------------------------
  // we now know that
  // - password is valid
  // - country of the user has 1 partner only
  // - job function of the user, if any calculated
  // Store user profile in our database in a transaction
  // -------------------------------------------
  return transact(async knex => {
    // generate pw hash
    const pw = await bcryptHash(
      password,
      parseInt(config.passwordSaltRounds, 10)
    )

    // basic data to save
    const baseUserData = {
      password: pw,
      failedPasswordAttempts: 0,
      legacyPassword: 0,
      lockedOut: 0,
    }

    let userId
    // insert/update fields in 'User' table
    if (!user) {
      // create new user in Aspect
      userId = await knex
        .insert(
          {
            name: username,
            approved: 1,
            createdOn: now,
            ...baseUserData,
          },
          'id'
        )
        .into('User')
    } else {
      userId = user.id

      // update user with password hash
      await knex('User')
        .update(baseUserData)
        .where({ id: userId })
    }

    // create/update Person in our db
    // pass 'knex' for transaction integrity
    const personId = await updateCreatePerson(knex, userId, gxUser)

    // insert Job if not exists
    if (jobFunctionId) {
      const d = { personId, jobFunctionId }
      const job = await knex('Job')
        .where(d)
        .first()
      if (!job) {
        await knex('Job').insert(d)
      }
    }

    // finally return User
    user = await getUser(username, knex)
    return user
  })
}

async function updateCreatePerson(knex, userId, gxUser) {
  const now = new Date()
  // user id for required fields createdBy, updatedBy
  const { id: adminId } = await knex
    .from('User')
    .where({ name: 'admin' })
    .first('id')

  // Person Id
  const person = await knex
    .from('Person')
    .where({ userId })
    .first('id')
  let personId = person.id

  const geography = await getCreateGeographyIdBy(
    knex, // pass 'knex' for transaction consistency
    gxUser.country.abbreviation,
    gxUser.state.name,
    gxUser.state.abbreviation,
    gxUser.lga.name
  )
  const { id: geographyId } = geography || {}

  const basePersonData = {
    // required fields
    name: gxUser.fullName,
    timezone: gxUser.timezoneId,
    culture: gxUser.culture,
    updatedOn: now,
    updatedBy: adminId,
    // optional fields
    geographyId,
    title: gxUser.title,
    email: gxUser.email,
    email2: gxUser.email2,
    phone: gxUser.phone,
    cell: gxUser.cell,
  }

  // Insert or Update person in our db
  if (!personId) {
    personId = await knex('Person').insert(
      {
        userId,
        createdOn: now,
        createdBy: adminId,
        ...basePersonData,
      },
      'id'
    )
  } else {
    await knex('Person')
      .where({ id: personId })
      .update(basePersonData)
  }

  return personId
}

async function getCountryIdByAbbr(countryAbbreviation) {
  const { id: countryId } = await query('Get country id by abbreviation')
    .from('Country')
    .where('abbreviation', countryAbbreviation)
    .first('id')

  return countryId
}

async function getCreateGeographyIdBy(
  knex,
  countryAbbreviation,
  stateName,
  stateAbbreviation,
  lgaName
) {
  const { id: countryId } = await knex
    .from('Country')
    .where('abbreviation', countryAbbreviation)
    .first('id')

  // exit if country is unknown
  if (!countryId) {
    return null
  }

  let geography

  // check if geography for country exists
  let d = { countryId, stateId: null, lgaId: null }
  geography = await knex
    .from('Geography')
    .where(d)
    .first('id')
  // create if not exist
  if (!geography) {
    await knex.insert(d).into('Geography')
  }

  // check if geography for state exists
  let stateId = null
  if (stateName) {
    // get state which has Geography - inner join
    const state = await knex
      .from('State as s')
      .innerJoin('Geography as g', 's.id', 'g.stateId')
      .where(() =>
        this.where('s.name', stateName).orWhere(
          's.abbreviation',
          stateAbbreviation
        )
      )
      .where('g.countryId', countryId) // for this country
      .whereNull('g.lgaId') // lgaId must be null
      .first('s.id')
    if (state) {
      stateId = state.id
    } else {
      // insert State
      d = { name: stateName, abbreviation: stateAbbreviation }
      stateId = await knex.insert(d, 'id').into('State')
      // insert Geography for this state
      d = { countryId, stateId, lgaId: null }
      await knex.insert(d).into('Geography')
    }
  }

  // check if geography for lga exists
  let lgaId = null
  if (lgaName) {
    // get lga which has Geography - inner join
    d = { 'g.countryId': countryId, 'g.stateId': stateId, 'l.name': lgaName }
    const lga = await knex
      .from('Lga as l')
      .innerJoin('Geography as g', 'l.id', 'g.lgaId')
      .where(d)
      .first('l.id as lgaId')
    if (lga) {
      lgaId = lga.id
    } else {
      // insert Lga
      lgaId = await knex.insert({ name: lgaName }, 'id').into('Lga')
      // insert missing Geography for this lga
      d = { countryId, stateId, lgaId }
      await knex.insert(d).into('Geography')
    }
  }

  // finally - get geography
  geography = await knex
    .from('Geography')
    .where({ countryId, stateId, lgaId })
    .first()

  // if not found - create it
  if (!geography) {
    geography = await knex // query('Create Geography with provided values')
      .insert({ countryId, stateId, lgaId })
      .into('Geography')
      .returning('*')
  }

  return geography
}

module.exports = {
  validateUserAtGxAlert,
}
