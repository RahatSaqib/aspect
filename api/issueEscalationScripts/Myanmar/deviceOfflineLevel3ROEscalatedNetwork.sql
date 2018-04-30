-- Are there any level 2 Notifications for this issue which are more than 30 days old?
SELECT EXISTS (
  SELECT n.id
  FROM Notification AS n
  JOIN NotificationType AS nt ON nt.id = n.notificationTypeId AND nt.level = 2
  LEFT JOIN AlertMessage AS am ON am.id = n.alertMessageId
  LEFT JOIN MessageStatus AS amStatus ON amStatus.id = am.messageStatusId
  LEFT JOIN EmailMessage AS em ON em.id = n.emailMessageId
  LEFT JOIN MessageStatus AS emStatus ON emStatus.id = em.messageStatusId
  LEFT JOIN SmsMessage AS sm ON sm.id = n.smsMessageId
  LEFT JOIN MessageStatus AS smStatus ON smStatus.id = sm.messageStatusId
  WHERE n.issueId = {{id}}
  AND COALESCE(n.alertMessageId, n.emailMessageId, n.smsMessageId, 0) <> 0
  AND 'Sent' IN (amStatus.externalId, emStatus.externalId, smStatus.externalId)
  AND DATEDIFF(NOW(), n.createdOn) > 30
) AS ShouldEscalate;
