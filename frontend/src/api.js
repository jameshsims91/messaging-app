let csrfToken
let csrfRequest

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function readResponse(response) {
  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')

  const data = isJson ? await response.json() : {}

  if (!response.ok) {
    throw new ApiError(
      data.errors?.join(" ") ||
        data.error ||
        `Request failed (${response.status}).`,
      response.status
    )
  }

  if (!isJson) {
    throw new ApiError('The server returned an unexpected response.', response.status)
  }

  return data
}

async function ensureCsrfToken() {
  if (csrfToken) return

  if (!csrfRequest) {
    csrfRequest = fetch('/api/csrf', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(readResponse)
      .then((data) => {
        csrfToken = data.csrf_token
      })
      .finally(() => {
        csrfRequest = undefined
      })
  }

  await csrfRequest
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { Accept: 'application/json' }

  if (method !== 'GET') {
    await ensureCsrfToken()
    headers['X-CSRF-Token'] = csrfToken
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await readResponse(response)

  if (data.csrf_token) {
    csrfToken = data.csrf_token
  }

  return data
} 
