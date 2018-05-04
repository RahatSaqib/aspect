-- Check if there are any level 2 Notifications for this issue which are more
-- than 30 days old
SELECT EXISTS (
  SELECT n.id
  FROM Notification AS n
  JOIN NotificationType AS nt ON nt.id = n.notificationTypeId AND nt.level = 2
  WHERE n.issueId = {{id}}
  AND DATEDIFF(NOW(), n.createdOn) > 30
) AS ShouldEscalate;
