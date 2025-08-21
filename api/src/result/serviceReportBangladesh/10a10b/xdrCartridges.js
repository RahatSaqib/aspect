const { endOfMonth, startOfMonth, subMonths } = require('date-fns')
const dateFormat = require('date-fns/format')

const { getUser } = require('../../auth/service')
const { addConstraints, getConstraints } = require('../../auth/constraints')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../../db')
const { getDeviceInfo } = require('../../device/common/db')
const { getDatesFromQuery } = require('../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../shared/dictionary')
const { convertCsvToArrayOfNumbers } = require('../../shared/string')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const { createFormObject } = require('../../forms/service')

async function getXdrCartridgesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  
}

module.exports = {
  getXdrCartridgesReport,
}
