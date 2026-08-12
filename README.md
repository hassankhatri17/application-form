# Springboard (forms, validation & real user feedback)

Week 3 | Task 1 of my Internship at Neurofive Solutions

A job application form with 7 fields — including a dropdown, a date
picker, and a PDF file upload — validated on both the client and the
server, with toast notifications and a proper loading state.

## Structure

```
apply/
├── README.md
├── apply-api/            # Express backend — see apply-api/README.md
│   ├── server.js
│   ├── package.json
│   ├── data.json          # submitted applications
│   ├── uploads/            # saved resume PDFs
│   └── README.md
└── apply-frontend/         # Vanilla JS frontend — see apply-frontend/README.md
    ├── index.html
    ├── css/
    ├── js/
    └── README.md
```

## The 7 fields

| Field | Type | Notes |
|---|---|---|
| Full name | text | |
| Email | text (email) | |
| Phone | text (tel) | |
| Position | **dropdown/select** | fetched from the backend so client and server never drift out of sync |
| Start date | **date** | can't be in the past |
| Cover letter | textarea | live character counter |
| Resume | **file** | optional — PDF only, max 2MB |

## What was actually tested before this was handed off

**Backend, 12 scenarios run against a live server:** a fully valid
submission, a completely empty submission (all 6 field errors, no
crash), invalid email, invalid position, a past start date, a too-short
cover letter, a `.txt` file instead of a PDF, an
oversized PDF, multiple simultaneous field errors in one request, and
listing submissions to confirm persistence.

**One real bug was caught and fixed in that process:** a completely
empty POST originally crashed the server with a 500 (`req.body` was
`undefined`), instead of returning validation errors like it should.
Fixed by defaulting it to `{}` before validation runs.

**Then, a separate integration test** used the browser's actual
`FormData`/`File` APIs (the same objects the frontend code constructs)
to submit directly against the backend — confirming the full multipart
upload path works end-to-end, not just the JSON-shaped parts of it. The
uploaded file's content was then re-fetched and verified byte-for-byte.

## Running both locally

Terminal 1 — backend:
```bash
cd apply-api
npm install
npm start
```
Runs on `http://localhost:4000`.

Terminal 2 — frontend:
```bash
cd apply-frontend
npx serve -l 8080
```
Open `http://localhost:8080`.

## What to demo in a video

1. Submit with everything empty — all 6 errors appear, plus a toast
2. Fix fields one at a time incorrectly (bad email, past date, short
   cover letter, wrong file type) — each shows its specific message
3. Submit something fully valid — loading spinner on the button, then a
   success toast, then the form clears
4. Optional: open `apply-api/uploads/` to show the PDF actually saved

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Springboard — job application form with dual-layer validation"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
