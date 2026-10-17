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
