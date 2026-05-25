const _ = require('lodash')
const Boom = require('@hapi/boom')
const bcrypt = require('bcrypt')
const addMinutes = require('date-fns/addMinutes')
const { promisify } = require('util')

const { knex, filterParams, sortPageParams } = require('../db')
const { getCellsByValue, generateExcelFile, generateCsvFile } = require('../shared/io')
const { randomToken, groupToken } = require('../deviceApi/apiKey')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { getDateTimeProjectionInTimeZoneIANA } = require('../shared/date')

const bcryptCompare = promisify(bcrypt.compare)

async function listDeviceApiKeys(request) {
  const { query, auth } = request
  const { timezoneIANA } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)

  const dakQuery = knex('DeviceApiKey as dak')
    .leftJoin('Partner as p', 'dak.partnerId', 'p.id')
    .leftJoin('Geography as g', 'dak.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
    .leftJoin('Site as s', 'dak.siteId', 's.id')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      partnerId: 'dak.partnerId',
      siteName: 's.name',
      deviceName: 'd.name',
      revoked: 'dak.revoked',
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      partner: 'p',
      site: 's',
    })

  // get total count for paging
  const getCount = dakQuery.clone().count('dak.id as count').first()

  // get rows
  const getItems = dakQuery
    .clone()
    .modify(sortPageParams, query, 'createdOn')
    .orderBy('dak.id', 'desc') // second sort param to make the query deterministic
    .select([
      'dak.id',
      getDateTimeProjectionInTimeZoneIANA(knex, 'dak.createdOn', timezoneIANA, 'createdOn'),
      'dak.token',
      'dak.revoked',
      'p.name as partner',
      'p.id as partnerId',
      'c.name as country',
      'c.id as countryId',
      's.name as site',
      's.id as siteId',
      'd.name as device',
      'd.id as deviceId',
    ])
    .then(items => items.map(item => ({ ...item, token: groupToken(item.token) })))

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function createDeviceApiKey(request) {
  const { auth } = request
  const now = new Date()
  const user = await knex('Person as p')
    .join('User as u', 'u.id', 'p.userId')
    .where('u.name', auth.credentials.name)
    .first('u.id', 'p.lastPartnerId as partnerId', 'p.geographyId')
  if (user == null || user.partnerId == null) {
    return Boom.badRequest('Cannot find partner for user')
  }

  const apiKey = { token: randomToken() }
  await knex('DeviceApiKey').insert({
    token: apiKey.token,
    revoked: 0,
    geographyId: user.geographyId,
    partnerId: user.partnerId,
    createdOn: now,
    createdBy: user.id,
    updatedOn: now,
    updatedBy: user.id,
  })
  return apiKey
}

async function exportDeviceApiKeys(request) {
  const { query } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = await listDeviceApiKeys(request)

  let result = null

  if (query.format === 'excel') {
    // fill in data into given workbook
    const populateData = workbook => {
      // get 1st sheet (1-based)
      const worksheet = workbook.getWorksheet(1)

      // locate cell(s) with needed value
      const cells = getCellsByValue(worksheet, '<DeviceApiKeyListRows>')
      if (cells.length > 0) {
        // empty such cells
        cells.forEach(cell => {
          cell.value = ''
        })

        // use 1st cell only (actually, should not be more than one)
        const patternRowNumber = cells[0].row + 2

        // fill in array 'rows'
        const rows = devices.data.map(dak => [
          // ------
          // --->>> order of array elements should match columns order in template file
          // ------
          dak.createdOn,
          dak.token,
          dak.partner,
          dak.country,
          dak.site,
          dak.device,
          dak.revoked,
        ])

        // insert rows from patternRowNumber, and remove row number 'patternRowNumber'
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      }
    }

    result = await generateExcelFile({
      templateFileName: 'DeviceApiKeys.xlsx',
      outputFileName: 'deviceApiKeys.xlsx',
      populateData,
    })
  } else if (query.format === 'csv') {
    const items = devices.data
    const columnNames = ['Created On', 'Key', 'Partner', 'Country', 'Site', 'Device', 'Revoked']
    const fieldNames = ['createdOn', 'token', 'partner', 'country', 'site', 'device', 'revoked']
    result = await generateCsvFile('deviceApiKeys.csv', items, columnNames, fieldNames)
  }

  return result
}

async function generateDeviceApiKeys(request) {
  const { auth, payload } = request

  let geographyId
  if (payload.countryId) {
    ;({ id: geographyId } = await knex('Geography as g')
      .where({
        'g.countryId': payload.countryId,
        'g.stateId': null,
        'g.lgaId': null,
      })
      .first('id'))
  }

  const now = new Date()
  const currentlyLoggedInUser = await getUser(auth.credentials.name)

  const deviceApiKeys = _.times(payload.count).map(() => ({
    token: randomToken(),
    revoked: 0,
    geographyId,
    siteId: payload.siteId,
    partnerId: payload.partnerId,
    createdOn: now,
    createdBy: currentlyLoggedInUser.id,
    updatedOn: now,
    updatedBy: currentlyLoggedInUser.id,
  }))

  await knex('DeviceApiKey').insert(deviceApiKeys)

  const result = { ok: true }

  return result
}

async function assignDeviceApiKeys(request) {
  const { auth, payload } = request

  let geographyId
  if (payload.countryId) {
    ;({ id: geographyId } = await knex('Geography as g')
      .where({
        'g.countryId': payload.countryId,
        'g.stateId': null,
        'g.lgaId': null,
      })
      .first('id'))
  }

  const now = new Date()
  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const assignableDeviceApiKeyIds = await knex('DeviceApiKey as dak')
    .whereIn('dak.id', payload.deviceApiKeyIds)
    .modify(qb => {
      if (payload.deviceId) {
        qb.whereNotIn(
          'dak.id',
          knex('Device as d')
            .whereNot('d.id', payload.deviceId)
            .whereNotNull('d.deviceApiKeyId')
            .select('d.deviceApiKeyId')
        )
      }
    })
    .pluck('dak.id')

  if (payload.deviceId) {
    // If deviceId is set, we need to ensure that only one key is assigned to the device
    if (payload.deviceApiKeyIds.length > 1) throw new Error('When deviceId is set, only one key can be assigned')

    const [selectedDeviceApiKeyId] = assignableDeviceApiKeyIds
    if (selectedDeviceApiKeyId) {
      const device = await knex('Device').where('id', payload.deviceId).first('deviceApiKeyId')
      if (device?.deviceApiKeyId && device.deviceApiKeyId !== selectedDeviceApiKeyId) {
        await knex('DeviceApiKey')
          .where('id', device.deviceApiKeyId)
          .update({ revoked: true, updatedOn: now, updatedBy: currentlyLoggedInUser.id })
      }

      await knex('Device')
        .where('id', payload.deviceId)
        .update({ deviceApiKeyId: selectedDeviceApiKeyId, updatedOn: now, updatedBy: currentlyLoggedInUser.id })
    }
  }

  await knex('DeviceApiKey as dak').whereIn('dak.id', assignableDeviceApiKeyIds).update({
    geographyId,
    siteId: payload.siteId,
    partnerId: payload.partnerId,
    updatedOn: now,
    updatedBy: currentlyLoggedInUser.id,
  })

  const result = { ok: true }

  return result
}

async function revokeDeviceApiKey(request) {
  const { params, payload } = request

  const updatedCount = await knex('DeviceApiKey').where('id', params.deviceApiKeyId).update({
    revoked: payload.revoked,
  })

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  return {
    ok: true,
    data: {
      id: params.deviceApiKeyId,
      revoked: payload.revoked,
    },
  }
}

async function lookupUsingCredentials(username, password) {
  const nowTime = new Date().getTime()
  const deviceApiKey = await knex('DeviceApiKey as dak')
    .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
    .where('dak.username', username)
    .first('dak.*', 'd.id as deviceId')
  const pwResult = deviceApiKey
    ? await bcryptCompare(password, _.get(deviceApiKey, 'password')).catch(() => false)
    : false
  if (!deviceApiKey || !pwResult) {
    return {
      authenticated: false,
      reason: 'invalid',
      data: deviceApiKey,
    }
  }
  if (deviceApiKey.revoked) {
    return {
      authenticated: false,
      reason: 'revoked',
      data: deviceApiKey,
    }
  }
  if (deviceApiKey.expiresOn < nowTime) {
    const newToken = randomToken()
    const newExpiresOn = addMinutes(new Date(), 15)
    deviceApiKey.token = newToken
    deviceApiKey.expiresOn = newExpiresOn
    await knex('DeviceApiKey').where('id', deviceApiKey.id).update({
      token: newToken,
      expiresOn: newExpiresOn,
    })
  }
  return {
    authenticated: true,
    data: deviceApiKey,
  }
}

module.exports = {
  listDeviceApiKeys,
  exportDeviceApiKeys,
  generateDeviceApiKeys,
  createDeviceApiKey,
  assignDeviceApiKeys,
  revokeDeviceApiKey,
  lookupUsingCredentials,
}
