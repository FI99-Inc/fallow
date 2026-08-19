/* Scroll reveal — shared by every page that uses .fade-up.
 *
 * This exists because the dashboard shipped blank. It loaded index.css
 * (which hid .fade-up at opacity 0) but not index.js (which held the only
 * IntersectionObserver), so its empty state was in the DOM and invisible
 * forever. The rule now is: hiding is opt-in and only ever done by the
 * script that can also undo it.
 */
(() => {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  const show = () => els.forEach((el) => el.classList.add('visible'));

  // No observer support, or motion is unwelcome: show everything, skip the
  // animation entirely. Never leave content hidden behind a capability check.
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    show();
    return;
  }

  // Only now is it safe to hide: this same function reveals them again.
  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });

  els.forEach((el) => observer.observe(el));

  // Dead-man's switch. If anything above misbehaves — a layout that never
  // intersects, a browser quirk — the content appears anyway.
  setTimeout(show, 3000);
})();
