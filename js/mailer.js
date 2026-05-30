/**
 * Portfolio mailer — sends contact form messages to your inbox via FormSubmit.
 * First submission: check saicha2735@gmail.com and click the activation link.
 */
window.Mailer = (function () {
  const DEFAULT_EMAIL = 'saicha2735@gmail.com';

  function getEndpoint(email) {
    return `https://formsubmit.co/ajax/${email || DEFAULT_EMAIL}`;
  }

  function getFormAction(email) {
    return `https://formsubmit.co/${email || DEFAULT_EMAIL}`;
  }

  function setStatus(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `form-status${type ? ` ${type}` : ''}`;
  }

  function setButtonState(btn, state, originalHtml) {
    if (!btn) return;
    const states = {
      sending: '<i class="fas fa-spinner fa-spin"></i> Sending…',
      success: '<i class="fas fa-check"></i> Sent!',
      error: originalHtml,
    };
    btn.disabled = state === 'sending' || state === 'success';
    btn.innerHTML = states[state] ?? originalHtml;
  }

  async function sendViaAjax({ name, email, message, endpoint, honey }) {
    if (honey) {
      throw new Error('Spam detected');
    }

    const body = new FormData();
    body.append('name', name);
    body.append('email', email);
    body.append('message', message);
    body.append('_subject', `Portfolio message from ${name}`);
    body.append('_replyto', email);
    body.append('_template', 'table');
    body.append('_captcha', 'false');

    const res = await fetch(endpoint, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON response */
    }

    if (!res.ok) {
      throw new Error(data.message || 'Could not send message');
    }

    return data;
  }

  function setupNativeFallback(form, email) {
    form.setAttribute('action', getFormAction(email));
    form.setAttribute('method', 'POST');

    const hidden = [
      ['_subject', 'New message from portfolio'],
      ['_template', 'table'],
      ['_captcha', 'false'],
    ];

    hidden.forEach(([name, value]) => {
      if (form.querySelector(`input[name="${name}"]`)) return;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    const nextUrl = `${window.location.origin}${window.location.pathname}#contact-sent`;
    let nextInput = form.querySelector('input[name="_next"]');
    if (!nextInput) {
      nextInput = document.createElement('input');
      nextInput.type = 'hidden';
      nextInput.name = '_next';
      form.appendChild(nextInput);
    }
    nextInput.value = nextUrl;
  }

  function init(form, options = {}) {
    if (!form) return;

    const email = options.email || DEFAULT_EMAIL;
    const endpoint = options.formEndpoint || getEndpoint(email);
    const statusEl = options.statusEl || form.querySelector('.form-status');
    const btn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = btn?.innerHTML ?? 'Send Message';

    setupNativeFallback(form, email);

    if (window.location.hash === '#contact-sent') {
      setStatus(statusEl, 'Message sent! I will get back to you soon.', 'success');
      history.replaceState(null, '', window.location.pathname + window.location.search + '#contact');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.name?.value?.trim() ?? '';
      const senderEmail = form.email?.value?.trim() ?? '';
      const message = form.message?.value?.trim() ?? '';
      const honey = form.querySelector('[name="_honey"]')?.value?.trim();

      if (!name || !senderEmail || !message) {
        setStatus(statusEl, 'Please fill in all fields.', 'error');
        return;
      }

      setButtonState(btn, 'sending', originalBtnHtml);
      setStatus(statusEl, '', '');

      try {
        await sendViaAjax({
          name,
          email: senderEmail,
          message,
          endpoint,
          honey,
        });

        setStatus(statusEl, 'Message sent directly to my inbox. I will reply soon!', 'success');
        setButtonState(btn, 'success', originalBtnHtml);
        form.reset();

        setTimeout(() => {
          setButtonState(btn, 'error', originalBtnHtml);
          if (btn) btn.disabled = false;
          setStatus(statusEl, '', '');
        }, 5000);
      } catch {
        setStatus(
          statusEl,
          `Could not send right now. Email me at ${email} or try again in a moment.`,
          'error'
        );
        setButtonState(btn, 'error', originalBtnHtml);
        if (btn) btn.disabled = false;
      }
    });
  }

  return { init, getEndpoint, getFormAction };
})();
