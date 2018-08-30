-- Check if the device inactive reason has been specified or last test date occurred within the partner's maxDaysDeviceNoResults threshold
SELECT EXISTS (
         SELECT i.id
         FROM Issue as i
           JOIN Device AS d ON i.deviceId = d.id
           JOIN DeviceStatus AS ds ON d.deviceStatusId = ds.id
           LEFT JOIN Partner AS p ON d.partnerId = p.id
           LEFT JOIN Result AS r ON r.deviceId = d.id
                                    AND COALESCE(r.endedOn, r.startedOn) IS NOT NULL
         WHERE i.id = {{id}}
               AND (ds.token = 'decommissioned'
                    OR (IFNULL(d.`configurationData`->>"$.inactive", '') = 'true' AND IFNULL(d.`configurationData`->>"$.inactiveMaintenanceReason", '') <> '')
                    OR p.maxDaysDeviceNoResults IS NULL
                    OR IFNULL(DATEDIFF(NOW(), COALESCE(r.endedOn, r.startedOn)), IFNULL(p.maxDaysDeviceNoResults, 0) + 1) < p.maxDaysDeviceNoResults)
       ) AS ShouldResolve;
