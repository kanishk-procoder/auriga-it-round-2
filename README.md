# BrewRewards

A café rewards application with a React/Vite frontend and FastAPI/SQLite
backend.

## Run locally

Start the backend from the project root:

```bash
.venv/bin/uvicorn backend.main:app --reload
```

In a second terminal, start the React frontend:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).
The API documentation is available at `http://localhost:8000/docs`.

Keep both terminals running while using the app. During development, Vite
forwards browser requests from `/api` to the FastAPI server on port 8000; this
also works when the frontend is opened through a forwarded Codespaces port.

## Sample credentials

These accounts are automatically seeded into the local SQLite database on the
first backend start. They are development-only credentials.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `aarav@brewrewards.test` | `BrewCustomer#2026` |
| Staff admin | `admin@brewrewards.test` | `BrewAdmin#2026` |

## Current backend features

- SQLite schema for users, members, reward transactions, and bills.
- Argon2 password hashing and JWT bearer-token login.
- Role protection for customer and staff endpoints.
- Atomic purchase and redemption operations using SQLite write transactions.
- Separate country code and phone-number fields with a unique lookup index.
- Configurable tier thresholds and earning multipliers in `backend/config.py`.
