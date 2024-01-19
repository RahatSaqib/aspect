exports.up = async function (knex) {
  const tableExists = await knex.schema.hasTable('FactResultsDeviceByTimeFrame');

  // If the table exists, truncate (remove) all data because siteId is notNullable
  if (tableExists) {
    await knex('FactResultsDeviceByTimeFrame').truncate();
  }
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', x => {
    x.integer('siteId').unsigned().references('id').inTable('Site').notNullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', x => {
    x.dropForeign('siteId')
    x.dropColumns('siteId')
  })
}
