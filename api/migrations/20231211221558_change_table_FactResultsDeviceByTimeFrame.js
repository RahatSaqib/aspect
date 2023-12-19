exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE FactResultsDeviceByTimeFrame
    CHANGE COLUMN startedOn startedOn DATE NOT NULL;
  `)
}

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE FactResultsDeviceByTimeFrame
    CHANGE COLUMN startedOn startedOn DATETIME NOT NULL;
  `)
}
