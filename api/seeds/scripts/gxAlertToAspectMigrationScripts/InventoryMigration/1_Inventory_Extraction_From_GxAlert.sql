/*
Note:
 Consumtions from use are already procesed in Aspect, as we imported the results using the Api, which impact on inventory. 
 At the moment of wipe the inventory records in Aspect, movements that came from use will be preservated.
 As for Missing Lots, they should be compensated when the scheduler run after the migration.
*/

use bigpicture;
-- Export inventory_location records to migrate to inventory item
SELECT il.inventory_location_id gxAlertInventoryLocationId,
    (CASE WHEN ii.externalId = 'cartridge-tb' THEN 'GxMtbRifCartridge'
	WHEN ii.externalId = 'cartridge-ebola' THEN 'GxEbolaCartridge'
	WHEN ii.externalId = 'cartridge-hiv-qual' THEN 'GxHiv1QualCartridge'
	WHEN ii.externalId = 'cartridge-tb-ultra' THEN 'GxMtbRifUltraCartridge'
	WHEN ii.externalId = 'cartridge-hcv' THEN 'GxHCVCartridge'
	WHEN ii.externalId = 'cartridge-hiv-vl' THEN 'GxHiv1VlCartridge'
	WHEN ii.externalId IS NULL THEN 'assayGXCovid19Cartridge'
    ELSE ii.externalId END) as consumableExternalId,
    l.externalId as siteExternalId,
    il.expiration_date as expiresOn,
    il.created_on as createdOn,
    il.updated_on as updatedOn,
    SUM(il.current_quantity) as quantityOnHand
FROM
    bigpicture.inventory_location il
INNER JOIN
	bigpicture.inventory_item ii ON il.inventory_item_id = ii.id
INNER JOIN
	bigpicture.location l ON il.location_id = l.id
GROUP BY il.inventory_item_id, il.location_id, il.expiration_date, il.updated_on;

-- Export to generate inventory logs about any other transactions than transfers and use
-- this will be used for generating transfers, outcome inventory logs, and income inventory logs
SELECT
	ilog.inventory_location_id,
	ilog.id as inventory_log_id,
    ir.externalId inventory_reason_externalId, -- will be always 'received'
    (CASE
        WHEN ii.externalId = 'cartridge-tb' THEN 'GxMtbRifCartridge'
        WHEN ii.externalId = 'cartridge-ebola' THEN 'GxEbolaCartridge'
        WHEN ii.externalId = 'cartridge-hiv-qual' THEN 'GxHiv1QualCartridge'
        WHEN ii.externalId = 'cartridge-tb-ultra' THEN 'GxMtbRifUltraCartridge'
        WHEN ii.externalId = 'cartridge-hcv' THEN 'GxHCVCartridge'
        WHEN ii.externalId = 'cartridge-hiv-vl' THEN 'GxHiv1VlCartridge'
        WHEN ii.externalId IS NULL THEN 'assayGXCovid19Cartridge'
        ELSE 'UNKNOWN!'
    END) AS consumableExternalId,
    il.expiration_date AS expiresOn,
    sl.externalId AS sourceSiteExternalId,
    dl.externalId AS destinationSiteExternalId,
    ilog.quantity AS quantity,
    ilog.created_on AS createdOn,
    ilog.created_on AS updatedOn
FROM
    bigpicture.inventory_log AS ilog
		INNER JOIN
	bigpicture.inventory_reason AS ir ON ilog.reason_id = ir.id
        INNER JOIN
    bigpicture.location AS dl ON ilog.destination_location_id = dl.id
        INNER JOIN
    bigpicture.location AS sl ON ilog.source_location_id = sl.id
        INNER JOIN
    bigpicture.inventory_location AS il ON ilog.inventory_location_id = il.inventory_location_id
        INNER JOIN
    bigpicture.inventory_item AS ii ON il.inventory_item_id = ii.id
WHERE
    source_location_id IS NOT NULL
	AND ir.externalId = 'received'
union
-- Export to generate inventory logs about any other transactions than transfers and use
SELECT ilog.inventory_location_id,
		ilog.id as inventory_log_id,
        ir.externalId inventory_reason_externalId,
    (CASE
        WHEN ii.externalId = 'cartridge-tb' THEN 'GxMtbRifCartridge'
        WHEN ii.externalId = 'cartridge-ebola' THEN 'GxEbolaCartridge'
        WHEN ii.externalId = 'cartridge-hiv-qual' THEN 'GxHiv1QualCartridge'
        WHEN ii.externalId = 'cartridge-tb-ultra' THEN 'GxMtbRifUltraCartridge'
        WHEN ii.externalId = 'cartridge-hcv' THEN 'GxHCVCartridge'
        WHEN ii.externalId = 'cartridge-hiv-vl' THEN 'GxHiv1VlCartridge'
        WHEN ii.externalId IS NULL THEN 'assayGXCovid19Cartridge'
        ELSE 'UNKNOWN!'
    END) AS consumableExternalId,
    il.expiration_date AS expiresOn,
    null AS sourceSiteExternalId,
    null AS destinationSiteExternalId,
    ilog.quantity AS quantity,
    ilog.created_on AS createdOn,
    ilog.created_on AS updatedOn
FROM
    bigpicture.inventory_log AS ilog
		INNER JOIN
	bigpicture.inventory_reason AS ir ON ilog.reason_id = ir.id
        INNER JOIN
    bigpicture.inventory_location AS il ON ilog.inventory_location_id = il.inventory_location_id
        INNER JOIN
    bigpicture.inventory_item AS ii ON il.inventory_item_id = ii.id
WHERE ir.externalId NOT IN ('received', 'used', 'sent');