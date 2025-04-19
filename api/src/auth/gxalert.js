const _ = require('lodash')
const { promisify } = require('util')
const bcrypt = require('bcrypt')
const { createFetch, base, accept, header, method, body } = require('http-client')
const Promise = require('bluebird')
const { createHmac } = require('crypto')

require('isomorphic-fetch')

const config = require('../config')
const { query, transact } = require('../db')

const bcryptHash = promisify(bcrypt.hash)

class GxAlertLoginError extends Error {
  constructor(message, isConnectionError) {
    super(message)

    if (isConnectionError === null || isConnectionError === undefined)
      throw new Error('The parameter isConnectionError cannot be null')

    this.isConnectionError = isConnectionError
  }
}

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
      'p.lastCountryId as countryId',
      'p.id as personId'
    )
}

async function storeUser(knex, username, password, gxUser, partnerId, countryId, jobFunctionId, partnerPlugin) {
  const now = new Date()

  // generate pw hash
  const pw = await bcryptHash(password, parseInt(config.passwordSaltRounds, 10))

  // basic data to save
  const baseUserData = {
    password: pw,
    failedPasswordAttempts: 0,
    legacyPassword: 0,
    lockedOut: 0,
  }

  let aspectUser = await getUser(username, knex)
  let userId

  // insert/update fields in 'User' table
  if (!aspectUser) {
    // create new user in Aspect
    ;[userId] = await knex('User').insert({
      name: username,
      approved: 1,
      createdOn: now,
      ...baseUserData,
    })
  } else {
    userId = aspectUser.id

    // update user with password hash
    await knex('User').update(baseUserData).where({ id: userId })
  }

  // create/update Person in our db
  const personOptions = { userId, partnerId, countryId }
  const personId = await updateCreatePerson(knex, gxUser, personOptions)
  if (!_.isEmpty(gxUser.tags)) {
    await updateTagsForPerson(knex, {
      partnerId,
      personId,
      tagTitles: gxUser.tags,
    })
  }

  if (jobFunctionId) {
    await setJobContext(knex, personId, jobFunctionId, gxUser)
  }

  // finally return User
  const { loadPlugin } = require('../plugin/loadPlugin')
  const onGxAlertAuthenticated = await loadPlugin(partnerPlugin, undefined, 'onGxAlertAuthenticated')
  await onGxAlertAuthenticated({ gxUser, partnerId, personId, knex })

  aspectUser = await getUser(username, knex)

  return aspectUser
}

/**
 * Inserts or updates a GxAlert's user in Aspect.
 * Throws GxAlertLoginError exception if any conflict within GxAlert and Aspect credentials is found.
 * @param {object} gxUser The user data provided by GxAlert
 * @param {string} username The username for login
 * @param {string} password The password for login
 * @return {object} The upserted user
 */
async function upsertUser(gxUser, username, password) {
  const countryId = await getCountryIdByAbbr(gxUser.country.abbreviation)
  // exit if no country found in Aspect
  // 'null' means username and/or password did not match in GxAlert
  if (!countryId) {
    throw new GxAlertLoginError(`Non existent country ${gxUser.country.abbreviation} for user's credentials`, false)
  }

  // -------------------------------------------
  // check that country has exactly 1 partner
  // -------------------------------------------
  const partners = await query('Get partners from all sites of this country')
    .select('s.partnerId as id', 'p.plugin')
    .from('Site as s')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .where('g.countryId', countryId)
    .distinct('s.partnerId', 'p.plugin')
  // exit if not exactly 1 partner in this country
  if (!partners || partners.length !== 1) {
    throw new GxAlertLoginError(
      `Non existent partner for user's credentials. Please, check that there are sites defined for the country ${gxUser.country.abbreviation} and that they are assigned with geography and partner.`,
      false
    )
  }

  const { id: partnerId, plugin: partnerPlugin } = partners[0]
  // -------------------------------------------
  // calculate jobFunctionId
  // -------------------------------------------
  const allJobFunctions = await query('Get job functions for this partner')
    .from('JobFunction')
    .where('partnerId', partnerId)
    .select('id', 'name', 'externalId')

  let jobFunction
  // items from 'my_aspnet_roles': readonly, write, inventory, service, report
  // items from 'role': deployment, lga, state, national
  if (gxUser.dotNetRoles.includes('admin') || gxUser.role === 'national') {
    jobFunction = allJobFunctions.find(x => x.externalId === 'superAdmin')
  }
  if (!jobFunction && (gxUser.role === 'state' || gxUser.role === 'lga')) {
    jobFunction =
      allJobFunctions.find(x => x.externalId === 'regionalOfficer') ||
      allJobFunctions.find(x => x.externalId === 'regionalAdmin')
  }
  if (!jobFunction) {
    jobFunction =
      allJobFunctions.find(x => x.externalId === 'clinician') || allJobFunctions.find(x => x.externalId === 'labUser')
  }
  const jobFunctionId = jobFunction ? jobFunction.id : null
  // exit if no jobFunction found
  if (!jobFunctionId) {
    throw new GxAlertLoginError(
      `Non existent job function for user's credentials. Please check that there is a partner defined for the country ${gxUser.country.abbreviation}, and that job functions exist for that partner.`,
      false
    )
  }

  // -------------------------------------------
  // we now know that
  // - password is valid
  // - country of the user has 1 partner only
  // - job function of the user, if any calculated
  // Store user profile in our database in a transaction
  // -------------------------------------------
  return transact(async knex =>
    storeUser(knex, username, password, gxUser, partnerId, countryId, jobFunctionId, partnerPlugin)
  )
}

/**
 * Authenticates to GxAlert and validates a user using the provided username and password.
 *
 * @param {string} username The username for login
 * @param {string} password The password for login
 * @return {object} An Aspect's user. Returns null when username or password are incorrect.
 */
async function gxAlertAuthenticate(username, password) {
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

  let resp = null
  try {
    resp = await gxFetch('/auth')
  } catch (err) {
    throw new GxAlertLoginError("GxAlert service isn't available", true)
  }

  let aspectUser
  let gxUser
  switch (resp.status) {
    case 200:
      gxUser = await resp.json()
      aspectUser = upsertUser(gxUser, username, password)
      break
    case 403:
      aspectUser = null
      break
    default:
      throw new GxAlertLoginError('GxAlert service is available, but an error happened while authenticating', true)
  }

  return aspectUser
}

// --------------------------------------------------------------------------------------------
// setJobContext - based on list of countries, states, lgas, deployments gxAlert user is linked
// --------------------------------------------------------------------------------------------
async function setJobContext(knex, personId, jobFunctionId, gxUser) {
  let hasJobContext = false
  // helper function
  const createIfNotExist = async (knex, options, onSuccess) => {
    const geographyId = await getCreateGeographyIdByGxGeo(knex, options)
    if (geographyId) {
      // read JobContext item
      let { id: jobContextId } =
        (await knex('JobContext').where({ personId, jobFunctionId, geographyId }).whereNull('siteId').first()) || {}
      // if not exists - create it
      if (!jobContextId) {
        ;[jobContextId] = await knex('JobContext').insert({
          personId,
          jobFunctionId,
          geographyId,
        })
      }
      onSuccess()
    }
  }

  // countries which gxalert user is bound to
  if (_.isArray(gxUser.access.countries)) {
    await Promise.all(
      _.map(gxUser.access.countries, async country => {
        await createIfNotExist(
          knex,
          {
            countryAbbreviation: country.abbreviation,
          },
          () => {
            hasJobContext = true
          }
        )
      })
    )
  }

  // states which gxalert user is bound to
  if (_.isArray(gxUser.access.states)) {
    await Promise.all(
      _.map(gxUser.access.states, async state => {
        await createIfNotExist(
          knex,
          {
            countryAbbreviation: state.countryAbbreviation,
            stateName: state.name,
            stateAbbreviation: state.abbreviation,
          },
          () => {
            hasJobContext = true
          }
        )
      })
    )
  }

  // lgas which gxalert user is bound to
  if (_.isArray(gxUser.access.lgas)) {
    await Promise.all(
      _.map(gxUser.access.lgas, async lga => {
        await createIfNotExist(
          knex,
          {
            countryAbbreviation: lga.countryAbbreviation,
            stateName: lga.stateName,
            stateAbbreviation: lga.stateAbbreviation,
            lgaName: lga.name,
          },
          () => {
            hasJobContext = true
          }
        )
      })
    )
  }

  // deployments
  if (_.isArray(gxUser.access.deployments)) {
    await Promise.all(
      _.map(gxUser.access.deployments, async deployment => {
        const options = {
          countryAbbreviation: deployment.countryAbbreviation,
          stateName: deployment.stateName,
          stateAbbreviation: deployment.stateAbbreviation,
          lgaName: deployment.lgaName,
        }

        const geographyId = await getCreateGeographyIdByGxGeo(knex, options)
        const shortName = deployment.shortName || deployment.description || deployment.hostId

        let { siteId } =
          (await knex('Device as d')
            .join('Site as s', 'd.siteId', 's.id')
            .where({ geographyId }) // Geography will never be undefined
            .where(function () {
              this.where('d.shortName', shortName).orWhere('d.name', shortName)
            })
            .first('d.siteId')) || {}

        if (!siteId) {
          const site =
            (await knex('Site')
              .where({ geographyId })
              .where(function () {
                this.where({ shortName }).orWhere('name', shortName) // Shortname shouldn't be undefined, too
              })
              .first()) || {}
          siteId = site.id
        }

        // REVIEWER!!! If the device is not added, Aspect should let the admin to add devices to users
        if (geographyId && siteId) {
          const { id: jobContextId } =
            (await knex('JobContext').where({ personId, jobFunctionId, siteId }).whereNull('geographyId').first()) || {}
          if (!jobContextId) {
            await knex('JobContext').insert({ personId, jobFunctionId, siteId })
          }
          hasJobContext = true
        }
      })
    )
  }
  // throw error if no JobContext defined - it will be caught and handled by transaction promise
  if (!hasJobContext) {
    throw new Error("The user doesn't have job context.")
  }
}

// --------------------------------------------------------------------------------------------
// updateCreatePerson
// --------------------------------------------------------------------------------------------
async function updateCreatePerson(knex, gxUser, { userId, partnerId: lastPartnerId, countryId: lastCountryId }) {
  const now = new Date()
  let { id: personId } = (await knex.from('Person').where({ userId }).first('id')) || {}

  const options = {
    countryAbbreviation: gxUser.country.abbreviation,
    stateName: gxUser.state.name,
    stateAbbreviation: gxUser.state.abbreviation,
    lgaName: gxUser.lga.name,
  }
  const geographyId = await getCreateGeographyIdByGxGeo(knex, options)

  const basePersonData = {
    // required fields
    name: gxUser.fullName,
    timezone: gxUser.timezoneId,
    culture: gxUser.culture,
    updatedOn: now,
    canLogin: true,
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
    ;[personId] = await knex('Person').insert({
      userId,
      lastPartnerId,
      lastCountryId,
      createdOn: now,
      ...basePersonData,
    })
  } else {
    await knex('Person').where({ id: personId }).update(basePersonData)
  }

  return personId
}

// --------------------------------------------------------------------------------------------
// getCountryIdByAbbr
// --------------------------------------------------------------------------------------------
async function getCountryIdByAbbr(countryAbbreviation) {
  const { id: countryId } =
    (await query('Get country id by abbreviation')
      .from('Country')
      .where('abbreviation', countryAbbreviation)
      .first('id')) || {}
  return countryId
}

async function getCreateGeographyIdByGxGeo(knex, { countryAbbreviation, stateName, stateAbbreviation, lgaName }) {
  const countryId = await getCountryIdByAbbr(countryAbbreviation)

  // exit if country is unknown
  if (!countryId) {
    return null
  }

  // check if geography for country exists
  let d = { countryId, stateId: null, lgaId: null }
  let { id: geographyId } = (await knex.from('Geography').where(d).first('id')) || {}
  // create if not exist
  if (!geographyId) {
    // we do not need to get geographyId here - will do it after processing state and lga
    await knex('Geography').insert(d)
  }

  // check if geography for state exists
  let stateId = null
  if (stateName) {
    // get state which has Geography - inner join
    const state = await knex('State as s')
      .innerJoin('Geography as g', 's.id', 'g.stateId')
      .where(function () {
        this.where('s.name', stateName).orWhere('s.abbreviation', stateAbbreviation)
      })
      .where('g.countryId', countryId) // for this country
      .whereNull('g.lgaId') // lgaId must be null
      .first('s.id')
    if (state) {
      stateId = state.id
    } else {
      // insert State
      d = { name: stateName, abbreviation: stateAbbreviation }
      ;[stateId] = await knex('State').insert(d)
      // insert Geography for this state
      d = { countryId, stateId, lgaId: null }
      await knex('Geography').insert(d)
    }
  }

  // check if geography for lga exists
  let lgaId = null
  if (lgaName) {
    // get lga which has Geography - inner join
    d = { 'g.countryId': countryId, 'g.stateId': stateId, 'l.name': lgaName }
    const lga = await knex.from('Lga as l').innerJoin('Geography as g', 'l.id', 'g.lgaId').where(d).first('l.id')

    if (lga) {
      lgaId = lga.id
    } else {
      // insert Lga
      ;[lgaId] = await knex('Lga').insert({ name: lgaName })
      // insert missing Geography for this lga
      d = { countryId, stateId, lgaId }
      await knex('Geography').insert(d)
    }
  }

  // finally - get geography
  const geo = await knex.from('Geography').where({ countryId, stateId, lgaId }).first('id')

  // if not found - create it
  if (!geo) {
    ;[geographyId] = await knex('Geography').insert({
      countryId,
      stateId,
      lgaId,
    })
  } else {
    geographyId = geo.id
  }

  return geographyId
}

async function updateTagsForPerson(knex, { partnerId, personId, tagTitles = [] }) {
  const tagsInDatabase = await knex('Tag').whereIn('title', tagTitles).andWhere('partnerId', partnerId).select()
  const tagsToInsert = _.filter(
    _.uniqBy(tagTitles, tagTitle => tagTitle.toLowerCase()),
    tagTitle => !_.some(tagsInDatabase, tagInDatabase => tagInDatabase.title.toLowerCase() === tagTitle.toLowerCase())
  )
  await Promise.each(
    _.uniqBy(tagsToInsert, tagToInsert => tagToInsert.toLowerCase()),
    async tagToInsert => {
      const [tagId] = await knex('Tag').insert({
        title: tagToInsert,
        partnerId,
      })
      tagsInDatabase.push({
        id: tagId,
        title: tagToInsert,
        partnerId,
      })
    }
  )

  const personTagsInDatabase = await knex('PersonTag').where('personId', personId)
  const tagsToAppendToPerson = _.filter(
    tagsInDatabase,
    tagInDatabase => !_.some(personTagsInDatabase, { tagId: tagInDatabase.id })
  )
  return Promise.map(tagsToAppendToPerson, async tag => knex('PersonTag').insert({ tagId: tag.id, personId }), {
    concurrency: 5,
  })
}

// Aspnet Membership Hash Algorithm
// This method of encryption is used by GxAlert
// Original implementation: https://github.com/mysql/mysql-connector-net/blob/87939c99fdad68b30803e9f4bb115e17cfabb8ce/MySql.Web/src/MembershipProvider.cs#L1474
const gxAlertHashPassword = (password, passwordKey) => {
  const passwordBytes = Buffer.from(password, 'utf16le') // Encoding in 'utf16le' to match C# Unicode
  const keyBytes = Buffer.from(passwordKey, 'base64')
  const keyedBytes = Buffer.concat([keyBytes, passwordBytes])

  return createHmac('sha256', keyBytes).update(keyedBytes).digest('base64')
}

module.exports = {
  gxAlertAuthenticate,
  GxAlertLoginError,
  gxAlertHashPassword,
}
