const { addConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const { knex } = require('../../db')

async function getPartnerByConstraints(dataConstraints) {
  const partner = knex('Partner as p')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .first([
      'name',
      'maxDaysDeviceOffline',
      'maxDaysDeviceNoResults',
      'dueDaysInventoryStockout',
      'dueDaysInventoryStockExpiring',
      'hoursNotificationsShouldWaitForCustomFields',
      'daysLimitToNotifyResults',
      'serverUrl',
      'apiUrl',
      'dueDaysCalibrationIssue',
      'inventoryAdjustment',
      'inventoryStrategy',
    ])

  return partner
}

const getPartnerWorkingDaysConfig = async auth => {
  const { partnerId } = await getUser(auth.credentials.name)
  const partnerConfig = (await knex('Partner').select('customWorkingDays').where('id', partnerId).first()) || {}

  return partnerConfig.customWorkingDays ? JSON.parse(partnerConfig.customWorkingDays) : {}
}

module.exports = { getPartnerByConstraints, getPartnerWorkingDaysConfig }
