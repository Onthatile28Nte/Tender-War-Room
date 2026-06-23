import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://blqhhrumgsblakzxjuaa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscWhocnVtZ3NibGFrenhqdWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTU2NDIsImV4cCI6MjA5NjQ5MTY0Mn0.9GGT_au6CqkV3oeQXI4TO8iYzx24_qqEfSS5WFtssVM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const uploadWebFile = async (file) => {
  const { data, error } = await supabase.storage
    .from('website-uploads')
    .upload(`public/${file.name}`, file)

  if (error) console.error('Upload failed:', error)
  return data
}