-- ---- > Script to clear data
SET SQL_SAFE_UPDATES = 0;

set @reasonUsed = (select id
                   from ConsumableReason
                   where externalId = 'used');
delete
from InventoryLog
where consumableReasonId <> @reasonUsed;

delete
from MissingInventoryLots;

delete
from FactInventoryConsumptionRate;
SET SQL_SAFE_UPDATES = 1;

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

--  ------------------------------------------------------------------ !!!!!!!!!!!! ----------------> MANUAL STEP: [Import Inventory Item Extraction into mig_InventoryItemPivot]

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
# update mig_InventoryItemPivot
# set errorMessage = concat(ifnull(errorMessage, ''), ' / Negative QoH from GxAlert')
# where quantityOnHand < 0;

-- --> Just styling
update mig_InventoryItemPivot
set errorMessage = substring(errorMessage, 3)
where errorMessage like ' /%';

SET SQL_SAFE_UPDATES = 1;
# select *
# from mig_InventoryItemPivot
# where length(errorMessage) > 0;
-- ------------------------ /Mark wrong inventory items

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
where errorMessage is null;
