-- Restore only the homepage intro video, preserving all other profile settings.
UPDATE site_settings
SET value = json_set(value, '$.heroVideoUrl', 'https://www.youtube.com/watch?v=UBaeXPFcrYw'),
    updated_at = datetime('now')
WHERE key = 'profile' AND json_valid(value);
