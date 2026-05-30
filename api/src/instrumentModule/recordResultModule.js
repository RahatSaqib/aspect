const TABLE = 'InstrumentModules'

/**
 * Records the last-result-date for a single instrument module, as projected from one
 * result. Designed to run post-commit (its own connection), idempotent, and safe under
 * concurrency: the common path is a single atomic upsert, so two results for the same
 * instrument arriving in parallel cannot lose each other's update.
 *
 * Letter changes (e.g. an instrument's modules go A1..A4 -> C1..C4): we do NOT need a
 * read-modify-write to "switch" the active letter. The read endpoints pick the active
 * letter from the most-recent module (max lastResultDate), so stale older-letter rows
 * are ignored at read time regardless. Step 2 is therefore best-effort housekeeping:
 * it only deletes rows of a *different* letter that are *strictly older* than the
 * incoming result, which can never remove the genuinely-active (newest) letter.
 *
 * @param {import('knex')} knex - a knex instance or transaction
 * @param {object} row
 * @param {number} row.instrumentId - FK to Instrument.id
 * @param {string} row.moduleName
 * @param {string} [row.moduleSerial]
 * @param {string|Date} row.endedOn
 */
async function recordResultModule(knex, { instrumentId, moduleName, moduleSerial = null, endedOn }) {
  // Only GeneXpert-style results carry a module name; everything else is a no-op.
  if (!instrumentId || !moduleName || !endedOn) {
    return
  }

  const lastResultDate = knex.raw('DATE(?)', [endedOn])

  // 1) Atomic per-module upsert; keep the most recent date (results can arrive out of
  //    order via re-sync / transfer / backfill, so never blindly overwrite). moduleSerial
  //    is taken from the latest result only — note it is updated BEFORE lastResultDate so
  //    the comparison reads the previously-stored date, not the freshly-GREATEST'd one.
  await knex(TABLE)
    .insert({ instrumentId, moduleName, moduleSerial, lastResultDate })
    .onConflict(['instrumentId', 'moduleName'])
    .merge({
      moduleSerial: knex.raw(
        `IF(VALUES(lastResultDate) >= ${TABLE}.lastResultDate, VALUES(moduleSerial), ${TABLE}.moduleSerial)`
      ),
      lastResultDate: knex.raw(`GREATEST(${TABLE}.lastResultDate, VALUES(lastResultDate))`),
    })

  // 2) Best-effort cleanup of superseded letters for this instrument.
  await knex(TABLE)
    .where({ instrumentId })
    .andWhereRaw('LEFT(moduleName, 1) <> LEFT(?, 1)', [moduleName])
    .andWhere('lastResultDate', '<', knex.raw('DATE(?)', [endedOn]))
    .del()
}

module.exports = { recordResultModule, TABLE }
