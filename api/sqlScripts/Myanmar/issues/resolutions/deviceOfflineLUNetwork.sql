-- Check if the device is online or inactive reason has been specified
SELECT EXISTS (
         SELECT i.id
         FROM Issue as i
           JOIN Device AS d ON i.deviceId = d.id
           JOIN DeviceStatus AS ds ON d.deviceStatusId = ds.id
           LEFT JOIN IssueEvent AS ie ON i.id = ie.issueId AND ie.`data`->>"$.type" = 'DEVICE_MAINTENANCE'
           LEFT JOIN FactDeviceFlag AS fdf ON i.deviceId = fdf.deviceId
         WHERE i.id = {{id}}
               AND (ds.token = 'decommissioned'
                    OR IFNULL(fdf.`offline`, 0) = 0
                    OR IFNULL(ie.`data`->>"$.options.data.reason", '') <> '')
       ) AS ShouldResolve;
