import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to get current user with role
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, error }
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching user profile:', profileError)
    return { user: null, error: profileError }
  }

  return { 
    user: {
      ...user,
      ...profile
    }, 
    error: null 
  }
}

// Helper function to check user role
export const checkUserRole = (user, allowedRoles) => {
  if (!user || !user.role) return false
  return allowedRoles.includes(user.role)
}

// Storage helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  return { data, error }
}

export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

export const deleteFile = async (bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])

  return { data, error }
}
