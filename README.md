# Messaging App

A full-stack messaging app built with Ruby on Rails and React for The Odin Project. Create an account, find other users, exchange private messages, and customize your profile.

[Live demo](https://messaging-app-kuax.onrender.com) · [Source code](https://github.com/jameshsims91/messaging-app)

## Features

- Sign up, log in, and log out with cookie-based sessions.
- Search users by username and start direct conversations.
- Send text messages and load older message history.
- Edit your display name and bio.
- Access conversations only when you are a participant.
- Responsive layouts for desktop and mobile.

Messages update when a conversation opens, after sending, or when you click **Refresh**. Real-time updates, image attachments, and group chats are not implemented.

## Built with

- **Backend:** Ruby on Rails, PostgreSQL, bcrypt
- **Frontend:** React, Vite, Bootstrap, Bootstrap Icons
- **Testing:** Minitest integration tests, ESLint
- **Deployment:** Docker on Render, PostgreSQL on Neon

Rails serves the compiled React frontend and JSON API from the same origin in production. Authentication uses session cookies and Rails CSRF protection. API responses expose selected public user fields rather than password hashes or email addresses.

## Local setup

Install Ruby matching `.ruby-version`, Bundler, PostgreSQL, Node.js, npm, and Yarn Classic 1.22.22. Ensure PostgreSQL is running and your local role can create the development and test databases configured in `config/database.yml`.

```bash
git clone https://github.com/jameshsims91/messaging-app.git
cd messaging-app
bundle install
yarn install --frozen-lockfile
bin/rails db:prepare
cd frontend
npm ci
```

If your local PostgreSQL role requires credentials, configure them locally without committing passwords.

Start Rails from the project root:

```bash
bin/dev
```

In a second terminal, start React:

```bash
cd frontend
npm run dev
```

Open [localhost:5173](http://localhost:5173). Vite forwards `/api` requests to Rails on port 3000. Create an account through the signup form; no demo accounts are seeded automatically.

To serve the compiled frontend through Rails instead:

```bash
cd frontend
npm run build
```

With Rails running, open [localhost:3000](http://localhost:3000). Rebuild the frontend after changes when using this approach.

## Checks

From the project root:

```bash
RAILS_ENV=test bin/rails db:prepare
bundle exec ruby -Itest test/integration/messaging_api_test.rb
```

The integration suite covers authentication, logout, conversation access, sender identity, blank messages, profile update restrictions, conversation reuse, and message pagination.

From `frontend`:

```bash
npm run lint
npm run build
```

## Data model

| Model | Purpose |
| --- | --- |
| User | Account credentials and profile |
| Conversation | A direct chat, identified by a unique participant pair |
| ConversationMembership | Connects users to their conversations |
| Message | Message body, sender, conversation, and timestamps |

## API

All routes below use the `/api` prefix. Except for the CSRF, signup, and login endpoints, they require authentication. State-changing requests require a valid CSRF token.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/csrf` | Get a CSRF token |
| POST | `/registration` | Create an account |
| POST | `/session` | Log in |
| GET | `/session` | Get the current user |
| DELETE | `/session` | Log out |
| GET / PATCH | `/profile` | View or edit your profile |
| GET | `/users?q=username` | Search users |
| GET / POST | `/conversations` | List conversations or open a direct chat |
| GET | `/conversations/:id` | View a conversation |
| GET / POST | `/conversations/:conversation_id/messages` | Read or send messages |

Message history returns up to 50 messages at a time. Use `before_id` to retrieve older messages.

## Deployment

Render builds the root Dockerfile, including the React production bundle. The container entrypoint runs `db:prepare` before starting Rails. Neon provides the production database.

Configure secrets through the hosting dashboard:

- `DATABASE_URL`: PostgreSQL connection URL with SSL parameters.
- `RAILS_MASTER_KEY`: Key matching the app's encrypted Rails credentials.

The current deployment also sets `PORT=80`, `RAILS_MAX_THREADS=3`, and `WEB_CONCURRENCY=1`. Its health check is `/up`. Never commit database credentials, environment files, or Rails master keys.

The free hosting instance may take longer to respond after inactivity.

## Acknowledgments

Built as part of [The Odin Project](https://www.theodinproject.com/) curriculum.
