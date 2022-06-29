-- This scripts is meanted to be runned manually.
-- Refer to HD-795 Bangladesh: Need to remove devices

-- Excel formula to check sites:
-- ="select case when date(lastSeenOn) = '"&TEXT(J6;"yyyy-MM-dd")&"' and deviceApprovalId = 2 then 'OLD' else 'CORRECT' end as RECORD,  d.id, lastSeenOn, createdOn, d.deviceApprovalId, siteId, d.name from Device as d where d.name = '"&A6&"';"
-- where A6 = Site Name and J6 = last seen date

SET sql_safe_updates = 0;
-- Before executing, let's replace the placeholders
-- (__INCORRECT_DEVICE_IDS__) are the device ids that you want to merge from
-- ___CORRECT_DEVICE_ID___ is the device id that you want to merge to

SET @toDevice = ___CORRECT_DEVICE_ID___; 
SET @toSite = (SELECT siteId FROM Device WHERE id = @toDevice LIMIT 1); 
UPDATE Device SET deviceMaintenanceStatusLogId = NULL WHERE id IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM DeviceMaintenanceStatusLog WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM DeviceMaintenance WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM DeviceApprovalLog WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM InventoryLog WHERE siteId IN (SELECT siteId FROM Device WHERE id IN (__INCORRECT_DEVICE_IDS__));
DELETE FROM InventoryItem WHERE siteId IN (SELECT siteId FROM Device WHERE id IN (__INCORRECT_DEVICE_IDS__));

UPDATE Result r 
LEFT JOIN Result r2 ON r.externalId = r2.externalId AND r2.deviceId = @toDevice
SET r.deviceId = @toDevice, r.siteId = @toSite
WHERE r.deviceId IN (__INCORRECT_DEVICE_IDS__) AND r2.id IS NULL;

DELETE FROM Notification WHERE resultId IN (SELECT id FROM Result WHERE deviceId IN (__INCORRECT_DEVICE_IDS__));
DELETE FROM EmailMessage WHERE resultId IN (SELECT id FROM Result WHERE deviceId IN (__INCORRECT_DEVICE_IDS__));
DELETE FROM SmsMessage WHERE resultId IN (SELECT id FROM Result WHERE deviceId IN (__INCORRECT_DEVICE_IDS__));
DELETE FROM Result  WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM DeviceOperation WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM DeviceLog WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);
DELETE FROM DeviceApiKey WHERE deviceId IN (__INCORRECT_DEVICE_IDS__);

/* Only activate in case the source site becomes orphaned
UPDATE Site
SET name = 'to delete' 
WHERE id IN (SELECT siteId FROM Device WHERE id IN (__INCORRECT_DEVICE_IDS__))
AND NOT EXISTS (SELECT id FROM Result WHERE siteId IN (SELECT siteId FROM Device WHERE id IN (__INCORRECT_DEVICE_IDS__)));

UPDATE Device 
SET siteId = null
WHERE id IN (__INCORRECT_DEVICE_IDS__);

DELETE FROM Site WHERE name = 'to delete';
*/

DELETE FROM Device WHERE id IN (__INCORRECT_DEVICE_IDS__);