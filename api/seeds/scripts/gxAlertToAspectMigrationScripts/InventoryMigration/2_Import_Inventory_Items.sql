-- ---- > Script to clear data
SET SQL_SAFE_UPDATES = 0;

set @reasonUsed = (select id
                   from ConsumableReason
                   where externalId = 'used');

-- Backup pre-mig data
create table mig_bkp_InventoryItem as select * from InventoryItem;
create table mig_bkp_InventoryLog as select * from InventoryLog;

-- DON'T RUN THIS IN COUNTRIES USING LOT NUMBER ------------------------------------------------------------------------------------
-- Inventory Items could be repeated with different lot numbers, but PK doesn't use lot numbers, so:

-- Update InventoryLogs to point same Inventory Item if they match by candidate key.
update InventoryLog as il
    join (select consumableId,
                 expiresOn,
                 siteId,
                 min(id) as minId
          from InventoryItem
          group by consumableId, expiresOn, siteId) as acc
    on il.consumableId = acc.consumableId
        and il.expiresOn = acc.expiresOn
        and il.siteId = acc.siteId
set il.lotNumber       = null,
    il.inventoryItemId = acc.minId where id > 0;

-- Update the first record of each scattered InventoryItem, sum the qoh, clear lotNumber (after 
update InventoryItem as ii
    join (select consumableId,
                 expiresOn,
                 siteId,
                 sum(quantityOnHand) as qoh,
                 min(createdOn)      as createdOn,
                 max(updatedOn)      as updatedOn,
                 min(lotNumber)      as lotNumber,
                 min(id)             as minId,
                 count(id) - 1       as dups
          from InventoryItem
          group by consumableId, expiresOn, siteId) as acc
    on ii.consumableId = acc.consumableId
        and ii.expiresOn = acc.expiresOn
        and ii.siteId = acc.siteId
set ii.lotNumber      = null,
    ii.quantityOnHand = acc.qoh,
    ii.createdOn      = acc.createdOn,
    ii.updatedOn      = acc.updatedOn
where ii.id = acc.minId
  -- No need to update solo records, except we need to clear lotNumber:
  and (dups > 0 or acc.lotNumber is not null);

-- Delete all scattered Inventory Items but the updated one.
delete ii
from InventoryItem ii
         join (select consumableId,
                      expiresOn,
                      siteId,
                      min(id) as minId
               from InventoryItem
               group by consumableId, expiresOn, siteId) as acc
              on ii.consumableId = acc.consumableId
                  and ii.expiresOn = acc.expiresOn
                  and ii.siteId = acc.siteId
where ii.id <> acc.minId;
-- /DON'T RUN THIS IN COUNTRIES USING LOT NUMBER ------------------------------------------------------------------------------------

-- Remove all Inventory Logs other than consumptions, as we are going to import them from GxAlert
delete
from InventoryLog
where consumableReasonId <> @reasonUsed;

-- Inventory Logs will be used after migration.
delete
from MissingInventoryLots;

-- FactInventoryConsumptionRate will be recalculated by the scheduler or a restart.
delete
from FactInventoryConsumptionRate;
SET SQL_SAFE_UPDATES = 1;


-- Create pivot table to import 
drop table if exists mig_InventoryItemPivot;
create table mig_InventoryItemPivot
(
    gxAlertInventoryLocationId int                                     not null,
    consumableExternalId       varchar(255) collate utf8mb4_unicode_ci not null,
    siteExternalId             varchar(255) collate utf8mb4_unicode_ci null,
    expiresOn                  datetime                                null,
    createdOn                  datetime                                not null,
    updatedOn                  datetime                                not null,
    quantityOnHand             int                                     null,
    errorMessage               varchar(2048)                           null
);

--  👉👉👉 -------------------------> MANUAL STEP: Import Inventory Item Extraction into `mig_InventoryItemPivot`

-- ------------------------ Mark wrong inventory items
SET SQL_SAFE_UPDATES = 0;
-- --> Missing site:
update mig_InventoryItemPivot
set errorMessage = concat(ifnull(errorMessage, ''), ' / Site "', siteExternalId, '" does not exists in Aspect')
where siteExternalId not in (select externalId from Site);

-- --> Missing consumable:
update mig_InventoryItemPivot
set errorMessage = concat(ifnull(errorMessage, ''), ' /  Consumable "', consumableExternalId,
                          '" does not exists in Aspect')
where consumableExternalId not in (select externalId from Consumable);

-- --> Negative QoH: (Better to leave negative?)
-- update mig_InventoryItemPivot
-- set errorMessage = concat(ifnull(errorMessage, ''), ' / Negative QoH from GxAlert')
-- where quantityOnHand < 0;

-- --> Just styling
update mig_InventoryItemPivot
set errorMessage = substring(errorMessage, 3)
where errorMessage like ' /%';

SET SQL_SAFE_UPDATES = 1;
-- select *
-- from mig_InventoryItemPivot
-- where length(errorMessage) > 0;
-- ------------------------ /Mark wrong inventory items

-- update existing Inventory Items
update InventoryItem ii, (select m.quantityOnHand,
                                 c.id consumableId,
                                 s.id siteId,
                                 m.expiresOn,
                                 m.createdOn,
                                 m.updatedOn,
                                 m.gxAlertInventoryLocationId
                          from mig_InventoryItemPivot m
                                   join Consumable c
                                        on c.externalId = m.consumableExternalId
                                   join Site as s
                                        on s.externalId = m.siteExternalId
                          where m.errorMessage is null) as src
set ii.quantityOnHand             = src.quantityOnHand,
    ii.createdOn                  = src.createdOn,
    ii.updatedOn                  = src.updatedOn,
    ii.gxAlertInventoryLocationId = src.gxAlertInventoryLocationId
where ii.consumableId = src.consumableId
  and ii.siteId = src.siteId
  and ii.expiresOn = src.expiresOn
  and inTransitFromSiteId is null
  and lotNumber is null;

-- Insert inventory items
insert into InventoryItem
select 0    as                      id,
       c.id                         consumableId,
       s.id                         siteId,
       null as                      inTransitFromSiteId,
       null as                      lotNumber,
       m.expiresOn,
       m.quantityOnHand,
       m.createdOn,
       1                            createdBy,
       m.updatedOn,
       1    as                      updatedBy,
       m.gxAlertInventoryLocationId gxAlertInventoryLocationId
from mig_InventoryItemPivot m
         join Consumable c on c.externalId = m.consumableExternalId
         join Site as s on s.externalId = m.siteExternalId
where errorMessage is null
  and not exists (select id
                  from InventoryItem ii
                           join Consumable ec on ec.id = ii.consumableId
                           join Site es on es.id = ii.siteId
                  where ec.externalId = m.consumableExternalId
                    and es.externalId = m.siteExternalId
                    and ii.expiresOn = m.expiresOn);
