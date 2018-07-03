-- Check if there are any Issues with ResultCategory 2 = Detected
SELECT EXISTS (
  SELECT r.id
  FROM Result AS r
  JOIN ResultCategory rc on rc.id = r.resultCategory2
  JOIN Issue as i on i.resultId = r.id
  WHERE i.id = {{id}}
  AND rc.externalId='Detected'
) AS ShouldEscalate;
