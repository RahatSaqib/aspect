-- ASP-7977 Device Name Redesign.
--
-- Recovers the original (pre-redesign) device name from Device.notes for devices
-- that were renamed to the `${DeviceType.acronym}${Device.id}` scheme and whose
-- name has NOT since been customised by a user.
--
-- The backfill seed (zz_shared/90_backfill_device_name_to_notes_and_rename.js)
-- stores the original name on the first line of notes as:
--   Original name: <old name>
--
-- 1) PREVIEW what would be recovered (run this first):
SELECT
  d.id,
  d.name AS current_name,
  SUBSTRING(
    SUBSTRING_INDEX(d.notes, '\n', 1),
    LENGTH('Original name: ') + 1
  ) AS original_name
FROM Device d
JOIN DeviceType dt ON dt.id = d.deviceTypeId
WHERE d.notes LIKE 'Original name: %'
  -- only rows still holding the auto-generated name (user has not renamed)
  AND d.name = CONCAT(COALESCE(dt.acronym, 'DV'), d.id);

-- 2) APPLY the recovery (uncomment to run):
-- UPDATE Device d
-- JOIN DeviceType dt ON dt.id = d.deviceTypeId
-- SET
--   d.name = SUBSTRING(SUBSTRING_INDEX(d.notes, '\n', 1), LENGTH('Original name: ') + 1),
--   d.shortName = LEFT(SUBSTRING(SUBSTRING_INDEX(d.notes, '\n', 1), LENGTH('Original name: ') + 1), 45)
-- WHERE d.notes LIKE 'Original name: %'
--   AND d.name = CONCAT(COALESCE(dt.acronym, 'DV'), d.id);
