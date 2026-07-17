import { createClient } from '@supabase/supabase-js'

// Fallback to hardcoded values for Vercel deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bqzcvjvudolqufpvnwnu.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxemN2anZ1ZG9scXVmcHZud251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTE1MjUsImV4cCI6MjA1NDEyNzUyNX0.iAq_KVCnj2S70awC2iZaM3pHdGrvd7LcBbNUFMKCT4w'

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  keyPrefix: supabaseKey?.substring(0, 20) + '...',
  fromEnv: !!import.meta.env.VITE_SUPABASE_URL
})

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing!')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseKey ? 'exists' : 'MISSING')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
