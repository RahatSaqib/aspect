const Promise = require('bluebird')

exports.up = async function (knex) {
  await knex.schema.alterTable('DeviceCapacity', t => {
    t.integer('modules').unsigned().index()
    t.string('externalId').index()
    t.string('i18nKey')
  })

  /**
   * update existing items when `migration` runs in live system
   */
  const items = await knex('DeviceCapacity').select('*')
  await Promise.each(items, async it => {
    if (!it.modules) {
      const modules = Math.round(it.dailyCapacity / 3)
      const externalId = `deviceCapacityModules${modules}`
      const i18nKey = `deviceCapacityModules${modules}`
      return knex('DeviceCapacity')
        .update({
          modules,
          externalId,
          i18nKey,
        })
        .where('id', it.id)
    }
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('DeviceCapacity', t => {
    t.dropColumn('modules')
    t.dropColumn('externalId')
    t.dropColumn('i18nKey')
  })
}
