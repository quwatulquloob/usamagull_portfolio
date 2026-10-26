-- Update the saved profile without changing other profile settings.
UPDATE site_settings
SET value = json_set(value, '$.yearsExp', 4)
WHERE key = 'profile' AND json_valid(value);
