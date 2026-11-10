import { useEffect, useState } from 'react'
import { api } from './api'
import Chat from './Chat'

export default function MessagingApp({ user }) {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [opening, setOpening] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    let active = true

    api('/conversations')
      .then((data) => {
        if (active) setConversations(data.conversations)
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

      return () => {
        active = false
      }
  }, [])

  async function refreshConversations() {
    setError('')
    setLoading(true)

    try {
      const data = await api('/conversations')
      setConversations(data.conversations)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function searchUsers(event) {
    event.preventDefault()
    setSearching(true)
    setError('')
    setSearched(false)
    setResults([])

    try {
      const data = await api(`/users?q=${encodeURIComponent(query.trim())}`)
      setResults(data.users)
      setSearched(true)
    } catch (error) {
      setError(error.message)
    } finally {
      setSearching(false)
    }
  }

  async function openConversation(recipient) {
    setOpening(true)
    setError('')

    try {
      const data = await api('/conversations', {
        method: "POST",
        body: { recipient_id: recipient.id },
      })

      setConversations((current) => [
        data.conversation,
        ...current.filter((chat) => chat.id !== data.conversation.id),
      ])
      setSelected(data.conversation)
      setResults([])
      setSearched(false)
      setQuery('')
    } catch (error) {
      setError(error.message)
    } finally {
      setOpening(false)
    }
  }

  function conversationName(conversation) {
    return conversation.participants
      .filter((participant) => participant.id !== user.id)
      .map((participant) => participant.display_name)
      .join(', ')
  }

  return (
    <section>
      {error && (
        <p className='alert alert-danger' role='alert'>{error}</p>
      )}

      <div className='row g-4'>
        <aside className={`col-md-4 conversation-sidebar ${selected ? 'd-none d-md-block' : ""}`}>
          <h2 className='h5'>New conversation</h2>

          <form onSubmit={searchUsers} className='mb-3'>
            <label htmlFor='user-search' className='form-label'>
              Search by username
            </label>
            <div className='input-group'>
              <input
                id='user-search'
                className='form-control'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={30}
              />
              <button className='btn btn-primary' disabled={searching || opening}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          <div className='list-group mb-4'>
            {results.map((person) => (
              <button
                key={person.id}
                className='list-group-item list-group-item-action'
                onClick={() => openConversation(person)}
                disabled={opening}
              >
                {person.display_name}
                <small className='d-block text-secondary'>
                  @{person.username}
                </small>
              </button>
            ))}
          </div>

          {searched && results.length === 0 && (
            <p role='status'>No users found.</p>
          )}

          <div className='d-flex justify-content-between align-items-center mb-3'>
            <h2 className='h5 mb-0'>Conversations</h2>
            <button
              className='btn btn-sm btn-outline-secondary'
              onClick={refreshConversations}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading && <p role='status'>Loading conversations...</p>}

          {!loading && conversations.length === 0 && (
            <p>No conversations yet. Find someone above to get started.</p>
          )}

          <div className='list-group'>
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`list-group-item list-group-item-action ${
                  selected?.id === conversation.id ? "active" : ""
                }`}
                onClick={() => setSelected(conversation)}
                aria-pressed={selected?.id === conversation.id}
              >
                {conversationName(conversation)}
              </button>
            ))}
          </div>
        </aside>

        <div className={`col-md-8 ${selected ? "" : 'd-none d-md-block'}`}>
          {selected ? (
            <Chat
              key={selected.id}
              conversation={selected}
              user={user}
              onBack={() => setSelected(null)}
            />
          ) : (
            <p className='text-secondary p-4 border rounded'>
              Choose a conversation or find someone to message.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
