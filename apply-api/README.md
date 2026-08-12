# Springboard API (Week 3 | Task 1 — backend)

A backend for a job application form: 7 fields (name, email, phone,
position, start date, cover letter, and a PDF resume upload), with
validation that mirrors the frontend exactly — because the frontend's
validation is only ever a UX convenience, never the real boundary.

## Stack

**Node.js + Express**, `multer` for handling the multipart file upload
(resumes), plain JSON file storage (`data.json`). `cors` enabled for the
frontend running on a different local port.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/positions` | The valid list of dropdown options, so the frontend and backend never drift out of sync |
| POST | `/api/applications` | Submit an application — `multipart/form-data` with the 7 fields below |
| GET | `/api/applications` | List all submissions (not required by the task, but useful for confirming persistence) |
| GET | `/uploads/<filename>` | Serves a saved resume directly, to confirm a file upload actually worked |

### Fields and validation rules

| Field | Type | Rule |
|---|---|---|
| `fullName` | text | required, 2–100 characters |
| `email` | text | required, valid email format |
| `phone` | text | required, 7–15 characters, valid phone format (digits/spaces/dashes, optional `+`) |
| `position` | dropdown | required, must be one of the values from `/api/positions` |
| `startDate` | date | required, must not be in the past |
| `coverLetter` | textarea | required, 20–1000 characters |
| `resume` | file | **optional** — if provided, must be a real PDF (checked by MIME type), max 2MB |

## How errors come back

A failed submission returns `400` with **every** failing field at once,
not just the first one found:
```json
{ "errors": { "email": "Enter a valid email address.", "coverLetter": "Please write at least 20 characters." } }
```
This lets the frontend show all the problems in one pass instead of the
user fixing one error only to immediately hit the next.

**One exception:** if the file itself is invalid (wrong type or too
large), that comes back as the *only* error, since the upload stream
aborts before the rest of the form fields are even parsed — that's how
`multer` handles a rejected file, not a design choice. You'll still see
this reported as `{ "errors": { "resume": "..." } }`, in the same shape
as any other error, from the frontend's point of view.

## What I tested before handing this off

12 scenarios run directly against a live server: a fully valid
submission (201), a completely empty submission (returns all 6 field
errors, does not crash), invalid email, invalid position, a past start
date, a too-short cover letter, a `.txt` file
uploaded instead of a PDF, an oversized (3MB) PDF, multiple simultaneous
field errors in one request, and listing submissions afterward to
confirm persistence. All passing.

One real bug was caught and fixed during this: a completely empty
POST (no body at all) originally crashed the server with a 500, because
`req.body` is `undefined` when there's no multipart content — fixed by
defaulting it to `{}` before validation runs.

## Running locally

```bash
npm install
npm start
```
Server runs on `http://localhost:4000`.

## Connecting the frontend

The frontend's `js/api.js` already points `BASE_URL` at
`http://localhost:4000` — as long as this server is running, it works
with no extra setup.
