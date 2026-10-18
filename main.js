// Hyena site. Small, dependency-free. Content is fully visible without JavaScript.

// Reveal once when an element enters the viewport; never replays, never leaves content hidden.
(() => {
  const targets = document.querySelectorAll('[data-reveal], .lines:has([data-reveal-line])');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  // A shutter is clipped to nothing while hidden, so it can never "intersect":
  // watch its unclipped parent instead and reveal the shutter from there.
  const watched = new Map();
  for (const el of targets) {
    const anchor = el.classList.contains('shutter') ? el.parentElement : el;
    watched.set(anchor, [...(watched.get(anchor) || []), el]);
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      (watched.get(entry.target) || []).forEach((el) => el.classList.add('is-in'));
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  watched.forEach((_, anchor) => io.observe(anchor));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => {
      const r = (el.classList.contains('shutter') ? el.parentElement : el).getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }, 2500));
})();

// The command menu: type to filter, arrows or hover to move the selection.
(() => {
  const input = document.getElementById('command-filter');
  const list = document.getElementById('command-list');
  const empty = document.getElementById('command-empty');
  if (!input || !list) return;
  const rows = [...list.querySelectorAll('.command')];
  const visible = () => rows.filter((row) => !row.hidden);

  const select = (row, focus = false) => {
    rows.forEach((r) => { r.classList.toggle('is-selected', r === row); r.setAttribute('aria-selected', r === row); });
    if (row && focus) row.focus({ preventScroll: true });
  };

  const filter = () => {
    const query = input.value.trim().toLowerCase();
    for (const row of rows) {
      const text = row.textContent.toLowerCase();
      row.hidden = query.length > 0 && !query.split(/\s+/).every((word) => text.includes(word));
    }
    const shown = visible();
    empty.hidden = shown.length > 0;
    if (!shown.includes(rows.find((r) => r.classList.contains('is-selected')))) select(shown[0]);
  };

  const move = (step) => {
    const shown = visible();
    if (!shown.length) return;
    const index = shown.findIndex((r) => r.classList.contains('is-selected'));
    select(shown[(index + step + shown.length) % shown.length], document.activeElement !== input);
  };

  input.addEventListener('input', filter);
  list.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
  });
  for (const row of rows) {
    row.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) select(row); });
    row.addEventListener('click', () => select(row));
  }
  select(rows[0]);
})();

// Pause the clip when it's off screen or motion is reduced.
(() => {
  const video = document.querySelector('.watch-clip video');
  if (!video) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) { video.removeAttribute('autoplay'); video.pause(); return; }
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) video.play().catch(() => {}); else video.pause();
  }).observe(video);
})();

// Hero: the second line eats through what Hyena finds, letter by letter from
// the end, then lands on its verb while the meter counts up to the real total.
// Without script or with reduced motion, the final words are already in the markup.
(() => {
  const chew = document.getElementById('chew');
  const meter = document.getElementById('meter');
  if (!chew || matchMedia('(prefers-reduced-motion: reduce)').matches || !chew.animate) return;
  const words = ['caches.', 'downloads.', 'trash.', 'backups.', 'builds.', 'scavenges.'];
  const total = 47.84;
  const start = 950, hold = 260, bite = 34;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const appear = () => chew.animate(
    [{ opacity: 0, transform: 'scale(0.985)' }, { opacity: 1, transform: 'none' }],
    { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );

  // Rough length of the sequence, so the meter finishes with the last word.
  const duration = words.slice(0, -1).reduce((sum, w) => sum + hold + w.length * bite, 0);

  (async () => {
    chew.textContent = words[0];
    await wait(start);
    for (const [index, word] of words.entries()) {
      chew.textContent = word;
      if (index > 0) appear();
      if (index === words.length - 1) break;
      await wait(hold);
      for (let n = word.length - 1; n >= 0; n -= 1) {
        chew.textContent = word.slice(0, n) || '\u00a0';
        await wait(bite);
      }
    }
  })();

  if (meter) {
    meter.textContent = '0.00 GB';
    const begin = performance.now() + start;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - begin) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      meter.textContent = `${(total * eased).toFixed(2)} GB`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();

// Copy the build commands.
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = document.getElementById(button.dataset.copy)?.textContent ?? '';
    try { await navigator.clipboard.writeText(text); button.textContent = 'Copied'; }
    catch { button.textContent = 'Select and copy'; }
    setTimeout(() => { button.textContent = 'Copy'; }, 1800);
  });
});

// Drag the screens row with a mouse; touch and trackpads scroll natively.
(() => {
  const row = document.querySelector('.screen-row');
  if (!row) return;
  let startX = 0, startScroll = 0, dragging = false;
  row.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') return;
    dragging = true; startX = event.clientX; startScroll = row.scrollLeft;
    row.classList.add('is-dragging'); row.setPointerCapture(event.pointerId);
  });
  row.addEventListener('pointermove', (event) => {
    if (dragging) row.scrollLeft = startScroll - (event.clientX - startX);
  });
  const end = () => { dragging = false; row.classList.remove('is-dragging'); };
  row.addEventListener('pointerup', end);
  row.addEventListener('pointercancel', end);
  row.addEventListener('keydown', (event) => {
    const step = row.clientWidth * 0.8;
    if (event.key === 'ArrowRight') { event.preventDefault(); row.scrollBy({ left: step, behavior: 'smooth' }); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); row.scrollBy({ left: -step, behavior: 'smooth' }); }
  });
})();

// The site bundles the latest release at download/Hyena.dmg (see .github/workflows/pages.yml),
// so downloads come straight from this site. If GitHub already has a newer release than the
// bundled one (the few minutes after a release, before the site redeploys), the buttons point
// at that release's file instead, so visitors always get the latest version.
(() => {
  const links = document.querySelectorAll('[data-download]');
  if (!links.length || !window.fetch) return;
  const valid = (tag) => typeof tag === 'string' && /^v?\d+(\.\d+){1,2}$/.test(tag);
  const label = (tag) => (tag.startsWith('v') ? tag : `v${tag}`);
  const bundled = fetch('download/version.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const latest = fetch('https://api.github.com/repos/Hyena-App/hyena/releases/latest')
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);

  Promise.all([bundled, latest]).then(([local, remote]) => {
    const localTag = local && valid(local.version) ? local.version : null;
    const remoteTag = remote && valid(remote.tag_name) ? remote.tag_name : null;
    const newer = remoteTag && remoteTag !== localTag;
    const tag = newer ? remoteTag : localTag;
    if (!tag) return;
    // The header button opens the latest release's page on GitHub.
    document.querySelectorAll('[data-release-button]').forEach((button) => {
      button.href = `https://github.com/Hyena-App/hyena/releases/tag/${label(tag)}`;
      button.textContent = `${button.textContent.replace(/ · v[\d.]+$/, '').trim()} · ${label(tag)}`;
      button.title = `Hyena ${label(tag)} on GitHub Releases`;
    });
    // Release-notes links go to the exact page of the version being offered.
    document.querySelectorAll('[data-release-link]').forEach((link) => {
      link.href = `https://github.com/Hyena-App/hyena/releases/tag/${label(tag)}`;
      if (link.textContent.trim() === 'release notes') link.textContent = `release notes for ${label(tag)}`;
    });
    links.forEach((link) => {
      if (newer || !localTag) {
        link.href = 'https://github.com/Hyena-App/hyena/releases/latest/download/Hyena.dmg';
        link.removeAttribute('download');
      }
      link.textContent = `${link.textContent.replace(/ · v[\d.]+$/, '').trim()} · ${label(tag)}`;
      link.title = `Hyena ${label(tag)}, signed and notarized by Apple`;
    });
  });
})();
