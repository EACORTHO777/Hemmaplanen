import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

type Props = {
  onCreated: (householdId: string) => void
}

export default function CreateHousehold({ onCreated }: Props) {
  const [name, setName] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.rpc('create_household', { household_name: name})
    if (error) {
      alert(error.message)
      return
    }
    onCreated(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Household name"
      />
      <button type="submit">Create household</button>
    </form>
  )
}