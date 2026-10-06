import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

type Props = {
  onJoined: (householdId: string) => void
}

export default function JoinHousehold({ onJoined }: Props) {
  const [code, setCode] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.rpc('join_household', { code: code})
    if (error) {
      alert(error.message)
      return
    }
    onJoined(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder="Invite code"
      />
      <button type="submit">Join household</button>
    </form>
  )
}