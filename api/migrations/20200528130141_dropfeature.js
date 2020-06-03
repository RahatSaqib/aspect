module.exports = require('../src/db').migration(up, down)
const _ = require('lodash')
const Promise = require('bluebird')
const { allFeatureToId } = require('../src/shared/dictionary')

async function up(knex) {
  const features = await allFeatureToId()
  const permissions = await query('Get permissions')
    .from('Permission as p')
    .select('p.module', 'p.activity')

  // this only is going to be executed if there are features inserted, not in an empty db.
  await Promise.forEach(
    _.differenceWith(
      Object.keys(features),
      _.map(permissions, perm => perm.module),
      (value, other) => `${value}` === `${other}`
    ),
    async featureKey => {
      // we are migration the unexisting features to a new permission.
      await knex('Permission').insert([
        { module: featureKey, activity: 'admin' },
        { module: featureKey, activity: 'view' },
        { module: featureKey, activity: 'edit' },
      ])
    }
  )
  await knex.raw('SET foreign_key_checks = 0')
  await knex.schema.dropTableIfExists('Feature')
  await knex.schema.dropTableIfExists('JobFunctionFeature')
  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.schema.createTable('Feature', feature => {
    feature.increments('id')
    feature.string('module').notNullable()
    feature.charset('utf8')
  })

  await knex.schema.createTable('JobFunctionFeature', jobFunctionFeature => {
    jobFunctionFeature
      .integer('jobFunctionId')
      .unsigned()
      .index()
      .references('id')
      .inTable('JobFunction')
    jobFunctionFeature
      .integer('featureId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Feature')
    jobFunctionFeature.primary(['jobFunctionId', 'featureId'])
    jobFunctionFeature.charset('utf8')
  })
}
