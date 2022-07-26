module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

async function seed(knex) {
  const manager = await knex('JobFunction as jf').where('jf.externalId', 'manager').first()

  const checkIfExist = async activity => {
    if (activity) {
      const permission = await knex('JobFunctionPermission')
        .where({
          jobFunctionId: manager.id,
          permissionId: activity.id,
        })
        .first()

      if (permission && permission.id) {
        return true
      }
    }

    return false
  }

  const deletePermission = async permissionId => {
    if (permissionId) {
      await knex('JobFunctionPermission')
        .where({
          jobFunctionId: manager.id,
          permissionId: permissionId.id,
        })
        .del()
    }
  }

  const permission = [
    { module: 'treatmentStatus', activity: 'edit' },
    { module: 'dashboard', activity: 'result' },
    { module: 'clinicalIndicators', activity: 'view' },
  ]

  if (manager.id) {
    await Promise.each(permission, async eachPermission => {
      const permissionQuery = await knex('Permission as p')
        .where({
          module: eachPermission.module,
          activity: eachPermission.activity,
        })
        .first()

      // check if the permission exist
      if (checkIfExist(permissionQuery)) {
        deletePermission(permissionQuery)
      }
    })
  }
}
