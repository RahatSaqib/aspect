const Promise = require('bluebird')

const partnerData = require('./fixtures/partnerData')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { deviceCapacity, partnerName } = partnerData
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')

  const { deviceTypeToId } = require('../../src/shared/dictionary')

  /**
   * process each item in deviceCapacity array
   */
  await Promise.each(deviceCapacity, async ({ deviceTypeExternalId, modules }) => {
    const deviceTypeId = await deviceTypeToId(deviceTypeExternalId)
    // for active partnerId and specified deviceType get existing items from table DeviceCapacity
    const existingModules = await knex('DeviceCapacity')
      .where({ partnerId, deviceTypeId })
      .whereNotNull('modules')
      .pluck('modules')
    const modulesToInsert = modules.filter(numberOfModules => !existingModules.includes(numberOfModules))

    return Promise.each(modulesToInsert, async numberOfModules => {
      return knex('DeviceCapacity').insert({
        deviceTypeId,
        partnerId,
        name: `${numberOfModules} module${numberOfModules === 1 ? '' : 's'}`,
        dailyCapacity: 3 * numberOfModules,
        modules: numberOfModules,
        externalId: `deviceCapacityModules${numberOfModules}`,
        i18nKey: `deviceCapacityModules${numberOfModules}`,
      })
    })
  })
}
