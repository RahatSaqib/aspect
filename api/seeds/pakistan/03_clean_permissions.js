module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const { removePermissions, getPermissionModules } = require('../utils')
const unneededPermissions = require('./fixtures/permissionsToRemove.json')

async function seed(knex) {
  const modules = await getPermissionModules(knex)

  await Promise.each(unneededPermissions, permission =>
    removePermissions(knex, [modules[permission.module][permission.activity]])
  )
}
