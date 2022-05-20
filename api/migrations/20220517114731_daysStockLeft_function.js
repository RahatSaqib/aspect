module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw(`
  CREATE FUNCTION GetDaysStockLeft(
    startDate datetime,
    dailyConsumptionRate decimal,
    jsonExpirationAndQuantity varchar(10000)
  ) RETURNS decimal(10,2)
  BEGIN
    set @now = startDate;
    set @currentDay = DATE_SUB(DATE_ADD(DATE(@now), INTERVAL 1 DAY), INTERVAL 1 SECOND); -- end of today, i.e. '... 23:59:59'
          
    set @daysStockLeft = (
      SELECT TIMESTAMPDIFF(HOUR, @now, MAX(@currentDay)) /24
      FROM (
        SELECT 
          /*
          * include whole expiresOn date
          */
          @endOfExpirationDate := DATE_SUB(DATE_ADD(DATE(expiresOn), INTERVAL 1 DAY), INTERVAL 1 MICROSECOND) as endOfExpirationDate,
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
          CASE WHEN @endOfExpirationDate > @currentDay
            THEN
              CASE WHEN (@daysLeftUnexpired * dailyConsumptionRate) >= quantityOnHand
                -- items will be consumed before expiring - no wasted stock
                THEN @currentDay := date_add(@currentDay, INTERVAL (quantityOnHand / dailyConsumptionRate) DAY)
                -- items will expire before consuming the stock - stock will be wasted
                ELSE @currentDay := date_add(@currentDay, INTERVAL @daysLeftUnexpired DAY)
                END 
            ELSE @currentDay 
            END
          FROM 
            (
              SELECT
                JSON_UNQUOTE(json_extract( jsonExpirationAndQuantity ,  concat('$[', n.i, '].expiresOn'))) AS expiresOn,
                JSON_UNQUOTE(json_extract( jsonExpirationAndQuantity ,  concat('$[', n.i, '].quantityOnHand'))) AS quantityOnHand
              from 
                (
                  SELECT 0 AS i 
                    UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
                    UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
                ) AS n
            ) AS t
          WHERE t.expiresOn IS NOT NULL AND t.expiresOn > NOW()
          ORDER BY t.expiresOn
        ) as t1
        limit 1
    );
    
    RETURN @daysStockLeft;
  END`)

  await knex.raw(`
  CREATE FUNCTION GetProjectedWaste(
    startDate datetime,
    dailyConsumptionRate decimal,
    jsonExpirationAndQuantity varchar(10000)
  ) RETURNS int(11)
  BEGIN
    set @now = startDate;
    set @currentDay = @now;
    set @projectedWaste = 0;
            
    set @result = (
      SELECT MAX(projectedWaste)
      FROM (
        SELECT
          /*
          * include whole expiresOn date
          */
          @endOfExpirationDate := DATE_SUB(DATE_ADD(DATE(expiresOn), INTERVAL 1 DAY), INTERVAL 1 MICROSECOND),
          /*
          * how many days of unexpired inventories left for current item
          */
          @daysLeftUnexpired := CASE 
            WHEN @endOfExpirationDate > @currentDay 
            THEN (TIMESTAMPDIFF(HOUR, @currentDay, @endOfExpirationDate) / 24)
            ELSE 0
            END,
          /*
          * how many are going to be wasted
          */
          @projectedWaste := @projectedWaste +
            CASE WHEN @endOfExpirationDate > @currentDay
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
            CASE WHEN @endOfExpirationDate > @currentDay
            THEN
            CASE WHEN (@daysLeftUnexpired * dailyConsumptionRate) >= quantityOnHand
              -- items will be consumed before expiring - no wasted stock
              THEN @currentDay := date_add(@currentDay, INTERVAL (quantityOnHand / dailyConsumptionRate) DAY)
              -- items will expire before consuming the stock - stock will be wasted
              ELSE @currentDay := date_add(@currentDay, INTERVAL @daysLeftUnexpired DAY)
              END 
            ELSE @currentDay 
            END
          FROM 
            (
              SELECT
                JSON_UNQUOTE(json_extract( jsonExpirationAndQuantity ,  concat('$[', n.i, '].expiresOn'))) AS expiresOn,
                JSON_UNQUOTE(json_extract( jsonExpirationAndQuantity ,  concat('$[', n.i, '].quantityOnHand'))) AS quantityOnHand
              from 
                (
                  SELECT 0 AS i 
                    UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
                    UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
                ) AS n
            ) AS t
          WHERE t.expiresOn IS NOT NULL AND t.expiresOn > NOW()
          order by t.expiresOn
        ) as t1
    );
      
    RETURN @result;
  END
`)
}

async function down(knex) {
  await knex.raw('DROP FUNCTION GetDaysStockLeft')
  await knex.raw('DROP FUNCTION GetProjectedWaste')
}
