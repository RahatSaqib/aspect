const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const { knex } = require('../db')

const { getUser } = require('../auth/service')
const { getReportDetails, listReports } = require('./service')
const {
  exportData,
  getBaseReplacements,
  renderExcelTemplate,
  respondFile,
} = require('../shared/excel')
const { formatDateOrDefault } = require('../shared/date')

// ----------------------------------------------------------------------------------------------
async function getSheetData(request, sheet) {
  const { auth } = request
  const { moduleName, functionName } = sheet
  const query = {
    // filters defined on Reports page
    ...request.query,
    // make sure to report all results (up to 1 million records)
    page: 0,
    size: 999999,
    // specific params for endpoint from ReportSheet table, i.e. sortCol, sortDir
    ...sheet.query,
  }

  if (!moduleName || !functionName) {
    return Boom.preconditionFailed(
      `Both moduleName ('${moduleName}') and functionName ('${functionName}') are required`
    )
  }

  let endpointModule
  try {
    endpointModule = require(`../${moduleName}`) //eslint-disable-line
  } catch (error) {
    return Boom.preconditionFailed(
      `Can not load module ${moduleName}: ${error.toString()}`
    )
  }

  const dataFunc = endpointModule[functionName]
  if (!dataFunc) {
    return Boom.preconditionFailed(
      `Can not find function ${functionName} in module ${moduleName}`
    )
  }
  const result = await dataFunc(auth, query)
  const {
    ok,
    data,
    errorMessage,
    dynamicColumns = {},
    dataSelector = null,
  } = result
  if (ok) {
    return { data, dynamicColumns, dataSelector }
  }

  return Boom.preconditionFailed(
    `Error in function ${functionName} of module ${moduleName} - ${errorMessage}`
  )
}

// ----------------------------------------------------------------------------------------------
function getDateRangeString({ minDate, maxDate }) {
  if (!minDate && !maxDate) {
    return 'all'
  }
  const dates = []
  if (minDate) {
    dates.push(minDate ? formatDateOrDefault(minDate) : '')
  }
  dates.push(' — ') // long dash
  if (maxDate) {
    dates.push(maxDate ? formatDateOrDefault(maxDate) : '')
  }
  return dates.join('')
}

// ----------------------------------------------------------------------------------------------
async function getStateNames({ countryId, stateId }) {
  if (!countryId || !stateId) {
    return 'all'
  }
  const { name } = await knex('Geography as g')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('g.countryId', countryId)
    .where('st.id', stateId)
    .first('st.name')
  return name
}

// ----------------------------------------------------------------------------------------------
async function getLgaNamesString({ countryId, stateId, lgaId }) {
  if (!countryId || !stateId) {
    return 'all'
  }
  const items = await knex('Geography as g')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('g.countryId', countryId)
    .where('st.id', stateId)
    .whereNotNull('g.lgaId')
    .where(builder => {
      if (lgaId) {
        builder.where('l.id', lgaId)
      }
    })
    .orderBy('l.name')
    .select('l.name')
  return items.map(x => x.name).join(', ')
}

async function getAllSheetsData(request, sheets) {
  let boomError
  const data = []
  // process all sheets
  await Promise.each(sheets, async (sheet, sheetIndex) => {
    if (!sheet || boomError) return

    // get data for this sheet
    const {
      data: dataRows,
      dynamicColumns,
      dataSelector = null,
    } = await getSheetData(request, sheet)
    if (Boom.isBoom(dataRows)) {
      boomError = dataRows
      return
    }

    data[sheetIndex] = {
      dataRows,
      dynamicColumns,
      dataSelector,
      // TODO: use i18n string, because `createReport()` uses locale file templates with all labels translated
      defaultNoDataMessage: 'No data',
    }
  })

  if (boomError) {
    return boomError
  }
  return data
}

// ----------------------------------------------------------------------------------------------
async function createReport(request, reply) {
  const { auth, query, params } = request
  const { externalId, templateFolderPath } = params
  const { sheets, fileName } = await getReportDetails(auth, externalId)
  const { culture } = await getUser(auth.credentials.name)

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const extension = query.format || 'xlsx'

  const data = await getAllSheetsData(request, sheets)
  if (Boom.isBoom(data)) {
    throw data
  }
  const dataBuffer = await renderExcelTemplate({
    culture,
    templateFolderPath: templateFolderPath || externalId,
    data,
    extension,
    replacements: [
      {
        placeholder: '<Dates>',
        value: getDateRangeString(query),
      },
      {
        placeholder: '<States>',
        value: await getStateNames(query),
      },
      {
        placeholder: '<Lgas>',
        value: await getLgaNamesString(query),
      },
    ],
  })

  return respondFile({
    dataBuffer,
    extension,
    fileNamePrefix: fileName,
    reply,
  })
}

// ----------------------------------------------------------------------------------------------
async function exportReports(request, reply) {
  const { data } = await listReports(request)
  const sheetData = {
    dataRows: data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return exportData(request, reply, sheetData, 'reports', {
    replacements: getBaseReplacements(),
  })
}
module.exports = {
  createReport,
  exportReports,
}
