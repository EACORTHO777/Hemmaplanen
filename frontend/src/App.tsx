import { useEffect , useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  
  function handleLogin() {
    supabase.auth.signInWithOAuth({ provider: 'google'})
  }

  function handleLogout() {
    supabase.auth.signOut()
  }

  if (!session) {
    return <button onClick={handleLogin}>Log in with Google</button>
  }

  return (
    <div>
      <p>Logged in as {session.user.email}</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  )
}