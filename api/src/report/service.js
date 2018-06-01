const _ = require('lodash')
const Boom = require('boom')
const { createFetch, base, method, params } = require('http-client')
require('isomorphic-fetch')

const config = require('../config')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listReports(request) {
  const { query } = request

  const data = _.sortBy(
    [
      {
        id: 1,
        deploymentName: 'PIH Lilongwe',
        moduleSerial: 998533,
        dateOfError: '2016-03-12',
        error: '401',
        totalTestsRun: 2030,
        totalErrors: 7,
      },
      {
        id: 2,
        deploymentName: 'Harare National Lab',
        moduleSerial: 585845,
        dateOfError: '2015-10-28',
        error: '5007',
        totalTestsRun: 661,
        totalErrors: 2,
      },
      {
        id: 3,
        deploymentName: 'Kenyatta National Hospital',
        moduleSerial: 904834,
        dateOfError: '2015-11-19',
        error: '5000',
        totalTestsRun: 5810,
        totalErrors: 56,
      },
      {
        id: 4,
        deploymentName: 'Akron Labs',
        moduleSerial: 857673,
        dateOfError: '2015-05-20',
        error: '8000',
        totalTestsRun: 661,
        totalErrors: 23,
      },
      {
        id: 5,
        deploymentName: 'Kampala National Lab',
        moduleSerial: 233341,
        dateOfError: '2016-04-22',
        error: '8080',
        totalTestsRun: 1210,
        totalErrors: 12,
      },
      {
        id: 6,
        deploymentName: 'Eldoret Regional Lab',
        moduleSerial: 128533,
        dateOfError: '2016-09-17',
        error: '501',
        totalTestsRun: 661,
        totalErrors: 5,
      },
      {
        id: 7,
        deploymentName: 'Arusha Regiional Lab',
        moduleSerial: 618601,
        dateOfError: '2016-12-23',
        error: '504',
        totalTestsRun: 378,
        totalErrors: 2,
      },
      {
        id: 8,
        deploymentName: 'Maputo National Lab',
        moduleSerial: 354601,
        dateOfError: '2014-01-07',
        error: '7001',
        totalTestsRun: 2315,
        totalErrors: 17,
      },
      {
        id: 9,
        deploymentName: 'Accra National Lab',
        moduleSerial: 499501,
        dateOfError: '2016-05-01',
        error: '2020',
        totalTestsRun: 65,
        totalErrors: 1,
      },
      {
        id: 10,
        deploymentName: 'Manila National Lab',
        moduleSerial: 134353,
        dateOfError: '2017-06-15',
        error: '5001',
        totalTestsRun: 4321,
        totalErrors: 79,
      },
      {
        id: 11,
        deploymentName: 'Jakarta National Lab',
        moduleSerial: 234533,
        dateOfError: '2013-04-09',
        error: '5019',
        totalTestsRun: 991,
        totalErrors: 43,
      },
      {
        id: 12,
        deploymentName: 'Mahindra Regional Lab',
        moduleSerial: 618601,
        dateOfError: '2012-10-30',
        error: '4884',
        totalTestsRun: 2388,
        totalErrors: 29,
      },
      {
        id: 13,
        deploymentName: 'Bombay Regional Lab',
        moduleSerial: 618533,
        dateOfError: '2016-01-29',
        error: '2442',
        totalTestsRun: 1838,
        totalErrors: 13,
      },
    ],
    query.sortCol || _.identity
  )

  const total = data.length

  const result = { ok: true, total, data, length: data.length }

  return result
}

function proxyGxReport(request, reply) {
  return proxyGxReportAsync(request)
    .then(resp => reply(resp.body))
    .catch(err => reply(err))
}

async function proxyGxReportAsync(request) {
  const { auth } = request
  const { reportName } = request.params
  const { stateName, deviceName, dateFrom, dateTo } = request.query

  const dataConstraints = await getConstraints(auth.credentials)
  if (stateName == null) {
    throw new Boom.badRequest('State name is required')
  }

  const hasStateAccess = await knex('Geography as g')
    .join('State as st', 'g.stateId', 'st.id')
    .modify(addConstraints, dataConstraints, { geography: 'g', state: 'st' })
  if (hasStateAccess == null) {
    throw Boom.unauthorized(`Cannot access state ${stateName}`)
  }

  if (deviceName != null) {
    const hasDeviceAccess = await knex('Device as d')
      .modify(addConstraints, dataConstraints, { device: 'd' })
      .where({ 'd.name': deviceName })
      .first('d.id')
    if (hasDeviceAccess == null) {
      throw Boom.unauthorized(`Cannot access device ${deviceName}`)
    }
  }

  const baseUrl = config.gxAlertApi.replace(/\/api.*$/, '/remotereport/')
  const pw = 'u50GUh3u3bA5jr3IHLJrmG2l'

  const gxParams = {
    pw,
    stateName,
    deviceName,
    dateFrom,
    dateTo,
  }
  const gxFetch = createFetch(method('GET'), base(baseUrl), params(gxParams))
  return gxFetch(reportName)
}

module.exports = {
  listReports,
  proxyGxReport,
}
