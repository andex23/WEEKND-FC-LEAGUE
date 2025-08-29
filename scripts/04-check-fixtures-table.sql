-- Check the actual structure of the fixtures table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'fixtures' 
ORDER BY ordinal_position;

-- Show any existing data
SELECT COUNT(*) as total_fixtures FROM public.fixtures;

-- Show a sample row if any exist
SELECT * FROM public.fixtures LIMIT 1;
