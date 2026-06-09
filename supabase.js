import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://blqhhrumgsblakzxjuaa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscWhocnVtZ3NibGFrenhqdWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTU2NDIsImV4cCI6MjA5NjQ5MTY0Mn0.9GGT_au6CqkV3oeQXI4TO8iYzx24_qqEfSS5WFtssVM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)