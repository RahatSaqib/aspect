const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')

const { knex, filterParams, sortPageParams } = require('../db')
const { getCellsByValue, generateExcelFile, generateCsvFile } = require('../shared/io')
const { randomToken, groupToken } = require('../deviceApi/apiKey')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')

const SELECT_LIST_FIELDS = [
  'dak.id', 'dak.createdOn', 'dak.token', 'dak.revoked',
  'p.name as partner',
  'c.name as country',
  's.name as site',
  'd.name as device',
]

function* listDeviceApiKeys(request) {
  const { query, auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const dakQuery = knex('DeviceApiKey as dak')
    .leftJoin('Partner as p', 'dak.partnerId', 'p.id')
    .leftJoin('Geography as g', 'dak.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Site as s', 'dak.siteId', 's.id')
    .leftJoin('Device as d', 'dak.deviceId', 'd.id')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      partnerId: 'dak.partnerId',
      siteName: 's.name',
      deviceName: 'd.name'
    })
    .modify(addConstraints, dataConstraints, {
      partner: 'p',
      country: 'c',
      site: 's',
      device: 'd'
    })

  // get total count for paging
  const getCount = dakQuery.clone()
    .count('dak.id as count')
    .first()

  // get rows
  const getItems = dakQuery.clone()
    .modify(sortPageParams, query, 'createdOn')
    .orderBy('dak.id', 'desc') // second sort param to make the query deterministic
    .select(SELECT_LIST_FIELDS)
    .map(dak => _.assign({}, dak, {
      token: groupToken(dak.token)
    }))

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function* exportDeviceApiKeys(request) {
  const { query } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = yield* listDeviceApiKeys(request)

  let result = null

  if (query.format === 'excel') {
    // fill in data into given workbook
    const populateData = (workbook) => {
      // get 1st sheet (1-based)
      const worksheet = workbook.getWorksheet(1)

      // locate cell(s) with needed value
      const cells = getCellsByValue(worksheet, '<DeviceApiKeyListRows>')
      if (cells.length > 0) {
        // empty such cells
        cells.forEach((cell) => { cell.value = '' })

        // use 1st cell only (actually, should not be more than one)
        const patternRowNumber = cells[0].row + 2

        // fill in array 'rows'
        const rows = devices.data.map(dak => ([
          // ------
          // --->>> order of array elements should match columns order in template file
          // ------
          dak.createdOn,
          dak.token,
          dak.partner,
          dak.country,
          dak.site,
          dak.device,
          dak.revoked
        ]))

        // insert rows from patternRowNumber, and remove row number 'patternRowNumber'
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      }
    }

    result = yield* generateExcelFile({
      templateFileName: 'DeviceApiKeys.xlsx',
      outputFileName: 'deviceApiKeys.xlsx',
      populateData
    })
  } else if (query.format === 'csv') {
    const items = devices.data
    const columnNames = ['Created On', 'Key', 'Partner', 'Country', 'Site', 'Device', 'Revoked']
    const fieldNames = ['createdOn', 'token', 'partner', 'country', 'site', 'device', 'revoked']
    result = yield* generateCsvFile('deviceApiKeys.csv', items, columnNames, fieldNames)
  }

  return result
}

function* generateDeviceApiKeys(request) {
  const { auth, payload } = request

  let geographyId
  if (payload.countryId) {
    ({ id: geographyId } = yield knex('Geography as g')
      .where({
        'g.countryId': payload.countryId,
        'g.stateId': null,
        'g.lgaId': null
      })
      .first('id'))
  }

  const now = new Date()
  const currentlyLoggedInUser = yield getUser(auth.credentials.name)

  const deviceApiKeys = _.times(payload.count).map(() => ({
    token: randomToken(),
    revoked: 0,
    geographyId,
    siteId: payload.siteId,
    partnerId: payload.partnerId,
    createdOn: now,
    createdBy: currentlyLoggedInUser.id,
    updatedOn: now,
    updatedBy: currentlyLoggedInUser.id
  }))

  yield knex('DeviceApiKey').insert(deviceApiKeys)

  const result = { ok: true }

  return result
}

function* assignDeviceApiKeys(request) {
  const { auth, payload } = request

  let geographyId
  if (payload.countryId) {
    ({ id: geographyId } = yield knex('Geography as g')
      .where({
        'g.countryId': payload.countryId,
        'g.stateId': null,
        'g.lgaId': null
      })
      .first('id'))
  }

  const now = new Date()
  const currentlyLoggedInUser = yield getUser(auth.credentials.name)

  yield knex('DeviceApiKey as dak')
    .whereIn('dak.id', payload.deviceApiKeyIds)
    .whereNull('dak.deviceId') // Ensure only assign to a device ONCE
    .update({
      geographyId,
      siteId: payload.siteId,
      partnerId: payload.partnerId,
      deviceId: payload.deviceId,
      updatedOn: now,
      updatedBy: currentlyLoggedInUser.id
    })

  const result = { ok: true }

  return result
}

function* revokeDeviceApiKey(request) {
  const { params, payload } = request

  const updatedCount = yield knex('DeviceApiKey')
    .where('id', params.deviceApiKeyId)
    .update({
      revoked: payload.revoked
    })

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  return {
    ok: true,
    data: {
      id: params.deviceApiKeyId,
      revoked: payload.revoked
    }
  }
}

module.exports = {
  listDeviceApiKeys,
  exportDeviceApiKeys,
  generateDeviceApiKeys,
  assignDeviceApiKeys,
  revokeDeviceApiKey
}
