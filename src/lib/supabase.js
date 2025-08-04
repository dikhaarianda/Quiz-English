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
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Helper function to get current user with role - improved error handling
export const getCurrentUser = async () => {
  try {
    // Use getSession instead of getUser for better reliability
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return { user: null, error: sessionError }
    }

    if (!session?.user) {
      return { user: null, error: null }
    }

    const user = session.user

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Return user with basic info if profile fetch fails
      return { 
        user: {
          id: user.id,
          email: user.email,
          ...user.user_metadata
        }, 
        error: null 
      }
    }

    return { 
      user: {
        ...user,
        ...profile
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return { user: null, error }
  }
}

// Helper function to check user role
export const checkUserRole = (user, allowedRoles) => {
  if (!user || !user.role) return false
  return allowedRoles.includes(user.role)
}

// Storage helpers
export const uploadFile = async (bucket, path, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    return { data, error }
  } catch (error) {
    console.error('Upload error:', error)
    return { data: null, error }
  }
}

export const getPublicUrl = (bucket, path) => {
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  } catch (error) {
    console.error('Get public URL error:', error)
    return null
  }
}

export const deleteFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path])

    return { data, error }
  } catch (error) {
    console.error('Delete file error:', error)
    return { data: null, error }
  }
}