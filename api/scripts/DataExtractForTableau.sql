-- If you front lost connection issues, limit file size (1 run per year seems to work)
SET @startDate = '2019-01-01';
set @currentMonth = @startDate;  
SET @endDate = '2022-01-01'; 
SET @interval = 1; -- Months
SET @fileName = concat('/var/lib/mysql-files/BG_from_',@startDate,'_to_',@endDate,'_', cast(sysdate() as char), '.csv');

DROP TEMPORARY TABLE IF EXISTS ResultExport;

CREATE TEMPORARY TABLE
  `ResultExport` (
    `id` int unsigned NOT NULL DEFAULT '0',
    `TestDate` datetime DEFAULT NULL,
    `SampleId` int unsigned NOT NULL,
    `StartedOn` datetime DEFAULT NULL,
    `EndedOn` datetime DEFAULT NULL,
    `Assay` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `AssayVersion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `Result1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `Result2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `resultText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `PatientAgeYears` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientAgeMonths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientStreet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientCity` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientState` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PatientLga` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `HivStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `PreviouslyTreated` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `Gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `MicroscopyResult` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `RepeatTest` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `TestReason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `HealthFacility` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `RequestorName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `RequestorPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `errorCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ErrorDescription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `AssayName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `AssayHostTestCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `InsertedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `consumableLot` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `instrumentSerial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `moduleSerial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `cartridgeSerial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `cartridgeExpirationDate` datetime DEFAULT NULL,
    `senderVersion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `SenderIp` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `MetacomIp` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `ProbeA` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeB` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeC` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeD` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeE` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeSpc` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Qc1` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Qc2` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeACt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeBCt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeCCt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeDCt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeECt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeSpcCt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Qc1Ct` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Qc2Ct` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeAEndpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeBEndpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeCEndpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeDEndpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeEEndpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `ProbeSpcEndpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Qc1Endpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Qc2Endpt` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `Country` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `State` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `Lga` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
    `DateFirstTest` datetime DEFAULT NULL ,
    `DeviceName`  text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
    `User` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
	`Latitude` float DEFAULT NULL,
	`Longitude` float DEFAULT NULL 
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

DROP PROCEDURE IF EXISTS ExtractDataForTableau;
DELIMITER ;;
CREATE PROCEDURE ExtractDataForTableau()
BEGIN


REPEAT 

INSERT INTO ResultExport
SELECT
  r.id,
  COALESCE(r.endedOn, r.startedOn) AS TestDate,
  r.sampleId AS SampleId,
  r.startedOn AS StartedOn,
  r.endedOn AS EndedOn,
  a.name Assay,
  r.assayVersion AS AssayVersion,
  rc1.name AS Result1,
  rc2.name AS Result2,
  IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) AS resultText,
  COALESCE(
	JSON_VALUE(r.patientData, "$.age" RETURNING CHAR),
    JSON_VALUE(r.patientData, "$.PatientAge" RETURNING CHAR)
  ) as PatientAgeYears,
  TIMESTAMPDIFF(MONTH, JSON_VALUE(r.patientData, "$.Dob" RETURNING DATE)
  , sysdate()) PatientAgeMonths, -- PatientAgeMonths is null -> patientData.$.Dob is not in use (bg, sz, vt at least), No field with patient date of birth. resultData.$.dateOfBirth seems to be always empty. 
  COALESCE(
    JSON_VALUE(r.patientData, "$.phone" RETURNING CHAR),
    JSON_VALUE(r.patientData, "$.patientPhone"  RETURNING CHAR)
  ) as PatientPhone,
  COALESCE(
    JSON_VALUE(r.patientData, "$.name"  RETURNING CHAR),
    JSON_VALUE(r.patientData, "$.patientName"  RETURNING CHAR)
  ) as PatientName,
  COALESCE(
	JSON_VALUE(r.patientData, '$.street' RETURNING CHAR),
    JSON_VALUE(r.patientData, "$.patientStreet"  RETURNING CHAR)
  ) as PatientStreet,
  COALESCE(
	JSON_VALUE(r.patientData, '$.city' RETURNING CHAR),
	JSON_VALUE(r.patientData, '$.patientCity' RETURNING CHAR)
  ) as PatientCity,
  stateo.name as PatientState,
  lgao.name as PatientLga,
  case
    when dis.externalId <> 'hiv' then
      JSON_VALUE(r.patientData, '$.hivStatus' RETURNING CHAR)
    else 'N/A'
  end as HivStatus,
/*  case -- ---------------------------------> custom field not found in Aspect
    when dis.externalId <> 'hiv' then
      r.patientData->>"$.drSuspect"
    end
    else 'N/A'
  end as DrSuspect, */
  CASE
    WHEN IFNULL( JSON_VALUE(r.patientData, '$.previouslyTreated' RETURNING CHAR), '') IN ('Yes', 'true') THEN 'Yes'
    ELSE 'No'
  END PreviouslyTreated,
  -- Note: PreviouslyTreated has less data than GxAlert, for example 'OnTreatment' or 'N/A'
  COALESCE(
	JSON_VALUE(r.patientData, '$.gender' RETURNING CHAR),
	JSON_VALUE(r.patientData, '$.patientGender' RETURNING CHAR)
  ) AS Gender,
  JSON_VALUE(r.patientData, '$.microscopyResult' RETURNING CHAR) AS MicroscopyResult, -- microscopyResult only seems to exists in dev seeding  
  CASE
     JSON_VALUE(r.patientData, '$.repeatTest' RETURNING CHAR)
	WHEN '0' THEN 'First or second'
    WHEN '1' THEN 'Follow-up'
    WHEN '2' THEN 'Repeat Baseline'
    ELSE NULL
  END AS RepeatTest,
  JSON_VALUE(r.resultData, '$.testReasonShortName' RETURNING CHAR) as TestReason, -- testReasonShortName seems to be always null in resultData
  so.name as HealthFacility, -- HealthFacility custom field seems to be in declared for zw, but no present: JSON_VALUE(r.patientData, '$.healthFacility' RETURNING CHAR) as HealthFacility,
  JSON_VALUE(r.patientData, '$.requestorName' RETURNING CHAR) as RequestorName, -- RequestorName only seems to exists in dev seeding lesotho, ethiopia and mozambique (in customFieldsFromGxAlert)
  JSON_VALUE(r.patientData, '$.requestorPhone' RETURNING CHAR) as RequestorPhone,
  r.errorCode,
  -- ec.`Category` AS `ErrorCategory`, -- ------------------------------- error category -> Not found in Aspect
  REGEXP_REPLACE(r.errorCode,'(\r\n|\n|\r)',' ') as ErrorCode,
  REGEXP_REPLACE(r.errorNotes,'(\r\n|\n|\r)',' ') as ErrorDescription,
  a.name as AssayName,
  r.assayVersion as AssayHostTestCode,
  r.createdOn as InsertedOn,
  r.updatedOn,
  r.consumableLot,
  r.instrumentSerial,
  r.moduleSerial,
  r.consumableSerial as cartridgeSerial,
  r.consumableExpirationDate as cartridgeExpirationDate,
  r.senderVersion,
  d.lastPingFromIp as SenderIp,
  CASE
    WHEN d.lastPingFromIp LIKE '169.255%' THEN 'Yes'
    ELSE 'No'
  END AS `MetacomIp`,
  JSON_VALUE(r.resultData, '$.probes.probeA' RETURNING CHAR) AS ProbeA,
  JSON_VALUE(r.resultData, '$.probes.probeB' RETURNING CHAR) AS ProbeB,
  JSON_VALUE(r.resultData, '$.probes.probeC' RETURNING CHAR) AS ProbeC,
  JSON_VALUE(r.resultData, '$.probes.probeD' RETURNING CHAR) AS ProbeD,
  JSON_VALUE(r.resultData, '$.probes.probeE' RETURNING CHAR) AS ProbeE,
  JSON_VALUE(r.resultData, '$.probes.probeSpc' RETURNING CHAR) AS ProbeSpc,
  JSON_VALUE(r.resultData, '$.probes.qc1' RETURNING CHAR) AS Qc1,
  JSON_VALUE(r.resultData, '$.probes.qc2' RETURNING CHAR) AS Qc2,
  JSON_VALUE(r.resultData, '$.probes.probeACt' RETURNING CHAR) AS ProbeACt,
  JSON_VALUE(r.resultData, '$.probes.probeBCt' RETURNING CHAR) AS ProbeBCt,
  JSON_VALUE(r.resultData, '$.probes.probeCCt' RETURNING CHAR) AS ProbeCCt,
  JSON_VALUE(r.resultData, '$.probes.probeDCt' RETURNING CHAR) AS ProbeDCt,
  JSON_VALUE(r.resultData, '$.probes.probeECt' RETURNING CHAR) AS ProbeECt,
  JSON_VALUE(r.resultData, '$.probes.probeSpcCt' RETURNING CHAR) AS ProbeSpcCt,
  JSON_VALUE(r.resultData, '$.probes.qc1Ct' RETURNING CHAR) AS Qc1Ct,
  JSON_VALUE(r.resultData, '$.probes.qc2Ct' RETURNING CHAR) AS Qc2Ct,
  JSON_VALUE(r.resultData, '$.probes.probeAEndpt' RETURNING CHAR) AS ProbeAEndpt,
  JSON_VALUE(r.resultData, '$.probes.probeBEndpt' RETURNING CHAR) AS ProbeBEndpt,
  JSON_VALUE(r.resultData, '$.probes.probeCEndpt' RETURNING CHAR) AS ProbeCEndpt,
  JSON_VALUE(r.resultData, '$.probes.probeDEndpt' RETURNING CHAR) AS ProbeDEndpt,
  JSON_VALUE(r.resultData, '$.probes.probeEEndpt' RETURNING CHAR) AS ProbeEEndpt,
  JSON_VALUE(r.resultData, '$.probes.probeSpcEndpt' RETURNING CHAR) AS ProbeSpcEndpt,
  JSON_VALUE(r.resultData, '$.probes.qc1Endpt' RETURNING CHAR) AS Qc1Endpt,
  JSON_VALUE(r.resultData, '$.probes.qc2Endpt' RETURNING CHAR) AS Qc2Endpt,
  REGEXP_REPLACE(r.notes,'(\r\n|\n|\r)',' ') as Notes
  , c.name as Country
  , st.name as State
  , lg.name as Lga
  , MIN(firstResult.minDate) as DateFirstTest
  , d.name as DeviceName
  , r.senderOperator as 'User'
  , si.latitude as latitude
  , si.longitude as longitude
  -- t.`ValidatedLab`, --------------------------------------------- NOT FOUND
  -- t.`ValidatedLocal`, ------------------------------------------- NOT FOUND
  -- t.`TestExcludeReasonId`, -------------------------------------- NOT FOUND
  -- ter.`Name` AS `TestExcludeReason` ----------------------------- NOT FOUND
FROM
  Result AS r
  INNER JOIN Assay AS a ON r.assayId = a.id
  INNER JOIN AssayType AS at ON a.assayTypeId = at.id
  INNER JOIN Device AS d ON r.deviceId = d.id
  INNER JOIN ResultSource AS rso ON r.resultSourceId = rso.id
  LEFT JOIN DeviceType AS dt ON d.deviceTypeId = dt.id
  LEFT JOIN Disease AS dis ON at.diseaseId = dis.id
  LEFT JOIN PartnerAssay AS pa ON r.assayId = pa.assayId
                                AND r.partnerId = pa.partnerId
  LEFT JOIN Geography AS g ON r.geographyId = g.id
  LEFT JOIN Country AS c ON g.countryId = c.id
  LEFT JOIN State AS st ON g.stateId = st.id
  LEFT JOIN Lga AS lg ON g.lgaId = lg.id
  LEFT JOIN ResultCategory AS rc1 ON r.resultCategory1 = rc1.id
  LEFT JOIN ResultCategory AS rc2 ON r.resultCategory2 = rc2.id
  LEFT JOIN Sample AS sp ON r.sampleId = sp.id
  LEFT JOIN SampleType AS stp ON sp.sampleTypeId = stp.id
  LEFT JOIN Site AS so ON sp.originSiteId = so.id
  LEFT JOIN Site AS si ON r.siteId = si.id
  LEFT JOIN Geography AS go on go.id = so.geographyId
  LEFT JOIN Lga as lgao ON lgao.id = go.lgaId
  LEFT JOIN State as stateo ON go.stateId = stateo.id
  LEFT JOIN (SELECT minr.deviceId, min(minr.endedOn) as minDate from Result as minr group by minr.deviceId) as firstResult on firstResult.deviceId = d.id
  WHERE r.endedOn >= @currentMonth AND r.endedOn < date_add(@currentMonth, INTERVAL @interval MONTH)
  GROUP BY r.id;
    -- ------------------------------------------------------------------------------------------------------
SET @currentMonth = date_add(@currentMonth, INTERVAL @interval MONTH);

UNTIL @currentMonth > @endDate
END REPEAT;
END;;

DELIMITER ;
  
CALL ExtractDataForTableau;

DROP PROCEDURE IF EXISTS ExtractDataForTableau;

SELECT @fileName fileName, count(*) quantity FROM ResultExport;

SET @qry := CONCAT('SELECT *
INTO OUTFILE \'', @fileName, '\' 
    FIELDS TERMINATED BY \',\' 
    OPTIONALLY ENCLOSED BY \'"\'
    ESCAPED BY \'\'
    LINES TERMINATED BY \'\r\n\' 
    FROM ResultExport');
PREPARE stc FROM @qry;
EXECUTE stc;
DEALLOCATE PREPARE stc;
SELECT @filename filename, count(*) register from ResultExport;
DROP TEMPORARY TABLE ResultExport;
