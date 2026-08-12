// validate.js
// Mirrors server.js's validateFields() rule-for-rule. This is genuinely
// just for instant feedback — the backend re-checks everything, since
// client-side validation can always be bypassed (e.g. a direct API call)
// and is never the real security/data-integrity boundary.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB

export function validateFullName(value) {
  const v = (value || '').trim();
  if (!v) return 'Full name is required.';
  if (v.length < 2) return 'Full name must be at least 2 characters.';
  if (v.length > 100) return 'Full name must be 100 characters or fewer.';
  return null;
}

export function validateEmail(value) {
  const v = (value || '').trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return null;
}

export function validatePosition(value) {
  if (!value) return 'Select a position.';
  return null;
}

export function validateStartDate(value) {
  if (!value) return 'Start date is required.';
  const d = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
  if (d < today) return 'Start date cannot be in the past.';
  return null;
}

export function validateCoverLetter(value) {
  const v = (value || '').trim();
  if (!v) return "Please write a short bio.";
  if (v.length < 20) return 'Please write at least 20 characters.';
  if (v.length > 1000) return 'Please keep it under 1000 characters.';
  return null;
}

export function validateResume(file) {
  if (!file) return 'Resume is required.';
  if (file.type !== 'application/pdf') return 'Resume must be a PDF file.';
  if (file.size > MAX_FILE_BYTES) return 'Resume must be 2MB or smaller.';
  return null;
}
