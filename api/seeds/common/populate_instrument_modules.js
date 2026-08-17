/**
 * Rebuilds the InstrumentModule projection table from scratch.
 *
 * InstrumentModule is a denormalized cache of the last result date (and last module
 * serial) per instrument module. It is normally kept up to date incrementally via the
 * RESULT_LOGGED event subscriber (api/src/instrumentModule/). This rebuild is used
 * during seeding and can also serve as an idempotent repair script when drift is
 * suspected (e.g. after result deletions or missed events).
 *
 * Strategy: drive from Instrument, batched by Instrument.id, and for each batch pull the
 * batch's results straight from Result_READ via idx_result_read_partnerId_deviceId_endedOn_desc
 * (the join carries partnerId + deviceId, confirmed by EXPLAIN). Because every instrument is
 * fully contained in its batch, the active module set is computed inline in a single pass:
 *   - ROW_NUMBER picks the latest result per (instrument, module) -> date + serial.
 *   - FIRST_VALUE picks the instrument's active letter (letter of its most-recent result);
 *     once a C-result arrives, A1..A4 are retired in favour of C1..C4.
 * Only rows on the active letter are inserted, so there is no insert-then-delete and no
 * cross-batch ON DUPLICATE merge.
 */

// Number of instruments per batch. Each instrument pulls its own results, so the per-batch
// window sort is roughly batch_size x results-per-instrument. Production averages ~3.3K
// results/instrument (5.5M over ~1.7K instruments, peaking ~71K for the busiest). Total read
// work is fixed (~20 min either way); 200 keeps it to ~9 statements of ~2 min each with the
// window sort bounded to ~600-800K rows.
const INSTRUMENT_BATCH_SIZE = 200

async function insertActiveModulesForRange(knex, lo, hi) {
  const ranked = knex
    .select(
      'i.id as instrumentId',
      knex.raw('TRIM(r.moduleName) as moduleName'),
      'r.moduleSerial as moduleSerial',
      knex.raw('r.endedOn as lastResultDate'),
      knex.raw(
        'ROW_NUMBER() OVER (PARTITION BY i.id, TRIM(r.moduleName) ORDER BY r.endedOn DESC, r.id DESC) as rnModule'
      ),
      knex.raw('LEFT(TRIM(r.moduleName), 1) as letter'),
      knex.raw(
        'FIRST_VALUE(LEFT(TRIM(r.moduleName), 1)) OVER (PARTITION BY i.id ORDER BY r.endedOn DESC, r.id DESC) as activeLetter'
      )
    )
    .from('Instrument as i')
    .join('Device as d', 'd.id', 'i.deviceId')
    .join('Result_READ as r', function () {
      // partnerId + deviceId drive the index; serial narrows to this instrument.
      this.on('r.partnerId', 'd.partnerId').andOn('r.deviceId', 'i.deviceId').andOn('r.instrumentSerial', 'i.serial')
    })
    .whereBetween('i.id', [lo, hi])
    .whereNotNull('i.serial')
    .whereNotNull('r.moduleName')
    .whereRaw("TRIM(r.moduleName) <> ''")
    .whereNotNull('r.endedOn')

  // Keep only the latest row per module, restricted to the instrument's active letter.
  // null for `id` lets MySQL generate the auto-increment value.
  return knex('InstrumentModule').insert(function () {
    this.from(ranked.as('ranked'))
      .where('ranked.rnModule', 1)
      .whereRaw('ranked.letter = ranked.activeLetter')
      .select(
        knex.raw('null as id'),
        'instrumentId',
        'moduleName',
        'moduleSerial',
        'lastResultDate',
        knex.raw('null as lastLogDate'),
        knex.raw('null as lastLogDetail')
      )
  })
}

async function populateInstrumentModules(knex) {
  const start = new Date()

  // eslint-disable-next-line no-console
  console.log('\x1b[33mTruncating InstrumentModule table...\x1b[0m')
  await knex('InstrumentModule').truncate()

  const { id: maxId } = await knex('Instrument').max('id as id').first()
  if (!maxId) {
    // eslint-disable-next-line no-console
    console.log('\x1b[33mNo instruments — nothing to populate.\x1b[0m')
    return
  }

  const batches = Math.ceil(maxId / INSTRUMENT_BATCH_SIZE)
  // eslint-disable-next-line no-console
  console.log(`\x1b[33mPopulating InstrumentModule from ${maxId} instruments in ${batches} batches...\x1b[0m`)

  for (let i = 0; i < batches; i++) {
    const lo = i * INSTRUMENT_BATCH_SIZE + 1
    const hi = (i + 1) * INSTRUMENT_BATCH_SIZE
    const batchStart = new Date()

    // eslint-disable-next-line no-await-in-loop
    await insertActiveModulesForRange(knex, lo, hi)

    const batchElapsed = ((new Date() - batchStart) / 1000).toFixed(2)
    // eslint-disable-next-line no-console
    console.log(`\x1b[36mBatch ${i + 1}/${batches}\x1b[0m: instruments ${lo}-${hi} (\x1b[32m${batchElapsed}s\x1b[0m)`)
  }

  const elapsed = ((new Date() - start) / 1000 / 60).toFixed(2)
  // eslint-disable-next-line no-console
  console.log(`\x1b[36mpopulateInstrumentModules\x1b[0m completed in \x1b[32m${elapsed} min\x1b[0m`)
}

module.exports = { populateInstrumentModules }
