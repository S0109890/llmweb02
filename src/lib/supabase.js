import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  keyPrefix: supabaseKey?.substring(0, 20) + '...'
})

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing!')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseKey ? 'exists' : 'MISSING')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
