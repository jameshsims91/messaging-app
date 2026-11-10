import { useState } from 'react'
import { api } from './api'

export default function ProfileForm({ user, onSaved, onCancel }) {
  const [displayName, setDisplayName] = useState(user.display_name)
  const [bio, setBio] = useState(user.bio ?? "")
  const [error, setError] = useState(useState(""))
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = await api('/profile', {
        method: "PATCH",
        body: {
          user: {
            display_name: displayName.trim(),
            bio,
          }
        }
      })

      onSaved(data.user)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className='card mx-auto' style={{ maxWidth: 600 }}>
      <div className='card-body p-4'>
        <h2 className='h4'>Edit profile</h2>
        <p className='text-secondary'>@{user.username}</p>

        {error && (
          <p className='alert alert-danger' role='alert'>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving}>
            <label htmlFor='profile-name' className='form-label'>
              Display name
            </label>
            <input
              id='profile-name'
              className='form-control mb-3'
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={50}
              required
            />

            <label htmlFor='profile-bio' className='form-label'>
              Bio
            </label>
            <textarea
              id='profile-bio'
              className='form-control'
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={500}
              rows={4}
              aria-describedby='bio-count'
            />
            <p id='bio-count' className='small text-secondary mt-1'>
              {bio.length}/500 characters
            </p>

            <div className='d-flex gap-2'>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={!displayName.trim()}
              >
                {saving ? "Saving..." : "Save profile"}
              </button>

              <button
                type='button'
                className='btn btn-outline-secondary'
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  )
}
