module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS GetDaysStockLeft')
  await knex.raw('DROP FUNCTION IF EXISTS GetProjectedWaste')

  await knex.raw(`
  CREATE FUNCTION GetDaysStockLeft(
    startDate date,
    dailyConsumptionRate decimal(10,2),
    jsonExpirationAndQuantity TEXT
  ) RETURNS decimal(10,2) DETERMINISTIC
  BEGIN
    set @secondsInDay = 24 * 60 * 60;
    set @startDate = startDate;
    set @now = DATE_SUB(DATE_ADD(@startDate, INTERVAL 1 DAY), INTERVAL 1 MICROSECOND); -- end of today, i.e. '... 23:59:59.999999'
    set @currentDay = @now;

    set @daysStockLeft = (
      SELECT TIMESTAMPDIFF(SECOND, @now, MAX(currentDay)) / @secondsInDay
      FROM (
        SELECT 
          /*
          * include whole expiresOn date
          */
          @endOfExpirationDate := DATE_SUB(DATE_ADD(expiresOn, INTERVAL 1 DAY), INTERVAL 1 MICROSECOND),
          /*
          * how many days of unexpired inventories left for current item
          */
          @daysLeftUnexpired := CASE 
            WHEN @endOfExpirationDate > @currentDay 
            THEN (TIMESTAMPDIFF(HOUR, @currentDay, @endOfExpirationDate) / 24)
            ELSE 0
            END,
          /*
          * shift pointer of the currentDay
          */
          @currentDay := CASE
            WHEN @endOfExpirationDate > @currentDay
            THEN
              CASE WHEN (@daysLeftUnexpired * dailyConsumptionRate) >= quantityOnHand
                -- items will be consumed before expiring - no wasted stock
                THEN date_add(@currentDay, INTERVAL (24 * quantityOnHand / dailyConsumptionRate) HOUR)
                -- items will expire before consuming the stock - stock will be wasted
                ELSE date_add(@currentDay, INTERVAL @daysLeftUnexpired DAY)
                END 
            ELSE @currentDay 
            END AS currentDay
          FROM 
            JSON_TABLE(
              jsonExpirationAndQuantity, 
              '$[*]' COLUMNS(
                expiresOn DATE PATH '$.expiresOn', 
                quantityOnHand DECIMAL(10,2) PATH '$.quantityOnHand'
              )
            ) AS t
          WHERE t.expiresOn IS NOT NULL AND t.expiresOn > @now
          ORDER BY t.expiresOn
        ) as t1
    );
    
    RETURN @daysStockLeft;
  END
  `)

  await knex.raw(`
  CREATE FUNCTION GetProjectedWaste(
    startDate date,
    dailyConsumptionRate decimal(10,2),
    jsonExpirationAndQuantity TEXT
  ) RETURNS int(11) DETERMINISTIC
  BEGIN
    set @secondsInDay = 24 * 60 * 60;
    set @startDate = startDate;
    set @now = DATE_SUB(DATE_ADD(@startDate, INTERVAL 1 DAY), INTERVAL 1 MICROSECOND); -- end of today, i.e. '... 23:59:59.999999'
    set @currentDay = @now;
    set @projectedWaste = 0;
            
    set @result = (
      SELECT MAX(projectedWaste)
      FROM (
        SELECT
          /*
          * include whole expiresOn date
          */
          @endOfExpirationDate := DATE_SUB(DATE_ADD(expiresOn, INTERVAL 1 DAY), INTERVAL 1 MICROSECOND),
          /*
          * how many days of unexpired inventories left for current item
          */
          @daysLeftUnexpired := CASE 
            WHEN @endOfExpirationDate > @currentDay 
            THEN TIMESTAMPDIFF(SECOND, @currentDay, @endOfExpirationDate) / @secondsInDay
            ELSE 0
            END,
          /*
          * how many are going to be wasted
          */
          @projectedWaste := @projectedWaste +
            CASE 
            WHEN @endOfExpirationDate > @currentDay
            THEN
                CASE WHEN (@daysLeftUnexpired * dailyConsumptionRate) >= quantityOnHand
                  -- items will be consumed before expiring - no wasted stock
                  THEN 0
                  -- items will expire before consuming the stock - stock will be wasted
                  ELSE quantityOnHand - @daysLeftUnexpired * dailyConsumptionRate
                  END
            ELSE quantityOnHand
            END as projectedWaste,
          /*
          * shift pointer of the currentDay
          */
          @currentDay := CASE
            WHEN @endOfExpirationDate > @currentDay
            THEN
              CASE WHEN (@daysLeftUnexpired * dailyConsumptionRate) >= quantityOnHand
                -- items will be consumed before expiring - no wasted stock
                THEN date_add(@currentDay, INTERVAL (24 * quantityOnHand / dailyConsumptionRate) HOUR)
                -- items will expire before consuming the stock - stock will be wasted
                ELSE date_add(@currentDay, INTERVAL @daysLeftUnexpired DAY)
                END 
            ELSE @currentDay 
            END
          FROM 
            JSON_TABLE(
              jsonExpirationAndQuantity, 
              '$[*]' COLUMNS(
                expiresOn DATE PATH '$.expiresOn', 
                quantityOnHand DECIMAL(10,2) PATH '$.quantityOnHand'
              )
            ) AS t
          WHERE t.expiresOn IS NOT NULL AND t.expiresOn > @now
          order by t.expiresOn
        ) as t1
    );
      
    RETURN @result;
  END
`)
}

async function down(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS GetDaysStockLeft')
  await knex.raw('DROP FUNCTION IF EXISTS GetProjectedWaste')
}
