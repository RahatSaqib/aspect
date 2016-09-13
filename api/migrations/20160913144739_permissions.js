
exports.up = function(knex) {
  return knex.schema.createTable('partner', partner => {
    partner.increments('id')
    partner.string('name').notNullable()
  }).then(() => knex.schema.createTable('org_unit', orgUnit => {
    orgUnit.increments('id')
    orgUnit.string('name').notNullable()
    orgUnit.integer('left_bound').unsigned().notNullable()
    orgUnit.integer('right_bound').unsigned().notNullable()
    orgUnit.integer('depth').unsigned().notNullable()
    orgUnit.integer('partner_id').unsigned().notNullable()
      .index().references('id').inTable('partner')
    orgUnit.integer('parent_id').unsigned()
      .index().references('id').inTable('org_unit')
  })).then(() => knex.schema.createTable('data_group', dataGroup => {
    dataGroup.increments('id')
    dataGroup.string('name').notNullable()

    // Data Type (should this be another table: type, value, data_group_id?)
    // Clinical Access Type: Result+PII; Result; Aggregate; or None
    dataGroup.string('clinical_type', 48).notNullable()
    // Operational Access Type: Current; Historical; Aggregate; or None
    dataGroup.string('operational_type', 48).notNullable() // Result+PII; Result; Aggregate; or None
    // Inventory Access Type: Current; Historical; Aggregate; or None
    dataGroup.string('inventory_type', 48).notNullable() // Result+PII; Result; Aggregate; or None

    dataGroup.integer('org_unit_id').unsigned()
      .index().references('id').inTable('org_unit')
  })).then(() => knex.schema.createTable('data_constraint', dataConstraint => {
    dataConstraint.increments('id')

    // the constraint name (name = value)
    dataConstraint.string('name').notNullable()
    // Operator (= > < etc)
    dataConstraint.string('operator').notNullable()
    // Value
    dataConstraint.string('value').notNullable()

    dataConstraint.integer('data_group_id').unsigned()
      .index().references('id').inTable('data_group')
  })).then(() => knex.schema.table('role', role => {
    role.integer('partner_id').unsigned()
      .index().references('id').inTable('partner')
    role.integer('data_group_id').unsigned()
      .index().references('id').inTable('data_group')
  })).then(() => knex.schema.table('device', device => {
    device.integer('org_unit_id').unsigned()
      .index().references('id').inTable('org_unit')
  }))
}

exports.down = function(knex) {
  return knex.schema.table('device', device => {
    device.dropForeign('org_unit_id')
    device.dropIndex('org_unit_id')
    device.dropColumn('org_unit_id')
  }).then(() => knex.schema.table('role', role => {
    role.dropForeign('data_group_id')
    role.dropIndex('data_group_id')
    role.dropColumn('data_group_id')

    role.dropForeign('partner_id')
    role.dropIndex('partner_id')
    role.dropColumn('partner_id')
  }))
    .then(() => knex.schema.dropTable('data_constraint'))
    .then(() => knex.schema.dropTable('data_group'))
    .then(() => knex.schema.dropTable('org_unit'))
    .then(() => knex.schema.dropTable('partner'))
}
