-- This file contains queries for generating fixture files that are used for migrating clients from GxAlert to Aspect
-- See the README file for more details on how to use these
-- If exporting the results of these queries to a text file, the results might by text formatted with escape double quotes.
--  You can find & replace these with the following capture group find expression ""([A-Za-z0-9\s\\\.\:\-ç\()\;#']*)""
--  and replace with "$1"
-- Be sure to limit these by countryId if you're migrating data for a country that is using our cloud server

-- Query Country With States & LGAs in GxAlert
-- This is for the geography.json fixture

-- SET @CountryName='United States'; -- For example United States

SELECT CONCAT(
  '{"abbreviation":"', country.Abbreviation,
  '","name":"', country.Name,
  '","a3":"', country.A3,
  '","culture":"', country.Culture,
  '","countryCode":"', Country.CountryCode,
  '","timezone":"', Country.TimeZoneId,
  '","portNumber":', Country.PortNumber,
  ',"exportColumns":"', Country.ExportColumns,
  '","inventoryDaysThreshold":', Country.InventoryDaysThreshold,
  ',"monthStartsOnDay":', IFNULL(Country.MonthStartsOnDay, '1'),
  ',"states":[') AS countryJSON
FROM Country
WHERE Country.Name IS NOT NULL
AND Country.A3 IS NOT NULL
AND Country.Name = @CountryName
UNION
SELECT CONCAT(
    '{"name":"', State.Name, '",',
    IFNULL(CONCAT('"abbreviation":"', State.Abbreviation, '",'), ''),
    '"lgas":[', IFNULL((SELECT GROUP_CONCAT(CONCAT('{"name":"', Lga.Name, '"}')) FROM Lga WHERE Lga.Name IS NOT NULL AND Lga.StateId = State.StateId), ''), ']',
    '},') AS countryJSON
FROM Country
JOIN State ON State.CountryId = Country.CountryId
WHERE Country.Name IS NOT NULL
AND Country.A3 IS NOT NULL
AND Country.Name = @CountryName
UNION
SELECT ']}' AS countryJSON;


-- Query Sites in GxAlert
-- This is for the sitesFromGxAlert.json fixture
SET SQL_SAFE_UPDATES = 0;
UPDATE location SET externalId = name WHERE externalId IS NULL;
SET SQL_SAFE_UPDATES = 1;


SET @warehouse_location_type_id = (select id
                                   from location_type
                                   where name = 'Warehouse');
SELECT 
CONCAT('{ ',
'"externalId": "', location.externalId, '",',
'"type": "', LOWER(location_type.name), '",',
IFNULL(CONCAT('"latitude": ', CAST(deployment.Latitude AS CHAR), ','), ''),
IFNULL(CONCAT('"longitude": ', CAST(deployment.Longitude AS CHAR), ','), ''),
IFNULL(CONCAT('"stateName": "', state.Name, '",'), ''),
IFNULL(CONCAT('"lgaName": "', lga.Name, '",'), ''),
IFNULL(CONCAT('"name": "', IFNULL(deployment.Description, location.externalId), '",'), ''),
IFNULL(CONCAT('"shortName": "', deployment.ShortName, '",'), ''),
'"customProperties": "', IFNULL(REPLACE(location.CustomProperties, '"', '\\"'), ''), '",',
IFNULL(CONCAT('"timeZoneId": "', deployment.TimeZoneId, '",'), ''),
IFNULL(CONCAT('"warehouse_externalId": "', IFNULL(wh.externalId, IFNULL(lga_warehouse.externalId, state_warehouse.externalId)), '",'), ''),
IFNULL(CONCAT('"warehouse_source": "',CASE
WHEN wh.externalId IS NOT NULL THEN 'site'
WHEN lga_warehouse.id IS NOT NULL THEN 'lga'
WHEN state_warehouse.id IS NOT NULL THEN 'state'
ELSE 'no warehouse' END, '"'), ''),
COALESCE(
        CONCAT(
                ', "devices": [', GROUP_CONCAT(
                DISTINCT
                CONCAT('{ "name": "', deployment.Description, '", "shortName": "', deployment.ShortName,
                        '", "macAddress": "', device.ComputerId, '", "hostId": "', device.HostId,
                        '", "serial": "', device.Serial, '", "gxAlertDeviceId": ',
                        CAST(device.DeviceId AS CHAR), ', "apiKey": "', IFNULL(deviceapikey.Token, 'null'),
                        '" },')
            ), ']'
            ), ''),
'},') AS             JSONObject
FROM location
LEFT JOIN location_type ON location.location_type_id = location_type.id
LEFT JOIN location as wh on wh.id = location.location_id
LEFT JOIN location lga_warehouse on lga_warehouse.lga_id = location.lga_id and
                                    lga_warehouse.location_type_id = @warehouse_location_type_id
LEFT JOIN location state_warehouse on state_warehouse.state_id = location.state_id and
                                      state_warehouse.location_type_id = @warehouse_location_type_id
LEFT JOIN state ON state.stateId = location.state_id
LEFT JOIN Country ON location.country_id = Country.CountryId
LEFT JOIN lga ON lga.LgaId = location.lga_id
LEFT JOIN deployment ON location.id = deployment.LocationId
LEFT JOIN device ON device.CurrentDeploymentId = deployment.DeploymentId
LEFT JOIN deviceapikey ON deviceapikey.DeviceId = device.DeviceId
WHERE ((deployment.Approved = 1 AND deployment.HideOnDashboard = 0) OR deployment.DeploymentId IS NULL)
   AND Country.Name = @CountryName AND IF (@CountryName = 'Pakistan', location.versions LIKE '%new-2020%' or location.location_Type_Id = @warehouse_location_type_id , 1=1)
GROUP BY location.id
  ORDER BY CASE WHEN location.location_type_id = @warehouse_location_type_id THEN (CASE WHEN wh.id IS NULL THEN 0 ELSE 1 END) ELSE 2 END;





-- Query Contacts in GxAlert
-- This is for the contactsFromGxAlert.json fixture
SELECT
CONCAT(
'{ "personName": "',  person.Name,
COALESCE(CONCAT('", "personTitle": "', person.Title), ''),
CASE WHEN role.`Name` IS NOT NULL THEN '", "jobFunctions": [ "' ELSE '",' END, CASE WHEN role.Name = 'National Level' THEN 'Admin' WHEN role.Name IN ('State Level', 'LGA Level') THEN 'Regional Officer' WHEN role.Name = 'Lab Level' THEN 'Lab User' ELSE '' END,
CASE WHEN role.`Name` IS NOT NULL THEN '" ], ' ELSE '' END, COALESCE(CONCAT('"personEmailAddress": "', person.Email, '", '), ''),
COALESCE(CONCAT('"personPhone": "', person.Phone, '", '), ''),
COALESCE(CONCAT('"personCell": "', person.Cell, '", '), ''),
COALESCE(CONCAT('"username": "', my_aspnet_users.name, '", '), ''),
COALESCE(CONCAT('"timezone": "', person.TimeZoneId, '", '), ''),
'"hidePatientId": ', COALESCE(CASE WHEN person.HidePatientId = 1 THEN 'true' END, 'false'),
', "hideSampleId": ', COALESCE(CASE WHEN person.HideSampleId = 1 THEN 'true' END, 'false'),
', "hideNotes": ', COALESCE(CASE WHEN person.HideNotes = 1 THEN 'true' END, 'false'),
', "getPasswordFromGxAlert": true',
COALESCE(CONCAT(', "geographies": [ ', CASE WHEN role.Name = 'National Level' THEN '{}'
                                          WHEN role.Name = 'State Level' THEN GROUP_CONCAT(DISTINCT CONCAT('{ "stateName": "', personstate_state.Name, '" }'))
                                          WHEN role.Name = 'LGA Level' THEN GROUP_CONCAT(DISTINCT CONCAT('{ "stateName": "', personlgastate_state.Name, '", "lgaName": "', personlga_lga.Name, '" }'))
                                     END, ' ]'), ''),
COALESCE(CONCAT(', "sites": [ ', CASE WHEN role.Name = 'Lab Level' THEN GROUP_CONCAT(DISTINCT CONCAT('{ "shortName": "', persondeployment_deployment.ShortName, '" }')) END, ' ], '), ''),
'}') AS jsonObject
FROM person
LEFT JOIN my_aspnet_users ON my_aspnet_users.id = person.UserId
LEFT JOIN state ON state.StateId = person.StateId
LEFT JOIN Country ON person.CountryId = Country.CountryId
LEFT JOIN lga ON lga.LgaId = person.LgaId
LEFT JOIN deployment ON deployment.DeploymentId = person.DeploymentId
LEFT JOIN role ON role.RoleId = person.RoleId
LEFT JOIN persondeployment ON persondeployment.PersonId = person.PersonId
LEFT JOIN deployment AS persondeployment_deployment ON persondeployment_deployment.DeploymentId = persondeployment.DeploymentId
LEFT JOIN personlga ON personlga.PersonId = person.PersonId
LEFT JOIN lga AS personlga_lga ON personlga_lga.LgaId = personlga.LgaId
LEFT JOIN state AS personlgastate_state ON personlgastate_state.StateId = personlga_lga.StateId
LEFT JOIN personstate ON personstate.PersonId = person.PersonId
LEFT JOIN state AS personstate_state ON personstate_state.StateId = personstate.StateId
WHERE Country.Name = @CountryName
GROUP BY person.PersonId;

-- Query Custom Fields in GxAlert (Deprecated)
-- Read more: https://systemone.youtrack.cloud/articles/ASP-A-260276849/Custom-Fields


-- Query deviceConfiguration (attribute inside of partnerData)
SELECT CONCAT(
	"deviceConfiguration: [{ deviceType: 'GeneXpert', data: ", cs.SettingsJson, "}]")
FROM connectsettings CS left join country c on c.CountryId = cs.CountryId  WHERE c.Name = @CountryName;