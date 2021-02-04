truncate table DeviceLog;

update Result set resultData = JSON_SET(resultData, "$.patientId", concat("PATIENT-ID-", id)) where id > 0;
update Result set resultData = JSON_SET(resultData, "$.patientFirstName", "First") where id > 0;
update Result set resultData = JSON_SET(resultData, "$.patientMiddleName", "Middle") where id > 0;
update Result set resultData = JSON_SET(resultData, "$.patientLastName", "Last") where id > 0;
update Result set resultData = JSON_SET(resultData, "$.sampleId", "") where id > 0;
update Result set resultData = JSON_SET(resultData, "$.notes", "") where id > 0;

update Result set patientData = JSON_SET(patientData, "$.id", concat("PATIENT-ID-", id)) where id > 0;
update Result set patientData = JSON_SET(patientData, "$.age", "37") where id > 0;
update Result set patientData = JSON_SET(patientData, "$.name", "Name") where id > 0;
update Result set patientData = JSON_SET(patientData, "$.address", "Address") where id > 0;
update Result set patientData = JSON_SET(patientData, "$.phone", "555-1234") where id > 0;
update Result set patientData = JSON_SET(patientData, "$.surname", "Surname") where id > 0;
update Result set patientData = JSON_SET(patientData, "$.dateOfBirth", "") where id > 0;

update Sample set externalId = concat('Sample-', id) where id > 0;

update AlertMessage set message = 'Alert Message' where id > 0;
update EmailMessage set subject = 'Email Subject', body = 'Email Body', htmlBody = 'Email HTML Body' where id > 0;
update SmsMessage set message = 'SMS Message' where id > 0;
update PushNotificationMessage set title = 'Push Title', body = 'Push Body' where id > 0;
update WebhookMessage set headers = null, params = null, payload = null where id > 0;

delete from FormData where id > 0;

update Patient set externalId = concat("PATIENT-ID-", id) where id > 0;

update Person
set email = null,
phone = null,
cell = null
where email <> 'sbaumgartner@systemone.id'
and id > 0;
