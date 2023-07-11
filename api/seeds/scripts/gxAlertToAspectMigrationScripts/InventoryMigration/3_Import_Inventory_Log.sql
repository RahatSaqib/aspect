drop table if exists mig_gxalert_transfers;
create table mig_gxalert_transfers
(
    gxAlertInventoryLocationId int                                    not null,
    gxAlertInventoryLogId      int                                    not null,
    inventoryReasonExternalId  varchar(50) collate utf8mb4_unicode_ci not null,
    consumableExternalId       varchar(50) collate utf8mb4_unicode_ci not null,
    expiresOn                  datetime                               not null,
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
-- ------ Mark wrong pivot inventory logs (the ones that we will not be able to migrate)

-- ------> Nonexistent consumable
update mig_gxalert_transfers
set errorMessage = concat(ifnull(errorMessage, ''), ' /  Consumable "', consumableExternalId,
                          '" does not exists in Aspect')
where consumableExternalId not in (select externalId from Consumable);

-- ------> Nonexistent site
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

-- ------> Just Styling
update mig_gxalert_transfers
set errorMessage = substring(errorMessage, 3)
where errorMessage like ' /%';


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

-- --- CLEANING
-- -----> Delete all logs from inventory items not in Gxalert.

delete
from InventoryLog
where id in (select il.id
             from InventoryLog il
                      left join InventoryItem ii
                                on ii.consumableId = il.consumableId
                                    and ii.expiresOn = il.expiresOn
                                    and ii.siteId = il.siteId
                                    and ii.id is null);
-- --- /CLEANING

-- ----> Update movements matching InventoryItems from GxAlert, to the correct InventoryItem Id.
update InventoryLog il
    join InventoryItem ii on ii.consumableId = il.consumableId
        and ii.expiresOn = il.expiresOn
        and ii.siteId = il.siteId
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
             refSite.id              as referencedSiteId,
             false                   as isAutomatic,
             m.effective_date        as effectiveDate,
             m.gxAlertInventoryLogId
      from mig_gxalert_transfers m
               join InventoryItem ii
                    on m.gxAlertInventoryLocationId = ii.gxAlertInventoryLocationId
               join Consumable c on m.consumableExternalId = c.externalId
               join ConsumableReason as cr on cr.externalId = m.inventoryReasonExternalId
               join Site s on m.destinationSiteExternalId = s.externalId
               join Site refSite on m.sourceSiteExternalId = s.externalId
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
select *
from (select 0                                              as id,
             ii.id                                          as inventoryItemId,
             ii.consumableId                                as consumableId,
             ii.siteId                                      as siteId,
             cr.id                                          as consumableReasonId,
             null                                           as resultId,
             'migration adjustment'                         as operation,
             null                                           as lotnumber,
             ii.expiresOn,
             ii.quantityOnHand - sum(il.quantity)           as quantity, 
             'adjustment by migration process from Gxalert' as notes,
             null                                           as adjustedFrom,
             null                                           as adjustedTo,
             adddate(min(il.createdOn), -1)                    createdOn,
             1                                              as createdBy,
             null                                           as referencedSiteId,
             false                                           as isAutomatic,
             adddate(min(il.createdOn), -1)                 as effectiveDate,
             null                                              gxAlertInventoryLogId
      from InventoryItem as ii
               left join InventoryLog il on ii.id = il.inventoryItemId
               left join ConsumableReason cr on case
                                                    when case
                                                             when sum(il.quantity) - ii.quantityOnHand > 0
                                                                 then cr.externalId = 'asserted_increase'
                                                             else 'asserted_decrease' end
      group by il.inventoryItemId) T
where quantity <> 0;