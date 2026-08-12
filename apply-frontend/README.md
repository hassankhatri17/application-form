# Springboard (Week 3 | Task 1 — frontend)

A job application form: 7 fields (name, email, phone, a position
dropdown, a start-date picker, a cover letter, and a PDF resume upload),
validated on both the client and the server.

## Framework choice

Plain **HTML / CSS / vanilla JS**, native ES modules, no build step.

## Structure

```
apply-frontend/
├── index.html
├── css/
│   ├── tokens.css             # design tokens
│   └── styles.css             # base styles, form, file input, toasts, responsive rules
├── js/
│   ├── api.js                  # network calls — submission uses FormData, not JSON, for the file
│   ├── validate.js             # client-side validation, mirrors the backend rule-for-rule
│   ├── toast.js                 # minimal success/error toast system
│   ├── main.js                  # renders + mounts the page
│   └── components/
│       ├── header.js
│       ├── applicationform.js  # the form itself — validation, file handling, submit state
│       └── footer.js
└── README.md
```

## Why FormData instead of JSON

One field is a file. `FormData` is the browser's native way to send
`multipart/form-data`, and — importantly — you should **not** manually
set a `Content-Type` header when sending it via `fetch`. The browser
sets it automatically, including a boundary string the server needs to
correctly split the fields apart; setting it yourself breaks that
boundary and the upload silently fails. `api.js` deliberately leaves
this header alone.

## How validation timing works (learned from real feedback)

An earlier project got user feedback that validating fields on `blur`
*before* someone had ever tried to submit was bad UX — it punished
people for simply moving between fields. This form applies that lesson:
**no validation happens until the first submit attempt.** After that
first attempt, live validation kicks in on blur/change so errors clear
in real time as they're fixed — see the `hasAttemptedSubmit` flag in
`applicationform.js`.

## How errors are shown

- **Client-side:** every field is validated at once on submit; all
  failing fields show their specific message inline, and an error toast
  summarizes that something needs fixing. Nothing generic like "invalid
  input" — each message names the actual problem ("Enter a valid email
  address," "Start date cannot be in the past," etc.).
- **Server-side:** if a request somehow reaches the backend with bad
  data anyway (a browser without JS, a direct API call, or a bug in the
  client checks), the server's response includes the same
  `{ errors: { field: "message" } }` shape, and the form displays those
  exactly the same way — the two validation layers produce the same UX,
  they just run at different times for different reasons.

## Loading state

The submit button disables and shows a spinner (`Submitting…`) for the
full duration of the request, re-enabling only once a response (success
or failure) comes back — so a slow connection can't result in a double
submission from impatient double-clicking.

## Running locally

Terminal 1 — backend:
```bash
cd apply-api
npm install
npm start
```

Terminal 2 — frontend:
```bash
cd apply-frontend
npx serve -l 8080
```
Open `http://localhost:8080`.

## Trying it out

1. Submit with everything empty — see all 6 field errors appear at once, plus an error toast
2. Fill in a clearly bad email, an already-past date, a two-word cover letter, and a `.txt` file instead of a PDF — see each specific message
3. Fill in everything correctly and submit — see the loading spinner, then a success toast, then the form clears
4. Open `apply-api/uploads/` afterward — the PDF you uploaded is actually sitting there, proving the file upload isn't just cosmetic
