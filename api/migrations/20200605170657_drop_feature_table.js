module.exports = require('../src/db').migration(up, down)
const _ = require('lodash')
const Promise = require('bluebird')
const { allFeatureToId } = require('../src/shared/dictionary')

async function up(knex) {
  const features = await allFeatureToId()
  let permissions = await knex('Permission as p').select('p.module', 'p.activity', 'p.id')

  const missingFeatures = _.differenceWith(
    Object.keys(features),
    permissions,
    (value, other) =>
      `${value}` === `${other.module}` ||
      `dashboard:${value.replace('Dashboard', '')}` === `${other.module}:${other.activity}`
  )

  // this only is going to be executed if there are features inserted, not in an empty db.
  await Promise.each(missingFeatures, async featureKey => {
    // we are migration the unexisting features to a new permission.
    if (_.includes(featureKey.toLowerCase(), 'dashboard')) {
      await knex('Permission').insert({
        module: 'dashboard',
        activity: featureKey.replace('Dashboard', ''),
      })
    } else await knex('Permission').insert([{ module: featureKey, activity: 'view' }])
  })

  // refresh permissions
  permissions = await knex('Permission as p').select('p.module', 'p.activity', 'p.id')

  const permissionToId = id =>
    _.find(permissions, elem => `${elem.module}:${elem.activity}` === `${id.split(':')[0]}:${id.split(':')[1]}`)
  const jobFunctions = await knex('JobFunction').select()

  await Promise.each(jobFunctions, async func => {
    const jobFeature = await knex('JobFunctionFeature as jf')
      .join('Feature as f', 'f.id', 'jf.featureId')
      .where({ jobFunctionId: func.id })
      .select('f.module')
    const jobPermission = await knex('JobFunctionPermission as jf')
      .join('Permission as p', 'p.id', 'jf.permissionId')
      .where({ jobFunctionId: func.id })
      .select('p.module', 'jf.permissionId', 'jf.jobFunctionId')
    const missingFeaturesPerJob = _.differenceWith(
      _.map(jobFeature, elem => elem.module),
      jobPermission,
      (value, other) =>
        `${value}` === `${other.module}` ||
        `dashboard:${value.replace('Dashboard', '')}` === `${other.module}:${other.activity}`
    )

    const permissionsToInsert = []
    await _.each(missingFeaturesPerJob, async elem => {
      const permission =
        (await permissionToId(`dashboard:${elem.replace('Dashboard', '')}`)) || (await permissionToId(`${elem}:view`))
      if (permission)
        permissionsToInsert.push({
          JobFunctionId: func.id,
          permissionId: permission.id,
        })
    })
    await knex('JobFunctionPermission').insert(_.uniqBy(permissionsToInsert, 'permissionId'))
  })

  await knex.raw('SET foreign_key_checks = 0')
  await knex.schema.dropTableIfExists('Feature')
  await knex.schema.dropTableIfExists('JobFunctionFeature')
  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  // for the revert the change if we want to keep change of the data we had
  // in the features and jobfunctionfeatures table we need to rename them instead of just drop it.
  await knex.schema.createTable('Feature', feature => {
    feature.increments('id')
    feature.string('module').notNullable()
  })

  await knex.schema.createTable('JobFunctionFeature', jobFunctionFeature => {
    jobFunctionFeature.integer('jobFunctionId').unsigned().index().references('id').inTable('JobFunction')
    jobFunctionFeature.integer('featureId').unsigned().index().references('id').inTable('Feature')
    jobFunctionFeature.primary(['jobFunctionId', 'featureId'])
  })
}
