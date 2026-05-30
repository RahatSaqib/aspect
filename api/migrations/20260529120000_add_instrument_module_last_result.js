/**
 * Denormalized projection of "last result date per instrument module", maintained
 * incrementally on every RESULT_LOGGED event (see api/src/instrumentModule/).
 *
 * Replaces the per-request full aggregation over Result_READ / Result that powers
 * the Device Instruments and Candidate Instruments tables, which scanned the entire
 * results history on every page load.
 *
 * Named with the _READ suffix to signal that this table must not be written inside
 * application transactions — it is a cache maintained by post-commit event subscribers.
 *
 * Natural key: (instrumentId, moduleName). instrumentId is a FK to Instrument.id.
 * moduleName never changes for a given result, so rows are only ever inserted or have
 * their lastResultDate advanced (GREATEST) — never mutated otherwise.
 *
 * moduleSerial holds the serial of the most-recent result for the module. Unlike the
 * name, the serial can change between results without anything else changing, so it is
 * always overwritten with the serial from the latest result (by lastResultDate).
 *
 * The surrogate PK (id) follows project convention. The natural uniqueness constraint on
 * (instrumentId, moduleName) is kept as a unique index — it is the target of all upserts
 * (ON DUPLICATE KEY / onConflict) and the (instrumentId) prefix serves the read joins in
 * getDeviceInstruments and getCandidateInstruments.
 *
 * Initial data is populated by the seeding scripts (seeds/common/populate_instrument_modules.js).
 */
exports.up = function (knex) {
  return knex.schema.createTable('InstrumentModule_READ', function (table) {
    table.increments('id')
    table.integer('instrumentId').unsigned().notNullable()
    table.string('moduleName', 15).notNullable()
    table.string('moduleSerial', 15).nullable()
    table.date('lastResultDate').notNullable()

    table.unique(['instrumentId', 'moduleName'])
    table.foreign('instrumentId').references('Instrument.id')
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('InstrumentModule_READ')
}
