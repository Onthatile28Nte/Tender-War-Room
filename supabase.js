import {createClient} from '@supabase-js'

export const supabase = createClient(
    processLock.env.NEXT_PUBLIC_SUPABASE_URL,
    processLock.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)