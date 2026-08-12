// main.js
import { Header } from './components/header.js';
import { ApplicationForm, mountApplicationForm } from './components/applicationform.js';
import { Footer } from './components/footer.js';

function render() {
  const app = document.getElementById('app');
  app.innerHTML = [
    Header(),
    `<main>${ApplicationForm()}</main>`,
    Footer(),
  ].join('');

  mountApplicationForm();
}

document.addEventListener('DOMContentLoaded', render);
