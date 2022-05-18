module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw(`CREATE FUNCTION GetDaysStockLeft(
    dailyConsumptionRate decimal,
    jsonExpirationAndQuantity varchar(10000)
) RETURNS int(11)
BEGIN
  set @now = NOW();
    
  set @currentDay = @now;
  set @currentDayPrev = @now;
  set @daysLeftUnexpired = 0;
        
  set @daysStockLeft = (
    SELECT GetWeekdaysInRange(MAX(currentDay), @now)
    FROM (
      SELECT 
        @currentDayPrev := @currentDay,
        CASE WHEN DATE(expiresOn) >= @currentDay 
          THEN @daysLeftUnexpired := GetWeekdaysInRange(DATE(expiresOn), @currentDay)
          ELSE @daysLeftUnexpired := 0
          END AS daysLeftUnexpired,
          
        CASE WHEN DATE(expiresOn) >= @currentDayPrev
          THEN
            CASE WHEN @daysLeftUnexpired * dailyConsumptionRate >= quantityOnHand
              -- items will be consumed before expiring - no wasted stock
              THEN @currentDay := date_add(@currentDay, INTERVAL (quantityOnHand / dailyConsumptionRate) DAY)
              -- items will expire before consuming the stock - stock will be wasted
              ELSE @currentDay := date_add(@currentDay, INTERVAL @daysLeftUnexpired DAY)
              END 
          ELSE @currentDay 
          END AS currentDay
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
  
  RETURN @daysStockLeft;
END`)

  await knex.raw(`CREATE FUNCTION GetProjectedWaste(
      dailyConsumptionRate decimal,
      jsonExpirationAndQuantity varchar(10000)
  ) RETURNS int(11)
  BEGIN
    set @now = NOW();
    set @currentDay = @now;
    set @currentDayPrev = @now;
    set @daysLeftUnexpired = 0;
    set @projectedWaste = 0;
          
    set @result = (
      SELECT MAX(projectedWaste)
      FROM (
        SELECT 
          @currentDayPrev := @currentDay,
          CASE WHEN DATE(expiresOn) >= @currentDay 
            THEN @daysLeftUnexpired := GetWeekdaysInRange(DATE(expiresOn), @currentDay)
            ELSE @daysLeftUnexpired := 0
            END AS daysLeftUnexpired,
            
          CASE WHEN DATE(expiresOn) >= @currentDayPrev
            THEN
              CASE WHEN @daysLeftUnexpired * dailyConsumptionRate >= quantityOnHand
                -- items will be consumed before expiring - no wasted stock
                THEN @currentDay := date_add(@currentDay, INTERVAL (quantityOnHand / dailyConsumptionRate) DAY)
                -- items will expire before consuming the stock - stock will be wasted
                ELSE @currentDay := date_add(@currentDay, INTERVAL @daysLeftUnexpired DAY)
                END 
            ELSE @currentDay 
            END AS currentDay,
          CASE WHEN DATE(expiresOn) < @currentDayPrev
                THEN @projectedWaste := @projectedWaste + quantityOnHand
              WHEN DATE(expiresOn) >= @currentDayPrev AND @daysLeftUnexpired * dailyConsumptionRate >= quantityOnHand
                THEN @projectedWaste := @projectedWaste + quantityOnHand - @daysLeftUnexpired * dailyConsumptionRate
              ELSE @projectedWaste
              END as projectedWaste
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
