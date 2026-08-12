// server.js
// Springboard API — receives job application submissions (multipart/form-data,
// since one field is a file upload). Every rule enforced on the client
// is re-checked here — the frontend's validation is for UX, this is the
// actual security/data-integrity boundary.

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR)); // lets you open a submitted resume directly, to confirm it saved correctly

const POSITIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'QA Engineer',
  'Other',
];

// ---------- tiny file-based "database" ----------
function readApplications() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function writeApplications(applications) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));
}

// ---------- file upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, crypto.randomUUID() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

// Wraps upload.single() so multer's file-level errors (wrong type, too
// large) come back in the same { errors: { resume: "..." } } shape as
// every other validation error, instead of a generic Express crash page.
function handleUpload(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      let message = 'There was a problem with the uploaded file.';
      if (err.code === 'LIMIT_FILE_SIZE') message = 'Resume must be 2MB or smaller.';
      else if (err.message === 'INVALID_FILE_TYPE') message = 'Resume must be a PDF file.';
      return res.status(400).json({ errors: { resume: message } });
    }
    next();
  });
}

// ---------- validation (mirrors the frontend's rules exactly) ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(body) {
  const errors = {};

  const fullName = (body.fullName || '').trim();
  if (!fullName) errors.fullName = 'Full name is required.';
  else if (fullName.length < 2) errors.fullName = 'Full name must be at least 2 characters.';
  else if (fullName.length > 100) errors.fullName = 'Full name must be 100 characters or fewer.';

  const email = (body.email || '').trim();
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';

  const position = body.position;
  if (!position) errors.position = 'Select a position.';
  else if (!POSITIONS.includes(position)) errors.position = 'Select a valid position from the list.';

  const startDate = body.startDate;
  if (!startDate) {
    errors.startDate = 'Start date is required.';
  } else {
    const d = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(d.getTime())) errors.startDate = 'Enter a valid date.';
    else if (d < today) errors.startDate = 'Start date cannot be in the past.';
  }

  const coverLetter = (body.coverLetter || '').trim();
  if (!coverLetter) errors.coverLetter = "Please write a short bio.";
  else if (coverLetter.length < 20) errors.coverLetter = 'Please write at least 20 characters.';
  else if (coverLetter.length > 1000) errors.coverLetter = 'Please keep it under 1000 characters.';

  return errors;
}

// ---------- routes ----------

app.get('/api/positions', (req, res) => {
  res.json(POSITIONS);
});

app.post('/api/applications', handleUpload, (req, res) => {
  const body = req.body || {};
  const errors = validateFields(body);
  // Resume is now mandatory. handleUpload/multer already checked type
  // and size above if a file was sent — here we just check one exists.
  if (!req.file) errors.resume = 'Resume is required.';

  if (Object.keys(errors).length > 0) {
    // Don't leave an orphaned file on disk if the file itself was fine
    // but some other field failed validation.
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ errors });
  }

  const applications = readApplications();
  const application = {
    id: crypto.randomUUID(),
    fullName: body.fullName.trim(),
    email: body.email.trim(),
    position: body.position,
    startDate: body.startDate,
    coverLetter: body.coverLetter.trim(),
    resumeFilename: req.file.filename,
    resumeOriginalName: req.file.originalname,
    createdAt: new Date().toISOString(),
  };
  applications.unshift(application);
  writeApplications(applications);
  res.status(201).json(application);
});

// Not required by the task, but useful for verifying submissions actually
// persisted, and for demonstrating the file really saved.
app.get('/api/applications', (req, res) => {
  res.json(readApplications());
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Springboard API running on port ${PORT}`);
});
