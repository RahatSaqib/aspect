module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceMaintenance', tbl => {
    /**
     * make below columns nullable
     * i.e. first drop FK and index, and then
     * repeat same settings (without `.notNullable()`)
     * as in `api/migrations/20190304072614_device_maintenance.js`
     */
    tbl.dropForeign('createdBy')
    tbl.dropIndex('createdBy')
    tbl.integer('createdBy').unsigned().index().references('id').inTable('User').alter()

    tbl.dropForeign('updatedBy')
    tbl.dropIndex('updatedBy')
    tbl.integer('updatedBy').unsigned().index().references('id').inTable('User').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceMaintenance', tbl => {
    /**
     * first drop FK and index, and then
     * repeat same settings as in `api/migrations/20190304072614_device_maintenance.js`
     */

    tbl.dropForeign('createdBy')
    tbl.dropIndex('createdBy')
    tbl.integer('createdBy').unsigned().index().notNullable().references('id').inTable('User').alter()

    tbl.dropForeign('updatedBy')
    tbl.dropIndex('updatedBy')
    tbl.integer('updatedBy').unsigned().index().notNullable().references('id').inTable('User').alter()
  })
}
