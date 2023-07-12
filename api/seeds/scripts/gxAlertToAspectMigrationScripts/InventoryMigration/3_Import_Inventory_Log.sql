drop table if exists mig_gxalert_transfers;
create table mig_gxalert_transfers
(
    gxAlertInventoryLocationId int                                    not null,
    gxAlertInventoryLogId      int                                    not null,
    inventoryReasonExternalId  varchar(50) collate utf8mb4_unicode_ci not null,
    consumableExternalId       varchar(50) collate utf8mb4_unicode_ci not null,
    expiresOn                  datetime                               not null,
    siteExternalId             varchar(50) collate utf8mb4_unicode_ci not null,
    sourceSiteExternalId       varchar(50) collate utf8mb4_unicode_ci not null,
    destinationSiteExternalId  varchar(50) collate utf8mb4_unicode_ci not null,
    effective_date             datetime                               not null,
    updatedOn                  datetime                               not null,
    createdOn                  datetime                               not null,
    quantity                   float(8, 2)                            not null,
    errorMessage               varchar(2048)                          null
);


-- 👉👉👉 -----------------> MANUAL STEP: Import Inventory logs here into `mig_gxAlert_transfer` table

-- select *
-- from mig_gxalert_transfers;
-- update mig_gxalert_transfers set errorMessage = null where mig_gxalert_transfers.gxAlertInventoryLogId > 0;


-- --------------- Mark wrong pivot inventory logs (the ones that we will not be able to migrate)
-- ---> Nonexistent consumable
update mig_gxalert_transfers
set errorMessage = concat(ifnull(errorMessage, ''), ' /  Consumable "', consumableExternalId,
                          '" does not exists in Aspect')
where consumableExternalId not in (select externalId from Consumable);

-- ---> Nonexistent site
update mig_gxalert_transfers
set errorMessage = concat(ifnull(errorMessage, ''), ' / Source Site "', sourceSiteExternalId,
                          '" does not exists in Aspect')
where sourceSiteExternalId is not null
  and sourceSiteExternalId <> 'NULL'
  and sourceSiteExternalId not in (select externalId from Site);

update mig_gxalert_transfers
set errorMessage = concat(ifnull(errorMessage, ''), ' / Destination Site "', destinationSiteExternalId,
                          '" does not exists in Aspect')
where destinationSiteExternalId is not null
  and destinationSiteExternalId <> 'NULL'
  and destinationSiteExternalId not in (select externalId from Site);

-- ---> Just Styling
update mig_gxalert_transfers
set errorMessage = substring(errorMessage, 3)
where errorMessage like ' /%';
-- --------------- /Mark wrong pivot inventory logs (the ones that we will not be able to migrate)

-- 👉 Select grouped errors (check this and review case by case after the process, when you do so, note
-- that the adjustment process will have already generated a compensation Inventory Log for any Inventory Item involved.)
select errorMessage, count(errorMessage)
from mig_gxalert_transfers
where length(errorMessage) > 0
group by errorMessage;

-- ------ /Mark wrong inventory logs

set @reasonTransferSent = (select id
                           from ConsumableReason
                           where externalId = 'sent');
set @reasonTransferReceived = (select id
                               from ConsumableReason
                               where externalId = 'received');

-- ----> Create inventory Item with zero QoH, and then point orphans Inventory Logs to them.
-- (at the end, a movement to compensate the consumption will be created)
insert into InventoryItem
select 0                              as Id,
       il.consumableId                as consumableId,
       il.siteId                      as siteId,
       null                           as inTransitFromSiteId,
       null                           as lotNumber,
       il.expiresOn                   as expiresOn,
       0                              as quantityOnHand,
       adddate(min(il.createdOn), -1) as createdOn,
       1                              as createdBy,
       il.createdOn                   as updatedOn,
       1                              as updatedBy,
       null                           as gxAlertInventoryLocationId
from InventoryLog il
         left join InventoryItem ii
                   on ii.consumableId = il.consumableId
                       and ii.expiresOn = il.expiresOn
                       and ii.siteId = il.siteId
where ii.id is null;

-- ----> Update existing Aspect movements matching InventoryItems from GxAlert, to the correct InventoryItem Id.
update InventoryLog il
    join InventoryItem ii on ii.consumableId = il.consumableId
        and ii.expiresOn = il.expiresOn
        and ii.siteId = il.siteId
        and ii.lotNumber is null
set il.inventoryItemId = ii.id;

-- ----> Insert movements not from use.
insert into InventoryLog
select *
-- output movements:
from (select 0                       as id,
             ii.id                      inventoryItemId,
             c.id                    as consumableId,
             s.id                    as siteId,
             @reasonTransferSent     as consumableReasonId,
             null                    as resultId,
             'transfer from'         as operation,
             null                    as lotnumber,
             m.expiresOn,
             m.quantity              as quantity,
             'migrated from Gxalert' as notes,
             null                    as adjustedFrom,
             null                    as adjustedTo,
             m.createdOn,
             1                       as createdBy,
             refSite.id              as referencedSiteId,
             false                   as isAutomatic,
             m.effective_date        as effectiveDate,
             m.gxAlertInventoryLogId
      from mig_gxalert_transfers m
               join InventoryItem ii on m.gxAlertInventoryLocationId = ii.gxAlertInventoryLocationId
               join Consumable c on m.consumableExternalId = c.externalId
               join Site s on m.sourceSiteExternalId = s.externalId
               join Site refSite on m.destinationSiteExternalId = s.externalId
      where m.errorMessage is null
        and m.sourceSiteExternalId is not null
      union
      -- input movements:
      select 0                       as id,
             ii.id                      inventoryItemId,
             c.id                    as consumableId,
             s.id                    as siteId,
             @reasonTransferReceived as consumableReasonId,
             null                    as resultId,
             'transfer to'           as operation,
             null                    as lotnumber,
             m.expiresOn,
             m.quantity              as quantity,
             'migrated from Gxalert' as notes,
             null                    as adjustedFrom,
             null                    as adjustedTo,
             m.createdOn,
             1                       as createdBy,
             refSite.id              as referencedSiteId,
             false                   as isAutomatic,
             m.effective_date        as effectiveDate,
             m.gxAlertInventoryLogId
      from mig_gxalert_transfers m
               join InventoryItem ii on m.gxAlertInventoryLocationId = ii.gxAlertInventoryLocationId
               join Consumable c on m.consumableExternalId = c.externalId
               join Site s on m.destinationSiteExternalId = s.externalId
               join Site refSite on m.sourceSiteExternalId = s.externalId
      where m.errorMessage is null
        and m.destinationSiteExternalId is not null
      union
-- non transfers
      select 0                       as id,
             ii.id                      inventoryItemId,
             c.id                    as consumableId,
             s.id                    as siteId,
             cr.id                   as consumableReasonId,
             null                    as resultId,
             'transfer to'           as operation,
             null                    as lotnumber,
             m.expiresOn,
             m.quantity              as quantity,
             'migrated from Gxalert' as notes,
             null                    as adjustedFrom,
             null                    as adjustedTo,
             m.createdOn,
             1                       as createdBy,
             null                    as referencedSiteId,
             false                   as isAutomatic,
             m.effective_date        as effectiveDate,
             m.gxAlertInventoryLogId
      from mig_gxalert_transfers m
               join InventoryItem ii
                    on m.gxAlertInventoryLocationId = ii.gxAlertInventoryLocationId
               join Consumable c on m.consumableExternalId = c.externalId
               join ConsumableReason as cr on cr.externalId = m.inventoryReasonExternalId
               join Site as s on s.externalId = m.siteExternalId
      where m.errorMessage is null
        and m.destinationSiteExternalId is null
        and m.sourceSiteExternalId is null) as t
order by createdOn, siteId;

-- Load InventoryTransfer Table
insert into InventoryTransfer
select 0 as id, olog.id, ilog.id, null, olog.createdOn, m.updatedOn
from mig_gxalert_transfers as m
         join InventoryLog as olog on olog.gxAlertInventoryLogId = m.gxAlertInventoryLogId
         join InventoryLog as ilog on ilog.gxAlertInventoryLogId = m.gxAlertInventoryLogId;

-- initial adjustment to match GxAlert quantity on InventoryItem
insert into InventoryLog
select 0                                              as id,
       t.inventoryItemId                              as inventoryItemId,
       t.consumableId                                 as consumableId,
       t.siteId                                       as siteId,
       cr.id                                          as consumableReasonId,
       null                                           as resultId,
       'migration adjustment'                         as operation,
       null                                           as lotnumber,
       t.expiresOn                                    as expiresOn,
       abs(t.quantity)                                as quantity,
       'adjustment by migration process from Gxalert' as notes,
       null                                           as adjustedFrom,
       null                                           as adjustedTo,
       t.createdOn                                    as createdOn,
       1                                              as createdBy,
       null                                           as referencedSiteId,
       false                                          as isAutomatic,
       t.effectiveDate                                as effectiveDate,
       null                                           as gxAlertInventoryLogId
from (select ii.id                                as inventoryItemId,
             ii.consumableId                      as consumableId,
             ii.siteId                            as siteId,
             ii.expiresOn                         as expiresOn,
             ii.quantityOnHand - sum(il.quantity) as quantity,
             adddate(min(il.createdOn), -1)       as createdOn,
             adddate(min(il.createdOn), -1)       as effectiveDate
      from InventoryItem as ii
               left join InventoryLog il on ii.id = il.inventoryItemId
      group by il.inventoryItemId) as t
         left join ConsumableReason cr
                   on cr.externalId =
                      if(t.quantity > 0, cr.externalId = 'asserted_increase', 'asserted_decrease')
where t.quantity <> 0;