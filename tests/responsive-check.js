(async (page) => {
  const baseUrl = 'http://127.0.0.1:4173/';
  const browserSession = await page.context().newCDPSession(page);
  await browserSession.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.unrouteAll({ behavior: 'wait' });
  await page.route(`${baseUrl}*.js`, (route) => route.continue());
  const pages = [
    { path: 'index.html', key: 'landing' },
    { path: 'onboarding.html', key: 'onboarding' },
    { path: 'browse.html', key: 'browse' },
    { path: 'results.html', key: 'results' },
    { path: 'dashboard.html', key: 'dashboard' },
  ];
  const viewports = [
    { name: 'small phone', width: 320, height: 568 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet portrait', width: 768, height: 1024 },
    { name: 'short landscape', width: 1024, height: 568 },
    { name: 'desktop baseline', width: 1440, height: 900 },
  ];

  const violations = [];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const surface of pages) {
      const pageErrors = [];
      const onPageError = (error) => pageErrors.push(error.message);
      page.on('pageerror', onPageError);
      await page.goto(baseUrl + surface.path, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => {
        const localStyles = [...document.querySelectorAll('link[rel="stylesheet"]')]
          .filter((link) => new URL(link.href).origin === location.origin);
        await Promise.all(localStyles.map((link) => new Promise((resolve) => {
          const url = new URL(link.href);
          url.searchParams.set('responsive-check', Date.now().toString());
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
          link.href = url.href;
        })));
      });
      await page.waitForTimeout(350);

      const result = await page.evaluate(({ surface, viewport }) => {
        const root = document.documentElement;
        const failures = [];
        const tolerance = 1;

        if (surface.key === 'browse') {
          const stack = document.querySelector('.card-stack');
          const actions = document.querySelector('.browse-actions');
          stack?.classList.remove('hidden');
          actions?.classList.remove('hidden');
          if (stack && !stack.querySelector('.browse-card')) {
            const card = document.createElement('article');
            card.className = 'browse-card';
            card.innerHTML = '<h2 class="card-name">A representative activity</h2><p class="card-hook">Enough content to exercise the swipe deck layout.</p>';
            stack.append(card);
          }
        }

        if (surface.key === 'results' && !document.querySelector('.results-container .card')) {
          const template = document.querySelector('#cardTemplate');
          const host = document.querySelector('.results-container');
          const card = template?.content.cloneNode(true);
          if (card && host) host.append(card);
        }

        const isVisible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none'
            && style.visibility !== 'hidden'
            && style.opacity !== '0'
            && style.pointerEvents !== 'none'
            && style.clipPath === 'none'
            && rect.width > 0
            && rect.height > 0;
        };

        if (!document.body.innerText.trim()) failures.push('page rendered no meaningful content');

        const overflow = root.scrollWidth - root.clientWidth;
        if (overflow > tolerance) failures.push(`page overflows horizontally by ${overflow}px`);

        const controls = [...document.querySelectorAll('a, button, input, select, textarea')]
          .filter(isVisible);

        if (viewport.width < 768) {
          for (const control of controls) {
            const rect = control.getBoundingClientRect();
            const label = (control.innerText
              || control.getAttribute('aria-label')
              || control.getAttribute('placeholder')
              || control.tagName).trim().replace(/\s+/g, ' ').slice(0, 42);

            if (rect.left < -tolerance || rect.right > root.clientWidth + tolerance) {
              failures.push(`control "${label}" is clipped horizontally`);
            }
            if (rect.width < 44 || rect.height < 44) {
              failures.push(`control "${label}" is ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
            }
          }

          if (surface.key === 'results') {
            const logo = document.querySelector('.logo');
            const logoStyle = logo && getComputedStyle(logo);
            if (!logoStyle || logoStyle.fontStyle !== 'normal' || parseFloat(logoStyle.letterSpacing) < 0) {
              failures.push('the outlined wordmark uses collapsing italic or negative spacing');
            }
          }
        }

        if (surface.key === 'onboarding') {
          const activeControls = [...document.querySelectorAll('.screen.active button')].filter(isVisible);
          for (const control of activeControls) {
            const rect = control.getBoundingClientRect();
            if (rect.top < -tolerance || rect.bottom > innerHeight + tolerance) {
              failures.push('an active quiz choice is unreachable in the fixed viewport');
              break;
            }
          }
        }

        if (surface.key === 'browse') {
          const main = document.querySelector('.browse-main')?.getBoundingClientRect();
          const deck = document.querySelector('.card-stack')?.getBoundingClientRect();
          if (!main || !deck || deck.top < main.top - tolerance || deck.bottom > main.bottom + tolerance) {
            failures.push('the swipe deck is clipped by its fixed viewport');
          }
        }

        if (viewport.width >= 1200) {
          const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect();

          if (surface.key === 'landing') {
            const copy = rect('.hero-headline');
            const visual = rect('.hero-card');
            if (!copy || !visual || visual.left <= copy.right || Math.abs(copy.top - visual.top) > 4) {
              failures.push('desktop hero no longer uses its side-by-side composition');
            }
          }

          if (surface.key === 'onboarding') {
            const left = rect('.choice-left');
            const right = rect('.choice-right');
            if (!left || !right || right.left <= left.right - tolerance || Math.abs(left.top - right.top) > 2) {
              failures.push('desktop quiz choices no longer sit side by side');
            }
          }

          if (surface.key === 'browse') {
            const deck = rect('.card-stack');
            if (!deck || deck.width > 421 || deck.width < 400) {
              failures.push('desktop swipe deck width changed from its established composition');
            }
          }

          if (surface.key === 'results') {
            const header = rect('.results-header');
            const logo = rect('.logo');
            const nav = rect('nav');
            if (!header || !logo || !nav || Math.abs(logo.top + logo.height / 2 - (nav.top + nav.height / 2)) > 3) {
              failures.push('desktop header no longer keeps logo and actions on one aligned row');
            }
          }

          if (surface.key === 'dashboard') {
            const logo = rect('.logo');
            const nav = rect('nav');
            if (!logo || !nav || nav.top < logo.bottom - tolerance) {
              failures.push('desktop commitments header changed from its established stacked composition');
            }
          }
        }

        return failures;
      }, { surface, viewport });

      for (const message of result) {
        violations.push(`${viewport.name} / ${surface.key}: ${message}`);
      }
      for (const message of pageErrors) {
        violations.push(`${viewport.name} / ${surface.key}: uncaught browser error: ${message}`);
      }
      page.off('pageerror', onPageError);
    }
  }

  if (violations.length) {
    throw new Error(`Responsive contract failed:\n${violations.join('\n')}`);
  }

  return `Responsive contract passed for ${pages.length} pages across ${viewports.length} viewports.`;
})
