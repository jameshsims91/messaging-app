import { useEffect, useRef, useState } from 'react'
import { api } from './api'

export default function Chat({ conversation, user, onBack }) {
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const requestVersion = useRef(0)

  const title = conversation.participants
    .filter((participant) => participant.id !== user.id)
    .map((participant) => participant.display_name)
    .join(", ")

  useEffect(() => {
    let active = true

    api(`/conversations/${conversation.id}/messages`)
      .then((data) => {
        if (active) {
          setMessages(data.messages)
          setHasOlder(data.messages.length === 50)
        }
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      requestVersion.current += 1
    }
  }, [conversation.id])

  async function refreshMessages() {
    const version = ++requestVersion.current
    setLoading(true)
    setError('')

    try {
      const data = await api(`/conversations/${conversation.id}/messages`)

      if (version === requestVersion.current) {
        setMessages(data.messages)
        setHasOlder(data.messages.length === 50)
      }
    } catch (error) {
      if (version === requestVersion.current) setError(error.message)
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    if (!body.trim() || sending || loading || loadingOlder) return

    setSending(true)
    setError('')

    try {
      const data = await api (`/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: { message: { body } },
      })

      setMessages((current) => [...current, data.message])
      setBody('')
    } catch (error) {
      setError(error.message)
    } finally {
      setSending(false)
    }
  }

  async function loadOlderMessages() {
    if (loadingOlder || loading || sending || !messages.length) return

    setLoadingOlder(true)
    setError('')

    try {
      const oldestId = messages[0].id
      const data = await api(
        `/conversations/${conversation.id}/messages?before_id=${oldestId}`
      )

      setMessages((current) => {
        const existingIds = new Set(current.map((message) => message.id))
        const older = data.messages.filter(
          (message) => !existingIds.has(message.id)
        )

        return [...older, ...current]
      })

      setHasOlder(data.messages.length === 50)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoadingOlder(false)
    }
  }

  return (
    <section className='card chat-panel'>
      <header className='card-header d-flex align-items-center gap-3'>
        <button
          className='btn btn-sm btn-outline-secondary d-md-none'
          onClick={onBack}
        >
          Back
        </button>
        <h2 className='h5 mb-0 flex-grow-1'>{title}</h2>
        <button
          className='btn btn-sm btn-outline-secondary'
          onClick={refreshMessages}
          disabled={loading || sending || loadingOlder}
        >
          Refresh
        </button>
      </header>

      <div
        className='card-body overflow-auto chat-history'
      >
        {error && (
          <p className='alert alert-danger' role='alert'>{error}</p>
        )}

        {loading && <p role='status'>Loading messages...</p>}

        {!loading && messages.length === 0 && <p>Say hello!</p>}

        {hasOlder && (
          <div className='text-center mb-3'>
            <button
              type='button'
              className='btn btn-sm btn-outline-secondary'
              onClick={loadOlderMessages}
              disabled={loading || loadingOlder || sending}
            >
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        <ol className='list-unstyled mb-0'>
          {messages.map((message) => {
            const mine = message.user.id === user.id

            return (
              <li
                key={message.id}
                className={`d-flex mb-3 ${mine ? 'justify-content-end' : ''}`}
              >
                <div className={`message-bubble ${mine ? "message-mine" : "message-theirs"}`}>
                  <strong className='d-block small'>
                    {message.user.display_name}
                  </strong>
                  <p className='mb-1' style={{ whiteSpace: 'pre-wrap' }}>
                    {message.body}
                  </p>
                  <time className='small' dateTime={message.created_at}>
                    {new Date(message.created_at).toLocaleString()}
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <form className='card-footer' onSubmit={sendMessage}>
        <label htmlFor='message-body' className='form-label'>
          Message
        </label>
        <textarea
          id='message-body'
          className='form-control mb-2'
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={5000}
          rows={3}
          disabled={sending}
          required
        />
        <button
          className='btn btn-primary'
          disabled={loading || loadingOlder || sending || !body.trim()}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  )
}