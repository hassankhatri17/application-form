// api.js
// All network calls live here. Submission uses FormData (not JSON)
// because one field is a file — the browser sets the correct
// multipart/form-data boundary automatically when you pass FormData
// to fetch, so we deliberately do NOT set a Content-Type header
// ourselves (setting it manually breaks the boundary and the upload).

export const BASE_URL = 'http://localhost:4000';

export async function fetchPositions() {
  const res = await fetch(`${BASE_URL}/api/positions`);
  if (!res.ok) throw new Error('NETWORK');
  return res.json();
}

export async function submitApplication(formData) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      body: formData, // FormData — browser sets headers correctly on its own
    });
  } catch (networkErr) {
    const err = new Error('NETWORK');
    throw err;
  }

  let body = null;
  try { body = await response.json(); } catch (_) { /* no body */ }

  if (!response.ok) {
    const err = new Error(body?.error || 'Request failed');
    err.status = response.status;
    err.fieldErrors = body?.errors || null;
    throw err;
  }
  return body;
}
