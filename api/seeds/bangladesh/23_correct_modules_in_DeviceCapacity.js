module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const items = await knex('DeviceCapacity').select('*')
  const sql = []
  items.forEach(({ id, name, modules }) => {
    const [numModules, wordModules] = name.split(' ')
    if (wordModules === 'modules') {
      sql.push(
        `
        UPDATE DeviceCapacity 
        SET 
            modules=${numModules},
            externalId = 'deviceCapacityModules${numModules}', 
            i18nKey = 'deviceCapacityModules${numModules}' 
        WHERE id = ${id};`
      )
    } else if (name === 'BD MGIT') {
      sql.push(
        `
        UPDATE DeviceCapacity
        SET 
            externalId = 'deviceCapacityModules8MGIT', 
            i18nKey = 'deviceCapacityModules${modules}MGIT' 
        WHERE id = ${id};
        `
      )
    }
  })

  await knex.raw(sql.join(''))
}
