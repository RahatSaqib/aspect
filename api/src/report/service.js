const { promises: fsPromises } = require('fs')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const { createFetch, base, method, params } = require('http-client')
require('isomorphic-fetch')
const Promise = require('bluebird')

const config = require('../config')
const { filterParams, knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const logger = require('../shared/logger')
const { getAllAsyncReportsForUser } = require('../shared/report')

const { asyncReportStatusToId } = require('../shared/dictionary')
const { LEGACY_REPORT_PARAMETERS } = require('./params')

// Rows still holding the migration backfill '[]' (envs not yet reseeded) behave exactly
// like the legacy filter set — deploy and reseed can happen in any order under strict mode.
const parseReportParameters = raw => {
  const parsed = raw ? JSON.parse(raw) : []
  return parsed.length ? parsed : LEGACY_REPORT_PARAMETERS
}

async function getReports(request) {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const reportsQuery = knex('Report as r')
    .innerJoin('JobFunctionReport as jfr', 'r.id', 'jfr.reportId')
    .innerJoin('JobFunction as jf', 'jf.id', 'jfr.jobFunctionId')
    .innerJoin('JobContext as jc', 'jf.id', 'jc.jobFunctionId')
    .innerJoin('Person as p', 'jc.personId', 'p.id')
    .modify(addConstraints, dataConstraints, { person: 'p' })

  const getCount = reportsQuery.clone().count('r.id as count').first()
  const getItems = reportsQuery
    .clone()
    .modify(filterParams, query, {
      availableForNotification: 'r.availableForNotification',
      reportName: (queryBuilder, value) => {
        queryBuilder.whereRaw(
          `(
            r.name LIKE CONCAT('%', ?, '%')
            OR
            r.description LIKE CONCAT('%', ?, '%')
          )`,
          [value, value]
        )
      },
    })
    .orderBy('r.sortOrder', 'asc')
    .distinct(
      'r.name',
      'r.description',
      'r.externalId',
      'r.sortOrder',
      'r.i18nKey',
      'r.i18nKeyDescription',
      'r.exportExcel',
      'r.exportCsv',
      'r.validations',
      'r.parameters'
    )

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return {
    ok: true,
    total,
    data: data.map(r => ({
      ...r,
      validations: JSON.parse(r.validations),
      parameters: parseReportParameters(r.parameters),
    })),
  }
}

async function getReportDetails(externalId, dataConstraints) {
  if ((await knex('Report').where({ externalId }).first()) === null)
    throw Boom.badRequest('The requested report does not exist')

  const report = await knex('Report as r')
    .innerJoin('JobFunctionReport as jfr', 'r.id', 'jfr.reportId')
    .innerJoin('JobContext as jc', 'jfr.jobFunctionId', 'jc.jobFunctionId')
    .innerJoin('Person as p', 'jc.personId', 'p.id')
    .modify(addConstraints, dataConstraints, { person: 'p' })
    .where('r.externalId', externalId)
    .select(
      'r.description',
      'r.externalId',
      knex.raw('IFNULL(jfr.fileName, r.fileName) as fileNamePrefix'),
      'r.id',
      'r.i18nKey',
      'r.name',
      'r.exportCsv',
      'r.exportExcel',
      'r.parameters'
    )
    .first()

  if (!report) throw Boom.forbidden("You don't have access to the requested report")

  report.parameters = parseReportParameters(report.parameters)

  report.sheets = await knex('ReportSheet')
    .where('reportId', report.id)
    .orderBy('sortOrder', 'asc')
    .select('id', 'moduleName', 'functionName', 'query')
    .then(items =>
      items.map(sheet => ({
        ...sheet,
        query: sheet.query ? JSON.parse(sheet.query) : {},
      }))
    )

  return report
}

function proxyGxReport(request, reply) {
  return proxyGxReportAsync(request)
    .then(resp => {
      reply(resp.body)
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .header('Content-Disposition', `attachment; filename="${request.params.reportName}.xlsx"`)
    })
    .catch(err => {
      logger.error(err)
      throw err
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
    .innerJoin('JobContext as jc', 'jc.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'jc.personId', 'ps.id')
    .where({
      'ps.id': dataConstraints.person.id,
      'jf.partnerId': dataConstraints.partner.id,
    })
    .first('jf.name as jobFunctionName')
  const isAdmin = jobFunctionName === 'Super Admin'

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
    throw Boom.badRequest('Cannot find single assigned state for logged in user')
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

const getAsyncReportRequest = async request => {
  const { query, auth } = request

  const reports = await getAllAsyncReportsForUser(query, auth.credentials.personId)

  return {
    data: reports,
    total: reports.length,
  }
}

const unlinkAsyncReports = async () => {
  const statusId = await asyncReportStatusToId('expired')

  try {
    const now = new Date()
    const reports = await knex('AsyncReport')
      .where('expiresOn', '<', now)
      .andWhereNot('statusId', statusId)
      .select('id', 'filePath')

    await Promise.map(
      reports,
      async report => {
        const { filePath, id } = report
        try {
          await fsPromises.unlink(filePath)
          await knex('AsyncReport').where('id', id).update({ statusId })
        } catch (err) {
          logger.error(`Failed to unlink file: ${filePath}`, err)
        }
      },
      { concurrency: 5 }
    )
  } catch (err) {
    logger.error('Error retrieving or processing reports:', err)
  }
}

const getAsyncReportRequestWithReportsFilter = async request => {
  const { payload, auth } = request

  const reports = await getAllAsyncReportsForUser(payload, auth.credentials.personId)

  return {
    data: reports,
    total: reports.length,
  }
}

module.exports = {
  getReports,
  getReportDetails,
  proxyGxReport,
  getAsyncReportRequest,
  unlinkAsyncReports,
  getAsyncReportRequestWithReportsFilter,
}
