const _ = require('lodash')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const items = await knex('DeviceCapacity').select(['id', 'name', 'modules'])

  await Promise.all(
    _.map(items, async ({ id, name, modules }) => {
      const [numModules, wordModules] = name.split(' ')
      if (wordModules === 'modules') {
        return knex('DeviceCapacity')
          .update({
            modules: numModules,
            externalId: `deviceCapacityModules${numModules}`,
            i18nKey: `deviceCapacityModules${numModules}`,
          })
          .where({ id })
      }
      if (name === 'BD MGIT') {
        modules = modules || 8
        return knex('DeviceCapacity')
          .update({
            modules,
            externalId: `deviceCapacityModules${modules}MGIT`,
            i18nKey: `deviceCapacityModules${modules}MGIT`,
          })
          .where({ id })
      }
    })
  )
}
