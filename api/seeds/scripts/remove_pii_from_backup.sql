truncate table DeviceLog;
UPDATE Result
SET resultData = JSON_SET(resultData,
                          "$.dateOfBirth", "",
                          "$.surname", "Surname",
                          "$.phone", "555-1234",
                          "$.address", "Address",
                          "$.name", "Name",
                          "$.age", "37",
                          "$.id", CONCAT("PATIENT-ID-", id),
                          "$.notes", "",
                          "$.patientId", CONCAT("PATIENT-ID-", id),
                          "$.patientFirstName", "First",
                          "$.patientMiddleName", "Middle",
                          "$.sampleId", "",
                          "$.patientLastName", "Last")
WHERE id > 0;

update Sample
set externalId = concat('Sample-', id)
where id > 0;

update AlertMessage
set message = 'Alert Message'
where id > 0;

update EmailMessage
set subject  = 'Email Subject',
    body     = 'Email Body',
    htmlBody = 'Email HTML Body',
    `to` = IF(`to` is not null, 'developer@systemone.id', null)
where id > 0;

update SmsMessage
set message     = 'SMS Message',
    phoneNumber = IF(LENGTH(phoneNumber) > 5, '+3333333333', null)
where id > 0;

update PushNotificationMessage
set title = 'Push Title',
    body  = 'Push Body'
where id > 0;

update WebhookMessage
set headers = null,
    params  = null,
    payload = null
where id > 0;

delete
from FormData
where id > 0;

update Patient
set externalId = concat("PATIENT-ID-", id)
where id > 0;

update Person
set email  = IF(LENGTH(email) > 5, 'developer@systemone.id', null),
    email2 = IF(LENGTH(email2) > 5, 'developer@systemone.id', null),
    phone  = IF(LENGTH(phone) > 5, '+1111111111', phone),
    cell   = IF(LENGTH(cell) > 5, '+2222222222', cell)
where id > 0;