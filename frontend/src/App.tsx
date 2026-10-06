import { supabase } from './lib/supabase'

export default function App() {
  function handleLogin() {
    supabase.auth.signInWithOAuth({ provider : 'google' })
  }
  return <button onClick={handleLogin}>Log in with Google</button>
 }

