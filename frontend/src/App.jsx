import { useEffect, useState } from 'react'
import { api } from './api'
import MessagingApp from './MessagingApp'
import ProfileForm from './ProfileForm'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startupError, setStartupError] = useState("")
  const [logoutError, setLogoutError] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const data = await api('/session')
        if (active) setUser(data.user)
      } catch (error) {
        if (active && error.status !== 401) {
          setStartupError(error.message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  async function logout() {
    setLoggingOut(true)
    setLogoutError("")

    try {
      await api('/session', { method: "DELETE" })
      setUser(null)
      setEditingProfile(false)
      setNotice('')
    } catch (error) {
      setLogoutError(error.message)
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return <p className='container py-5' role='status'>Loading your account...</p>
  }

  if (startupError) {
    return (
      <main className='container py-5'>
        <p className='alert alert-danger' role='alert'>{startupError}</p>
        <button
          className='btn btn-primary'
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    )
  }

  return (
    <main className='container py-5 app-shell'>
      <h1 className='mb-4 app-brand'>
        <i className='bi bi-chat-square-text-fill me-2' aria-hidden='true' />
         Messaging App
      </h1>

      {user ? (
        <section>
          <header className='d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4'>
            <div>
              <h2 className='h4'>Welcome, {user.display_name}!</h2>
              <p className='text-secondary mb-1'>@{user.username}</p>
              {user.bio && (
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {user.bio}
                </p>
              )}
            </div>

            <div className='d-flex gap-2'>
              <button
                className='btn btn-outline-primary'
                onClick={() => {
                  setEditingProfile(true)
                  setNotice('')
                }}
                disabled={editingProfile || loggingOut}
              >
                Edit profile
              </button>

              <button
                className='btn btn-outline-danger'
                onClick={logout}
                disabled={loggingOut || editingProfile}
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </header>

          {notice && (
            <p className='alert alert-success' role='status'>
              {notice}
            </p>
          )}

          {logoutError && (
            <p className='alert alert-danger' role='alert'>
              {logoutError}
            </p>
          )}

          {editingProfile ? (
            <ProfileForm
              user={user}
              onSaved={(updatedUser) => {
                setUser(updatedUser)
                setEditingProfile(false)
                setNotice("Profile updated.")
              }}
              onCancel={() => setEditingProfile(false)}
            />
          ) : (
            <MessagingApp key={user.id} user={user} />
          )}
        </section>
      ) : (
        <AuthForm onAuthenticated={setUser} />
      )}
    </main>
  )
}

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const signingUp = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const values = Object.fromEntries(new FormData(event.currentTarget))

    try {
      const data = await api(
        signingUp ? '/registration' : '/session',
        {
          method: "POST",
          body: signingUp
            ? { user: values }
            : { email: values.email, password: values.password },
        }
      )

      onAuthenticated(data.user)
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(signingUp ? 'login' : 'signup')
    setError('')
  }

  return (
    <section className='card shadow-sm mx-auto auth-card' style={{ maxWidth: 480 }}>
      <div className='card-body p-4'>
        <h2 className='h4 mb-4'>
          {signingUp ? 'Create your account' : 'Log in'}
        </h2>

        {error && (
          <p className='alert alert-danger' role='alert'>{error}</p>
        )}

        <form key={mode} onSubmit={handleSubmit}>
          <fieldset disabled={submitting}>
            {signingUp && (
              <>
                <label className='form-label' htmlFor='username'>
                  Username
                </label>
                <input
                  className='form-control mb-3'
                  id='username'
                  name='username'
                  autoComplete='username'
                  minLength={3}
                  maxLength={30}
                  pattern='[A-Za-z0-9_]+'
                  title='Use letters, numbers, and underscores.'
                  required
                />

                <label className='form-label' htmlFor='display-name'>
                  Display name
                </label>
                <input
                  className='form-control mb-3'
                  id='display-name'
                  name='display_name'
                  maxLength={50}
                  required
                />
              </>
            )}

            <label className='form-label' htmlFor='email'>Email</label>
            <input
              className='form-control mb-3'
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              required
            />

            <label className='form-label' htmlFor='password'>Password</label>
            <input
              className='form-control mb-3'
              id='password'
              name='password'
              type='password'
              autoComplete={signingUp ? 'new-password' : 'current-password'}
              minLength={signingUp ? 12 : undefined}
              required
            />

            {signingUp && (
              <>
                <label className='form-label' htmlFor='password-confirmation'>
                  Confirm password
                </label>
                <input
                  className='form-control mb-3'
                  id='password-confirmation'
                  name='password_confirmation'
                  type='password'
                  autoComplete='new-password'
                  minLength={12}
                  required
                />
              </>
            )}

            <button className='btn btn-primary w-100' type='submit'>
              {submitting
                ? 'Please wait...'
                : signingUp ? 'Create account' : 'Log in'}
            </button>
          </fieldset>
        </form>

        <button
          className='btn btn-link mt-3 p-0'
          type='button'
          onClick={switchMode}
          disabled={submitting}
        >
          {signingUp
            ? 'Already have an account? Log in'
            : 'Need an account? Sign up'}
        </button>
      </div>
    </section>
  )
}
