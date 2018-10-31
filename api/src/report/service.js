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
    .then(resp =>
      reply(resp.body)
        .header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .header(
          'Content-Disposition',
          `attachment; filename="${request.params.reportName}.xlsx"`
        )
    )
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      reply(err)
    })
}

async function proxyGxReportAsync(request) {
  const { auth } = request
  const { reportName } = request.params
  const { siteId, dateFrom, dateTo } = request.query

  const baseUrl = config.gxAlertApi.replace(/\/api.*$/, '/remotereport/')
  const pw = 'u50GUh3u3bA5jr3IHLJrmG2l'

  const dataConstraints = await getConstraints(auth.credentials)

  // check if user is admin and they should be able to download report even if assigned to more than one state
  const { jobFunctionName } = await knex('JobFunction as jf')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({
      'ps.id': dataConstraints.person.id,
      'jf.partnerId': dataConstraints.partner.id,
    })
    .first('jf.name as jobFunctionName')
  const isAdmin = jobFunctionName === 'Admin'

  const sitesQ = knex('Site as s')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('State as st', 'g.stateId', 'st.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      state: 'st',
    })
    .distinct('st.name as stateName', 's.name as siteName')
  if (siteId != null && siteId !== '' && siteId !== 'null') {
    sitesQ.where('s.id', parseInt(siteId, 10))
  }
  const sites = await sitesQ

  const stateNames = _.uniq(_.map(sites, 'stateName'))
  const siteNames = _.uniq(_.map(sites, 'siteName'))
  if (stateNames.length !== 1 && !isAdmin) {
    throw Boom.badRequest(
      'Cannot find single assigned state for logged in user'
    )
  }
  const [stateName] = stateNames.length === 1 ? stateNames : []
  const [deviceName] = siteNames.length === 1 ? siteNames : []

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
