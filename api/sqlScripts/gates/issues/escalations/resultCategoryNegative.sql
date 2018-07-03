-- Check if there are any Issues with ResultCategory 2 = NotDetected
SELECT EXISTS (
  SELECT r.id
  FROM Result AS r
  JOIN ResultCategory rc on rc.id = r.resultCategory2
  JOIN Issue as i on i.resultId = rid
  WHERE i.id = {{id}}
  AND rc.externalId='NotDetected'
) AS ShouldEscalate;
