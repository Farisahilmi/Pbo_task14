-- V1.0.11: Fix malformed trailer URLs that have double ? in query string
UPDATE movies SET trailer_url = REGEXP_REPLACE(trailer_url, '\?si=[^&]*', '', 'g')
WHERE trailer_url LIKE '%?v=%?si=%';

-- Also clean up any remaining ?si= that appear as first param (edge case)
UPDATE movies SET trailer_url = SPLIT_PART(trailer_url, '?si=', 1)
WHERE trailer_url LIKE '%?si=%' AND trailer_url NOT LIKE '%?v=%?si=%';
