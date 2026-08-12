// components/applicationform.js
import { submitApplication, fetchPositions } from '../api.js';
import { toastSuccess, toastError } from '../toast.js';
import {
  validateFullName, validateEmail, validatePosition,
  validateStartDate, validateCoverLetter, validateResume,
} from '../validate.js';

// Fallback in case /api/positions is briefly unreachable — the form
// should still be usable. Kept identical to the backend's list.
const FALLBACK_POSITIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'UI/UX Designer', 'QA Engineer', 'Other',
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ApplicationForm() {
  return `
    <form class="apply-form container" id="apply-form" novalidate>
      <div class="field">
        <label for="fullName">Full name</label>
        <input type="text" id="fullName" name="fullName" autocomplete="name" />
        <span class="field-error" id="fullName-error"></span>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="email" />
        <span class="field-error" id="email-error"></span>
      </div>

      <div class="form-row">
        <div class="field">
          <label for="position">Position</label>
          <select id="position" name="position">
            <option value="" selected disabled>Choose one</option>
            ${FALLBACK_POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
          <span class="field-error" id="position-error"></span>
        </div>
        <div class="field">
          <label for="startDate">Available from</label>
          <input type="date" id="startDate" name="startDate" min="${todayISO()}" />
          <span class="field-error" id="startDate-error"></span>
        </div>
      </div>

      <div class="field">
        <label for="coverLetter">Short bio</label>
        <textarea id="coverLetter" name="coverLetter" rows="5" maxlength="1000"></textarea>
        <div class="field-footer">
          <span class="field-error" id="coverLetter-error"></span>
          <span class="char-count" id="char-count">0 / 1000</span>
        </div>
      </div>

      <div class="field">
        <label for="resume">Resume (PDF, max 2MB)</label>
        <div class="file-input-wrap">
          <input type="file" id="resume" name="resume" accept=".pdf,application/pdf" />
          <label for="resume" class="file-input-label" id="file-input-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span id="file-input-text">Choose a PDF file</span>
          </label>
        </div>
        <span class="field-error" id="resume-error"></span>
      </div>

      <button type="submit" class="btn btn-primary apply-submit" id="submit-btn">Submit application</button>
    </form>
  `;
}

export function mountApplicationForm() {
  const form = document.getElementById('apply-form');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const positionInput = document.getElementById('position');
  const startDateInput = document.getElementById('startDate');
  const coverLetterInput = document.getElementById('coverLetter');
  const resumeInput = document.getElementById('resume');
  const submitBtn = document.getElementById('submit-btn');
  const charCount = document.getElementById('char-count');
  const fileText = document.getElementById('file-input-text');

  // Sync the dropdown with the backend's actual list, if reachable —
  // falls back to the hardcoded list already rendered if this fails.
  fetchPositions().then(positions => {
    if (!Array.isArray(positions) || positions.length === 0) return;
    const current = positionInput.value;
    positionInput.innerHTML = '<option value="" disabled>Choose one</option>' +
      positions.map(p => `<option value="${p}">${p}</option>`).join('');
    positionInput.value = current;
  }).catch(() => { /* keep the fallback list already rendered */ });

  coverLetterInput.addEventListener('input', () => {
    charCount.textContent = `${coverLetterInput.value.length} / 1000`;
  });

  resumeInput.addEventListener('change', () => {
    const file = resumeInput.files[0];
    fileText.textContent = file ? file.name : 'Choose a PDF file';
  });

  const fieldValidators = {
    fullName: () => validateFullName(fullNameInput.value),
    email: () => validateEmail(emailInput.value),
    position: () => validatePosition(positionInput.value),
    startDate: () => validateStartDate(startDateInput.value),
    coverLetter: () => validateCoverLetter(coverLetterInput.value),
    resume: () => validateResume(resumeInput.files[0]),
  };

  function setFieldError(name, message) {
    const errorEl = document.getElementById(`${name}-error`);
    const inputEl = document.getElementById(name);
    errorEl.textContent = message || '';
    if (name === 'resume') {
      document.getElementById('file-input-label').classList.toggle('invalid', Boolean(message));
    } else {
      inputEl.classList.toggle('invalid', Boolean(message));
    }
  }

  function validateAll() {
    let isValid = true;
    for (const [name, validator] of Object.entries(fieldValidators)) {
      const message = validator();
      setFieldError(name, message);
      if (message) isValid = false;
    }
    return isValid;
  }

  // Learned from earlier feedback: don't validate on blur before the
  // user has ever tried to submit — that punishes normal tabbing
  // through the form. Only start live-validating after the first
  // submit attempt, so errors clear in real time as they're fixed.
  let hasAttemptedSubmit = false;
  Object.keys(fieldValidators).forEach(name => {
    const el = document.getElementById(name);
    const eventName = (name === 'position' || name === 'resume') ? 'change' : 'blur';
    el.addEventListener(eventName, () => {
      if (hasAttemptedSubmit) setFieldError(name, fieldValidators[name]());
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hasAttemptedSubmit = true;

    if (!validateAll()) {
      toastError('Please fix the highlighted fields.');
      form.querySelector('.invalid, .field-error:not(:empty)')?.closest('.field')?.querySelector('input, select, textarea')?.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

    const formData = new FormData();
    formData.append('fullName', fullNameInput.value.trim());
    formData.append('email', emailInput.value.trim());
    formData.append('position', positionInput.value);
    formData.append('startDate', startDateInput.value);
    formData.append('coverLetter', coverLetterInput.value.trim());
    formData.append('resume', resumeInput.files[0]);

    try {
      await submitApplication(formData);
      toastSuccess("Application submitted! We'll be in touch.");
      form.reset();
      charCount.textContent = '0 / 1000';
      fileText.textContent = 'Choose a PDF file';
      hasAttemptedSubmit = false;
      Object.keys(fieldValidators).forEach(name => setFieldError(name, null));
    } catch (err) {
      if (err.fieldErrors) {
        // Server caught something the client-side check missed (or a
        // direct API call bypassed the frontend entirely) — surface
        // every field error it sent back, the same way client errors show.
        Object.entries(err.fieldErrors).forEach(([name, message]) => setFieldError(name, message));
        toastError('Please fix the highlighted fields.');
      } else if (err.message === 'NETWORK') {
        toastError("Couldn't reach the server. Check your connection and try again.");
      } else {
        toastError('Something went wrong submitting your application. Please try again.');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit application';
    }
  });
}
