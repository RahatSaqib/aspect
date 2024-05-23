const async = require('async')
const { getResultDataHash } = require('../../src/result/common/logic')

exports.seed = async function (knex) {
  const BATCH_SIZE = 100
  const CONCURRENCY = 5
  const startDate = '2022-11-06' // date result with additional data started coming in

  const processBatch = async (trx, rows) => {
    try {
      await trx('processed_results').insert(rows)
    } catch (error) {
      console.error(`Error inserting batch: ${error.message}`)
      throw error
    }
  }

  await knex.transaction(async trx => {
    try {
      // Step 1: Create a temporary table
      await trx.schema.raw(`DROP TEMPORARY TABLE IF EXISTS processed_results;`)
      await trx.schema.raw(`
        CREATE TEMPORARY TABLE processed_results (
          id INT PRIMARY KEY,
          newResultData JSON,
          resultDataHash VARCHAR(32)
        );
      `)

      // Step 2: Setup queue for batch processing
      const queue = async.queue(async (task, callback) => {
        await processBatch(trx, task.batch)
        callback()
      }, CONCURRENCY)

      // Get this count so we don't have to stream if there are no records
      const resultCount = await trx('Result')
        .count('id as count')
        .where('createdOn', '>=', startDate)
        .whereRaw("JSON_CONTAINS_PATH(resultData, 'one', '$.analytes')")
        .first()

      if (resultCount.count > 0) {
        // Step 3: Stream data and add to queue
        let batch = []
        const stream = trx('Result')
          .select('id', 'resultData')
          .where('createdOn', '>=', startDate)
          .whereRaw("JSON_CONTAINS_PATH(resultData, 'one', '$.analytes')")
          .stream()

        for await (const row of stream) {
          let resultData = JSON.parse(row.resultData)
          delete resultData.analytes
          delete resultData.testData

          const resultDataHash = getResultDataHash(resultData)

          batch.push({
            id: row.id,
            newResultData: JSON.stringify(resultData),
            resultDataHash,
          })

          if (batch.length >= BATCH_SIZE) {
            queue.push({ batch: [...batch] })
            batch = []
          }
        }

        // Add remaining rows to queue
        if (batch.length > 0) {
          queue.push({ batch: [...batch] })
        }

        // Wait for all queue tasks to complete
        await queue.drain()
      }

      // Step 4: Create and call the procedures
      // Fetch updated records from the temporary table and update the result table
      await trx.schema.raw(`DROP PROCEDURE IF EXISTS UpdateResultFromTemp;`)
      await trx.schema.raw(`
        CREATE PROCEDURE UpdateResultFromTemp()
        BEGIN
          DECLARE done INT DEFAULT 0;
          DECLARE row_id INT;
          DECLARE new_data JSON;
          DECLARE new_hash VARCHAR(32);
          DECLARE cur CURSOR FOR 
            SELECT id, newResultData, resultDataHash FROM processed_results;
          DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

          OPEN cur;

          read_loop: LOOP
            FETCH cur INTO row_id, new_data, new_hash;
            IF done THEN
              LEAVE read_loop;
            END IF;

            UPDATE Result
            SET 
              resultData = new_data,
              resultDataHash = new_hash
            WHERE id = row_id;
          END LOOP;

          CLOSE cur;
        END;
      `)
      await trx.schema.raw(`CALL UpdateResultFromTemp();`)

      // Step 5: Drop and create UpdateDeviceLog procedure
      // Fetch records from temporary table, update them in Device logs
      await trx.schema.raw(`DROP PROCEDURE IF EXISTS UpdateDeviceLog;`)
      await trx.schema.raw(`
        CREATE PROCEDURE UpdateDeviceLog()
        BEGIN
          DECLARE done INT DEFAULT 0;
          DECLARE row_id INT;
          DECLARE cur CURSOR FOR 
            SELECT id FROM processed_results;
          DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

          OPEN cur;

          read_loop: LOOP
            FETCH cur INTO row_id;
            IF done THEN
              LEAVE read_loop;
            END IF;

            UPDATE DeviceLog
            SET rawMessage = JSON_REMOVE(rawMessage, '$.result.data.testData', '$.result.data.analytes')
            WHERE resultId = row_id AND JSON_CONTAINS_PATH(rawMessage, 'one', '$.result.data.analytes');
          END LOOP;

          CLOSE cur;
        END;
      `)
      await trx.schema.raw(`CALL UpdateDeviceLog();`)

      await trx.schema.raw('DROP PROCEDURE IF EXISTS UpdateResultFromTemp;');
      await trx.schema.raw('DROP PROCEDURE IF EXISTS UpdateDeviceLog;');
      await trx.schema.raw('DROP TEMPORARY TABLE IF EXISTS processed_results;');
    } catch (error) {
      await trx.schema.raw('DROP PROCEDURE IF EXISTS UpdateResultFromTemp;');
      await trx.schema.raw('DROP PROCEDURE IF EXISTS UpdateDeviceLog;');
      await trx.schema.raw('DROP TEMPORARY TABLE IF EXISTS processed_results;');
      console.error(`Error in script execution: ${error.message}`)
      throw error
    }
  })
}
