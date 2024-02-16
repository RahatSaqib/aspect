-- READ ME: https://systemone.youtrack.cloud/articles/ENG-A-360/Tools-for-Analysis

-- Results from not disabled sites
SELECT 'externalId,resultId1,resultId2,deviceId1,deviceId2,hostId1,hostId2,computerId1,computerId2,deviceName1,deviceName2,deviceSerial1,deviceSerial2,cartridgeSerial1,cartridgeSerial2,cartridgeExpirationDate1,cartridgeExpirationDate2,instrumentSerial1,instrumentSerial2,sampleId1,sampleId2,deviceLastPingOn1,deviceLastPingOn2'
UNION
(select CONCAT(r.externalId, ',',
	GROUP_CONCAT(r.id ORDER BY d.name), ',',
    GROUP_CONCAT(r.deviceId ORDER BY d.name), ',',
    GROUP_CONCAT(CONCAT('"', r.resultData->>'$.hostId','"') ORDER BY d.name), ',',
    GROUP_CONCAT(CONCAT('"', r.resultData->>'$.computerId', '"') ORDER BY d.name), ',',
    GROUP_CONCAT(CONCAT('"', d.name,'"') ORDER BY d.name), ',',
    GROUP_CONCAT(CONCAT('"', d.serial,'"') ORDER BY d.name), ',',
    GROUP_CONCAT(r.resultData->>'$.cartridgeSerial' ORDER BY d.name), ',',
    GROUP_CONCAT(r.resultData->>'$.cartridgeExpirationDate' ORDER BY d.name), ',',
    GROUP_CONCAT(r.resultData->>'$.instrumentSerial' ORDER BY d.name), ',',
    GROUP_CONCAT(CONCAT('"', r.resultData->>'$.sampleId', '"') ORDER BY d.name), ',',
    GROUP_CONCAT(CONCAT('"', DATE_FORMAT(d.lastPingOn,'%Y/%m/%d'), '"') ORDER BY d.name))
    as r
from Result r
inner join ResultType rt ON r.resultTypeId = rt.id
inner join Device d ON r.deviceId = d.id
inner join DeviceApproval da ON d.deviceApprovalId = da.id
inner join DeviceMaintenanceStatusLog dml ON d.deviceMaintenanceStatusLogId = dml.id
inner join DeviceMaintenanceStatus dm ON dml.deviceMaintenanceStatusId = dm.id
inner join Site s ON r.siteId = s.id
where endedOn BETWEEN [FROM DATE] AND [TO DATE]
and (s.id is null or s.disabled = 0)
and (da.token = 'approved' or isnull(da.token))
and (dm.externalId is null or not dm.externalId = 'inactiveDecommissioned')
and rt.excluded = false
group by r.externalId
having count(r.id) = 2);
