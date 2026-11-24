'use strict';

const assert = require('node:assert/strict');
const { mkdir, readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { createRequire } = require('node:module');
const { extname, resolve, sep } = require('node:path');
const { pathToFileURL } = require('node:url');
const { gzipSync } = require('node:zlib');
const dependencies = process.env.PETRODLE_BROWSER_DEPS;
const loadDependency = dependencies ? createRequire(resolve(dependencies, 'package.json')) : require;
const { chromium } = loadDependency('playwright-core');
const { AxeBuilder } = loadDependency('@axe-core/playwright');

const repo = resolve(process.env.PETRODLE_BROWSER_ROOT || resolve(__dirname, '../..'));
const baseline = process.argv[2] ? resolve(process.argv[2]) : null;
const screenshotFolder = process.env.PETRODLE_BROWSER_SCREENSHOTS;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function serve(root) {
  const responses = new Map();
  const server = createServer(async (req, res) => {
    try {
      const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = resolve(root, `.${name === '/' ? '/index.html' : name}`);
      if (!file.startsWith(`${root}${sep}`)) return res.writeHead(403).end();
      if (!responses.has(file)) {
        const body = await readFile(file);
        const type = mime[extname(file)] ?? 'application/octet-stream';
        responses.set(file, {
          body, type,
          gzip: /^(text\/|application\/json|image\/svg)/.test(type) ? gzipSync(body) : null,
        });
      }
      const { body, type, gzip } = responses.get(file);
      const compressed = gzip && req.headers['accept-encoding']?.includes('gzip');
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': compressed ? gzip.length : body.length,
        'Cache-Control': 'no-store',
        ...(compressed ? { 'Content-Encoding': 'gzip' } : {}),
      });
      res.end(compressed ? gzip : body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((done, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', done);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    close: () => new Promise(done => server.close(done)),
  };
}

async function ready(page, url) {
  const errors = [];
  const capture = error => errors.push(error.message);
  page.on('pageerror', capture);
  try {
    const response = await page.goto(url);
    assert.ok(response?.ok(), `Página indisponível em ${url}: ${response?.status()}`);
    await page.locator('.hub-mode-grid').waitFor({ timeout: 10_000 });
  } catch (error) {
    const pageDetails = await page.evaluate(() => ({
      title: document.title,
      scripts: [...document.scripts].map(script => script.src || script.textContent.length),
      snippet: document.body?.innerText.slice(0, 300),
    }));
    throw new Error(`Abertura de ${url} falhou: ${JSON.stringify({ errors, ...pageDetails })}`, { cause: error });
  } finally {
    page.off('pageerror', capture);
  }
}

async function screenshot(page, name, fullPage = false) {
  if (!screenshotFolder) return;
  await mkdir(screenshotFolder, { recursive: true });
  await page.screenshot({ path: resolve(screenshotFolder, `${name}.png`), animations: 'disabled', fullPage });
}

async function captureScreens(browser, url, label) {
  const results = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 360, height: 800 }]) {
    const mobile = viewport.width === 360;
    const context = await browser.newContext({
      viewport, isMobile: mobile, hasTouch: mobile,
      locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce',
    });
    try {
      await context.route('https://commons.wikimedia.org/**', route => route.fulfill({ status: 503 }));
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date('2026-11-17T02:55:00Z'));
      await ready(page, url);
      await page.waitForFunction(() => [...document.images].every(image => image.complete));
      await screenshot(page, `${label}-${viewport.width}-inicio`, true);
      const landing = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.hub-mode-grid [data-game-mode]')];
        const positions = cards.map(card => Math.round(card.getBoundingClientRect().top));
        return {
          firstModeY: positions[0],
          modesInFirstRow: positions.filter(y => y === positions[0]).length,
          collectionAboveDifficulty: Boolean(
            document.querySelector('#collection-progress, .hub-bottom')?.compareDocumentPosition(document.querySelector('#difficulty')) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
          pageWidth: document.documentElement.scrollWidth,
        };
      });
      assert.equal(landing.pageWidth, viewport.width, `${label}: página inicial com rolagem horizontal`);
      const modes = {};
      for (const mode of ['classic', 'photo', 'description']) {
        await openMode(page, mode, mobile);
        if (mode === 'photo') {
          await page.waitForFunction(() => {
            const photos = [...document.querySelectorAll('.challenge-photo')];
            return photos.length === 2 && photos.every(image => image.naturalWidth > 0);
          });
        }
        await enterGuess(page, 'Quartzo');
        await page.waitForFunction(() => !document.querySelector('#guess-input').disabled);
        await page.waitForFunction(() => [...document.images].filter(img => img.loading !== 'lazy').every(image => image.complete));
        await page.evaluate(() => window.scrollTo(0, 0));
        await screenshot(page, `${label}-${viewport.width}-${mode}`, true);
        modes[mode] = await page.evaluate(() => {
          const board = document.querySelector('.board-scroll');
          const photo = document.querySelector('.challenge-photo');
          const cell = board?.querySelector('th');
          return {
            pageWidth: document.documentElement.scrollWidth,
            ...(board ? {
              tableScrolls: board.scrollWidth > board.clientWidth,
              stickyHeading: getComputedStyle(cell).position === 'sticky',
              scrollLeft: board.scrollLeft,
            } : {}),
            ...(photo ? { photoFit: getComputedStyle(photo).objectFit } : {}),
          };
        });
        assert.equal(modes[mode].pageWidth, viewport.width, `${label}: ${mode} com rolagem horizontal da página`);
        await page.locator('.back-home')[mobile ? 'tap' : 'click']();
      }
      results.push({ viewport: viewport.width, landing, modes });
    } finally {
      await context.close();
    }
  }
  return results;
}

async function simulateSlowNetwork(page) {
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750,
  });
}

async function measure(browser, url) {
  const samples = [];
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      const page = await context.newPage();
      await simulateSlowNetwork(page);
      await page.addInitScript(() => {
        new MutationObserver((_, observer) => {
          if (document.querySelector('.hub-mode-grid')) {
            performance.mark('modos-renderizados');
            observer.disconnect();
          }
        }).observe(document, { childList: true, subtree: true });
      });
      await ready(page, url);
      await page.waitForFunction(() => [...document.images].every(image => image.complete));
      await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0);
      const landing = await page.evaluate(origin => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource').filter(e => e.name.startsWith(origin));
        const paints = performance.getEntriesByType('paint');
        return {
          requests: 1 + resources.length,
          imageRequests: resources.filter(resource => resource.initiatorType === 'img').length,
          encodedBytes: [navigation, ...resources].reduce((sum, e) => sum + e.encodedBodySize, 0),
          modeRenderMs: Math.round(performance.getEntriesByName('modos-renderizados')[0].startTime),
          firstContentfulPaintMs: Math.round(paints.find(e => e.name === 'first-contentful-paint')?.startTime ?? 0),
        };
      }, url);
      await page.evaluate(() => performance.mark('abrir-imagem'));
      await openMode(page, 'photo');
      await page.waitForFunction(() => [...document.querySelectorAll('.challenge-photo')].every(i => i.naturalWidth > 0));
      const photoOpenMs = await page.evaluate(() => Math.round(
        performance.now() - performance.getEntriesByName('abrir-imagem')[0].startTime,
      ));
      samples.push({ ...landing, photoOpenMs });
    } finally {
      await context.close();
    }
  }
  const median = Object.fromEntries(Object.keys(samples[0]).map(key => [
    key, samples.map(sample => sample[key]).sort((a, b) => a - b)[1],
  ]));
  return { median, samples };
}

async function openMode(page, mode, touch = false) {
  const button = page.locator(`[data-game-mode="${mode}"]`);
  if (touch) await button.tap();
  else await button.click();
  await page.locator('.game-shell').waitFor();
}

async function enterGuess(page, guess) {
  const input = page.locator('#guess-input');
  await input.fill(guess);
  await input.press('Enter');
}

async function verifyClipboard(page, mode, answer) {
  await enterGuess(page, answer);
  await page.locator('#result-title').filter({ hasText: answer }).waitFor();
  await page.locator('.result #answer-profile').getByRole('heading', { name: answer }).waitFor();
  const fireworks = page.locator('.result-fireworks');
  assert.equal(await fireworks.count(), 1);
  assert.equal(await fireworks.isVisible(), false, 'Movimento reduzido oculta os fogos');
  assert.equal(await page.locator('#review-answer').count(), 0);
  await page.locator('#share').click();
  await page.getByText(/Resultado copiado/).waitFor();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(text, new RegExp(`Petrodle ${mode}`));
  assert.match(text, /#Petrodle/);
  assert.ok(!text.includes(answer), 'O compartilhamento revela a resposta');
}

async function assertCenteredGuess(page) {
  const centered = await page.locator('.guess-board tbody .name-col').first().evaluate(cell => {
    const box = cell.getBoundingClientRect();
    const group = cell.querySelector('.guess-mineral-wrap').getBoundingClientRect();
    const image = cell.querySelector('.mineral-thumbnail').getBoundingClientRect();
    const name = cell.querySelector('.mineral-name').getBoundingClientRect();
    const center = box.left + box.width / 2;
    return Math.abs(image.left + image.width / 2 - center) < 2 &&
      Math.abs(name.left + name.width / 2 - center) < 2 &&
      Math.abs(group.top + group.height / 2 - (box.top + box.height / 2)) < 2;
  });
  assert.ok(centered, 'O nome e a miniatura ficam centralizados na célula');
}

async function verifyPhotoTools(page) {
  const preview = page.locator('[data-photo-preview]').first();
  await preview.click();
  const dialog = page.locator('#photo-dialog');
  await dialog.waitFor();
  await dialog.locator('img').waitFor();
  await page.waitForFunction(() => document.querySelector('#photo-dialog img').naturalWidth > 0);
  const accessibility = await inspectAccessibility(page, 'foto ampliada');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await preview.evaluate(button => button === document.activeElement), true,
    'Fechar a foto ampliada devolve o foco ao botão de origem');

  const src = await page.locator('.challenge-photo').first().getAttribute('src');
  await page.reload();
  await page.locator('.hub-mode-grid').waitFor();
  let release;
  const pending = new Promise(resolveResponse => { release = resolveResponse; });
  await page.route(`**/${src}`, async route => {
    await pending;
    await route.fulfill({ status: 503 });
  }, { times: 1 });
  try {
    await openMode(page, 'photo');
    await page.locator('.photo-loading').filter({ visible: true }).first().waitFor();
    assert.equal(await page.locator('[data-photo-preview]').first().isEnabled(), false);
  } finally {
    release();
  }
  const retry = page.locator('[data-retry-photo]').first();
  await retry.waitFor();
  await retry.click();
  await page.waitForFunction(() => [...document.querySelectorAll('.challenge-photo')].every(img => img.naturalWidth > 0));
  assert.equal(await retry.isVisible(), false);
  assert.equal(await preview.evaluate(button => button === document.activeElement), true,
    'Recuperar a foto direciona o foco à ação de ampliação');
  return accessibility;
}

async function inspectAccessibility(page, screen) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const findings = violations.map(({ id, nodes }) => ({
    id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }));
  return { screen, findings };
}

async function verify(browser, url) {
  const context = await browser.newContext({
    locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const errors = [];
  const a11y = [];
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  try {
    page.on('pageerror', error => errors.push(error.stack || error.message));
    await context.route('https://commons.wikimedia.org/**', route => route.fulfill({ status: 503 }));
    await page.clock.setFixedTime(new Date('2026-11-17T02:55:00Z'));
    await ready(page, url);
    await screenshot(page, 'atual-inicio');
    const desktopCards = await page.locator('.hub-card').evaluateAll(cards =>
      cards.map(card => Math.round(card.getBoundingClientRect().top)),
    );
    assert.equal(desktopCards.length, 3);
    assert.equal(new Set(desktopCards).size, 3, 'Os cartões ilustrados ocupam linhas separadas');
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll('.hub-card-art img')];
      return images.length === 3 && images.every(image => image.naturalWidth > 0);
    });
    for (const text of ['DESAFIO MINERALÓGICO', 'Três maneiras de descobrir o mundo dos minerais.', 'MODOS DE JOGO']) {
      assert.equal(await page.getByText(text, { exact: true }).count(), 0);
    }
    const collection = page.getByRole('progressbar', { name: 'Sua coleção mineralógica' });
    assert.equal(await collection.evaluate(progress => progress.value), 0);
    assert.ok(await collection.evaluate(progress => Boolean(
      progress.compareDocumentPosition(document.querySelector('#difficulty')) & Node.DOCUMENT_POSITION_FOLLOWING,
    )));
    assert.equal(await collection.evaluate(progress =>
      Boolean(progress.closest('.hub-bottom')?.nextElementSibling?.querySelector('#difficulty')),
    ), true, 'O seletor de dificuldade fica imediatamente abaixo da coleção');
    a11y.push(await inspectAccessibility(page, 'início'));
    await page.locator('#help').click();
    const help = page.locator('#help-dialog');
    const helpNamed = await help.and(page.getByRole('dialog', { name: 'Como jogar' })).count() === 1;
    a11y.push(await inspectAccessibility(page, 'ajuda'));
    await page.keyboard.press('Tab');
    assert.equal(await help.isVisible(), true, 'Tab não deve fechar outro diálogo');
    assert.equal(await page.locator('#catalog-dialog').isVisible(), false, 'Outro diálogo não abre o catálogo');
    await page.keyboard.press('Escape');
    assert.equal(await help.isVisible(), false);
    await page.locator('#catalog-link').focus();
    await page.keyboard.press('Tab');
    const shortcutCatalog = page.locator('#catalog-dialog');
    assert.equal(await shortcutCatalog.isVisible(), true, 'Tab abre o catálogo em qualquer tela');
    assert.equal(await shortcutCatalog.locator('#catalog-search').evaluate(input => input === document.activeElement), true,
      'O atalho deve deixar a busca do catálogo pronta');
    await page.keyboard.press('Tab');
    assert.equal(await shortcutCatalog.isVisible(), false, 'Tab fecha o catálogo aberto');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await shortcutCatalog.isVisible(), false, 'Shift+Tab preserva a navegação reversa');
    const difficulty = page.locator('#difficulty');
    assert.equal(await difficulty.inputValue(), 'easy');
    await difficulty.selectOption('medium');
    await page.locator('#catalog-link').click();
    assert.ok((await page.locator('#catalog-list button').count()) >= 45);
    await page.locator('#catalog-search').fill('FeCO3');
    await page.locator('#catalog-list button').getByText('Siderita', { exact: true }).waitFor();
    assert.match(await page.locator('[data-catalog-id="siderita"] small').textContent(), /FeCO₃/);
    await page.locator('#catalog-search').fill('FeCO₃');
    await page.locator('[data-catalog-id="siderita"]').click();
    assert.equal(await page.locator('#catalog-detail .chem-profile strong').textContent(), 'FeCO₃');
    await page.keyboard.press('Escape');
    await difficulty.selectOption('hard');
    await page.locator('#catalog-link').click();
    const catalog = page.locator('#catalog-dialog');
    assert.equal(await catalog.locator('#catalog-search').evaluate(input => input === document.activeElement), true);
    const catalogSearchNamed = await catalog.getByRole('searchbox', { name: 'Buscar no catálogo' }).count() === 1;
    await catalog.locator('#catalog-search').fill('Chabazita-Na');
    await catalog.locator('[data-catalog-id="chabazita-na"]').click();
    const diagnostic = catalog.getByRole('region', { name: 'Evidência para distinguir as espécies' });
    assert.equal(await catalog.locator('#catalog-detail h3').evaluate(title => title === document.activeElement), true);
    assert.match(await diagnostic.textContent(), /cátion extrarreticular/);
    assert.equal(await diagnostic.getByRole('link', { name: /Coombs/ }).count(), 1);
    a11y.push(await inspectAccessibility(page, 'catálogo com nota diagnóstica'));
    await catalog.locator('#catalog-search').fill('Albita');
    await catalog.locator('[data-catalog-id="albita"] .mineral-thumbnail img').waitFor();
    await catalog.locator('[data-catalog-id="albita"] .thumbnail-scope').waitFor();
    await catalog.locator('[data-catalog-id="albita"]').click();
    await catalog.getByRole('heading', { name: 'Albita' }).waitFor();
    await catalog.locator('.photo-fallback').filter({ visible: true }).first().waitFor();
    a11y.push(await inspectAccessibility(page, 'catálogo com imagem remota indisponível'));
    await page.keyboard.press('Escape');
    assert.equal(await catalog.isVisible(), false);
    await difficulty.selectOption('easy');

    await page.locator('[data-game-mode="classic"]').focus();
    await page.keyboard.press('Enter');
    const input = page.locator('#guess-input');
    await input.focus();
    assert.equal(await input.getAttribute('aria-expanded'), 'false');
    await enterGuess(page, 'mineral inexistente');
    const invalid = await page.locator('#message').textContent();
    assert.ok(invalid.trim(), 'Palpite inválido recebe uma explicação');
    assert.equal(await page.locator('.guess-board tbody tr').count(), 0);
    await input.fill('Quar');
    await page.waitForFunction(() => document.querySelector('#suggestions [data-id="quartzo"] .mineral-thumbnail img')?.naturalWidth > 0);
    await input.press('ArrowDown');
    await page.getByRole('option', { selected: true }).getByText('Quartzo', { exact: true }).waitFor();
    const activeOptionId = await input.getAttribute('aria-activedescendant');
    const activeOptionIsLinked = await page.getByRole('option', { selected: true })
      .evaluate((option, id) => Boolean(id && option.id === id), activeOptionId);
    a11y.push(await inspectAccessibility(page, 'seleção de sugestão por teclado'));
    await input.press('Escape');
    assert.equal(await input.getAttribute('aria-expanded'), 'false');
    const activeOptionCleared = await input.getAttribute('aria-activedescendant') === null;
    await enterGuess(page, 'Quartzo');
    await page.locator('.guess-board tbody tr').filter({ hasText: 'Quartzo' }).waitFor();
    await page.waitForFunction(() => document.querySelector('.guess-board .mineral-thumbnail img')?.naturalWidth > 0);
    await assertCenteredGuess(page);
    await page.waitForFunction(() => !document.querySelector('#guess-input').disabled);
    const focusAfterGuess = await input.evaluate(el => el === document.activeElement);
    assert.equal(await input.getAttribute('aria-expanded'), 'false', 'Uma busca vazia não deve encobrir o tabuleiro');
    await enterGuess(page, 'Quartzo');
    assert.equal(await page.locator('.guess-board tbody tr').count(), 1);
    assert.notEqual(await page.locator('#message').textContent(), invalid);
    a11y.push(await inspectAccessibility(page, 'Clássico após palpite'));
    await page.reload();
    await page.locator('.hub-mode-grid').waitFor();
    await openMode(page, 'classic');
    await page.locator('.guess-board tbody tr').filter({ hasText: 'Quartzo' }).waitFor();
    await page.locator('[data-run-mode="training"]').click();
    await page.locator('.board-empty').waitFor();
    await page.locator('#next').click();
    await page.locator('.board-empty').waitFor();
    await page.locator('[data-run-mode="daily"]').click();
    assert.equal(await page.locator('.guess-board tbody tr').count(), 1);
    await verifyClipboard(page, 'Clássico', 'Microclínio');

    await openMode(page, 'photo');
    assert.equal(await page.locator('.legend-compact').count(), 0);
    const photos = page.locator('.challenge-photo');
    assert.equal(await photos.count(), 2);
    await page.waitForFunction(() => [...document.querySelectorAll('.challenge-photo')].every(i => i.naturalWidth > 0));
    assert.deepEqual(await photos.evaluateAll(images => images.map(img => getComputedStyle(img).objectFit)), ['contain', 'contain']);
    a11y.push(await inspectAccessibility(page, 'Imagem em andamento'));
    a11y.push(await verifyPhotoTools(page));
    await verifyClipboard(page, 'Imagem', 'Fluorita');
    assert.equal(await page.locator('.petrodle-celebration').count(), 0);
    a11y.push(await inspectAccessibility(page, 'Imagem concluído'));

    await openMode(page, 'description');
    assert.equal(await page.locator('.legend-compact').count(), 0);
    await page.locator('.description-stage .clue-row').waitFor();
    for (const answer of ['Quartzo', 'Calcita', 'Muscovita']) await enterGuess(page, answer);
    assert.equal(await page.locator('.attempt-item').count(), 3);
    await page.waitForFunction(() => document.querySelector('.attempt-item .mineral-thumbnail img')?.naturalWidth > 0);
    await page.locator('#hint').click();
    assert.equal(await page.locator('.hint-entry').count(), 1);
    a11y.push(await inspectAccessibility(page, 'Descrição com dica revelada'));
    await page.reload();
    await page.locator('.hub-mode-grid').waitFor();
    await openMode(page, 'description');
    assert.equal(await page.locator('.attempt-item').count(), 3);
    assert.equal(await page.locator('.hint-entry').count(), 1);
    await verifyClipboard(page, 'Descrição', 'Epidoto');
    a11y.push(await inspectAccessibility(page, 'Descrição concluído'));

    await page.clock.setFixedTime(new Date('2026-11-17T03:01:00Z'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.locator('.game-count').filter({ hasText: '#321' }).waitFor();
    assert.equal(await page.locator('.attempt-item').count(), 0);
    await page.locator('#guess-input').fill('Forsterita');
    await page.getByRole('option').filter({ hasText: 'Forsterita' }).waitFor();
    await page.locator('#guess-input').fill('Fluorita');
    assert.equal(await page.locator('#guess-input').getAttribute('aria-expanded'), 'false');
    await page.clock.setFixedTime(new Date('2026-11-17T02:55:00Z'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.locator('#result-title').filter({ hasText: 'Epidoto' }).waitFor();
    assert.equal(await page.locator('.result-fireworks').count(), 0, 'A vitória salva não repete os fogos');
    assert.deepEqual(errors, [], 'Erros de execução no navegador');
    return { a11y, keyboard: { activeOptionIsLinked, activeOptionCleared, focusAfterGuess, helpNamed, catalogSearchNamed } };
  } catch (error) {
    if (!errors.length) throw error;
    throw new Error(`Erros de execução no navegador: ${errors.join(' | ')}`, { cause: error });
  } finally {
    await context.close();
  }
}

async function assertFullWidthPhotoPair(page) {
  const gallery = page.locator('.result #answer-profile .photo-gallery');
  const photos = gallery.locator('figure > img');
  assert.equal(await photos.count(), 2);
  await gallery.scrollIntoViewIfNeeded();
  await photos.evaluateAll(images => Promise.all(images.map(image => image.decode())));
  const originalViewport = page.viewportSize();
  for (const width of [originalViewport.width, 360]) {
    await page.setViewportSize({ width, height: originalViewport.height });
    const layout = await gallery.evaluate(node => {
      const { left, right, width } = node.getBoundingClientRect();
      const profile = node.parentElement;
      const style = getComputedStyle(profile);
      const availableWidth = profile.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const [first, second] = [...node.querySelectorAll('img')].map(image => {
        const { left, right, top, width, height } = image.getBoundingClientRect();
        return { left, right, top, height, proportionalWidth: height * image.naturalWidth / image.naturalHeight, width };
      });
      return { left, right, width, availableWidth, first, second };
    });
    const { left, right, first, second } = layout;
    assert.ok(Math.abs(first.height - second.height) < 1 && Math.abs(first.top - second.top) < 1,
      `Fotos lado a lado e com a mesma altura em ${width} px`);
    assert.ok(Math.abs(left - first.left) < 1 && Math.abs(right - second.right) < 1,
      `O par ocupa a largura da galeria em ${width} px`);
    assert.ok(Math.abs(layout.width - layout.availableWidth) < 1 && first.right < second.left,
      `A galeria ocupa a largura disponível e há espaço entre as fotos em ${width} px`);
    for (const photo of [first, second]) assert.ok(Math.abs(photo.width - photo.proportionalWidth) < 1,
      `Fotos mantêm suas proporções em ${width} px`);
  }
  await page.setViewportSize(originalViewport);
}

async function verifyOutcomesAndTraining(browser, url) {
  const context = await browser.newContext({
    locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce',
  });
  try {
    await context.route('https://commons.wikimedia.org/**', route => route.fulfill({ status: 503 }));
    await context.addInitScript(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: async () => { throw new DOMException('Permissão negada', 'NotAllowedError'); },
      });
      for (const mode of ['classic', 'photo', 'description']) {
        const key = `petrodle:v6:training:${mode}:easy`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify({ targetId: 'calcita', guesses: [], hintCount: 0 }));
        }
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    await page.clock.setFixedTime(new Date('2026-11-17T02:55:00Z'));
    await ready(page, url);
    for (const [mode, answer] of [['photo', 'Fluorita'], ['description', 'Epidoto']]) {
      await openMode(page, mode);
      for (const wrong of ['Quartzo', 'Calcita', 'Muscovita', 'Barita', 'Diopsídio', 'Microclínio', 'Zircão', 'Ortoclásio', 'Cianita']) {
        await enterGuess(page, wrong);
      }
      assert.equal(await page.locator('.attempt-item').count(), 9);
      assert.match(await page.locator('.field-label small').textContent(), /1 tentativa restante/);
      for (let clue = 0; clue < 3; clue++) await page.locator('#hint').click();
      const thirdClue = page.locator('.hint-entry').nth(2);
      assert.equal(await thirdClue.locator('b').textContent(), 'Fórmula química');
      assert.match(await thirdClue.textContent(), /[₀-₉]/);
      await page.reload();
      await page.locator('.hub-mode-grid').waitFor();
      await openMode(page, mode);
      assert.equal(await page.locator('.attempt-item').count(), 9);
      assert.equal(await page.locator('.hint-entry').count(), 3);
      assert.ok(await page.locator('#guess-input').isEnabled(), 'Nove erros salvos permitem continuar');
      await enterGuess(page, 'Titanita');
      assert.equal(await page.locator('.attempt-item').count(), 10);
      await page.locator('#result-title').filter({ hasText: answer }).waitFor();
      const input = page.locator('#guess-input');
      assert.ok(!await input.count() || !await input.isEnabled(), 'A derrota encerra os palpites');
      assert.equal(await page.locator('.result #answer-profile').count(), 0);
      assert.equal(await page.locator('.result-fireworks').count(), 0, 'Derrotas não exibem fogos');
      await page.locator('#review-answer').click();
      assert.ok(await page.locator('#answer-profile').evaluate(profile => profile === document.activeElement));
      await page.locator('.back-home').click();
    }

    const daily = page.locator('[data-run-mode="daily"]');
    const training = page.locator('[data-run-mode="training"]');
    await openMode(page, 'classic');
    await training.click();
    for (const mode of ['classic', 'photo', 'description']) {
      await openMode(page, mode);
      assert.equal(await training.getAttribute('aria-pressed'), 'true');
      await page.emulateMedia({ reducedMotion: mode === 'classic' ? 'no-preference' : 'reduce' });
      await enterGuess(page, 'Calcita');
      await page.locator('#result-title').filter({ hasText: 'Calcita' }).waitFor();
      await page.locator('.result #answer-profile').waitFor();
      assert.equal(await page.locator('#answer-profile .chem-profile strong').textContent(), 'CaCO₃');
      assert.equal(await page.locator('#result-title').evaluate(title => title === document.activeElement), true);
      assert.equal(await page.locator('#next, #next-result').count(), 1,
        'Treino encerrado oferece uma única ação de novo mineral');
      if (mode === 'classic') {
        const fireworks = page.locator('.result > .result-fireworks');
        assert.equal(await fireworks.getAttribute('aria-hidden'), 'true');
        assert.equal(await fireworks.evaluate(layer => getComputedStyle(layer).pointerEvents), 'none');
        const bursts = await fireworks.evaluate(layer => layer.getAnimations({ subtree: true }).map(animation => {
          const { duration, iterations } = animation.effect.getTiming();
          return [animation.animationName, duration, iterations];
        }));
        assert.deepEqual(bursts, Array.from({ length: 3 }, () => ['result-burst', 1250, 2]));
        assert.equal(await page.locator('.guess-board tbody tr').isVisible(), true,
          'A tabela aparece enquanto os fogos estão na tela');
        const gap = await page.locator('.result').evaluate(result =>
          result.getBoundingClientRect().top - result.previousElementSibling.getBoundingClientRect().bottom,
        );
        assert.ok(gap >= 16, 'O aviso verde tem respiro abaixo do cabeçalho');
        await assertFullWidthPhotoPair(page);
        await screenshot(page, 'atual-ficha-no-aviso-verde', true);
        await page.locator('#share').click();
        const share = page.locator('#share-dialog');
        await share.waitFor();
        const copy = await share.locator('#share-text').inputValue();
        assert.match(copy, /^Petrodle Clássico/);
        assert.ok(!copy.includes('Calcita'), 'O texto alternativo não revela a resposta');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#result-title').count(), 1,
          'Enter em outro diálogo não pode reiniciar o treino');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#share').evaluate(trigger => trigger === document.activeElement), true);
      }
      await page.locator('#result-title').focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('#catalog-dialog').isVisible(), true, 'Tab funciona após acertar');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#result-title').count(), 1,
        'Enter dentro do catálogo não pode iniciar outro mineral');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('#catalog-dialog').isVisible(), false);
      await page.locator('#result-title').focus();
      await page.keyboard.press('Enter');
      assert.ok(await page.locator('#guess-input').isEnabled());
      assert.equal(await page.locator('#guess-input').evaluate(input => input === document.activeElement), true,
        'Enter inicia um novo treino com o campo de resposta focado');
      assert.equal(await page.locator('#result-title').count(), 0);
      const restarted = await page.evaluate(mode => JSON.parse(
        localStorage.getItem(`petrodle:v6:training:${mode}:easy`),
      ), mode);
      assert.equal(restarted.guesses.length, 0);
      assert.notEqual(restarted.targetId, 'calcita');
    }
    await page.locator('.back-home').click();
    assert.equal(await page.locator('#collection-progress').evaluate(progress => progress.value), 1);
    assert.equal(await page.locator('.hub-card[data-game-mode="description"]')
      .evaluate(card => card === document.activeElement), true);
    await openMode(page, 'photo');
    assert.equal(await daily.getAttribute('aria-pressed'), 'true',
      'O cartão do início abre o Diário, como indica o estado que ele exibe');
    await page.locator('#result-title').filter({ hasText: 'Fluorita' }).waitFor();
    await page.locator('#review-answer').waitFor();
    await page.locator('#answer-profile').waitFor();
    assert.equal(await page.locator('.result #answer-profile').count(), 0);
  } finally {
    await context.close();
  }
}

async function verifyLocalAndMobile(browser, root, label) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 750 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    timezoneId: 'America/Sao_Paulo',
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (label === 'atual') await page.clock.setFixedTime(new Date('2026-11-17T15:00:00Z'));
    await ready(page, pathToFileURL(resolve(root, 'index.html')).href);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 360);
    await screenshot(page, `${label}-local-movel`);
    const a11y = [];
    for (const mode of ['classic', 'photo', 'description']) {
      await openMode(page, mode, true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 360);
      if (mode === 'photo') {
        await page.waitForFunction(() => [...document.querySelectorAll('.challenge-photo')].every(i => i.naturalWidth > 0));
        await screenshot(page, `${label}-local-imagem-movel`);
      }
      await page.locator('.back-home').tap();
    }
    await openMode(page, 'classic', true);
    await page.locator('#guess-input').tap();
    await page.locator('#guess-input').fill('Quar');
    await page.locator('#suggestions [data-id="quartzo"]').tap();
    if (label !== 'atual') await page.locator('#submit').tap();
    await page.locator('.guess-board tbody tr').filter({ hasText: 'Quartzo' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 360);
    if (label === 'atual') {
      assert.ok(await page.locator('.guess-board .cell.unknown').count(), 'O teste móvel inclui células sem comparação');
      await assertCenteredGuess(page);
      const table = await page.locator('.board-scroll').evaluate(board => {
        const mineral = board.querySelector('tbody tr .name-col');
        board.scrollLeft = board.scrollWidth;
        const container = board.getBoundingClientRect();
        const cell = mineral.getBoundingClientRect();
        return {
          scrollLeft: board.scrollLeft,
          pinned: getComputedStyle(mineral).position === 'sticky',
          visible: cell.left >= container.left && cell.right <= container.right,
        };
      });
      assert.ok(table.scrollLeft > 0, 'Tabela clássica tem rolagem própria em 360 px');
      assert.ok(table.pinned && table.visible, 'Espécie do palpite continua visível ao rolar a tabela');
      a11y.push(await inspectAccessibility(page, 'Clássico em 360 px via file://'));
    }
    assert.deepEqual(errors, [], 'Erros de execução na abertura local');
    return a11y;
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ channel: process.env.PETRODLE_CHROMIUM_CHANNEL ?? 'chrome' });
  const current = await serve(repo);
  const original = baseline && await serve(baseline);
  try {
    console.log('Chromium', browser.version());
    if (process.env.PETRODLE_BROWSER_COMPARE_ONLY === '1') {
      if (original) console.log('Antes', JSON.stringify(await captureScreens(browser, original.url, 'antes'), null, 2));
      console.log('Depois', JSON.stringify(await captureScreens(browser, current.url, 'depois'), null, 2));
      return;
    }
    if (original) {
      console.log('Baseline HTTP', JSON.stringify(await measure(browser, original.url)));
      await verifyLocalAndMobile(browser, baseline, 'baseline');
      console.log('Baseline file:// e viewport móvel verificados');
    }
    if (process.env.PETRODLE_BROWSER_MEASURE === '1' || original) {
      console.log('Atual HTTP', JSON.stringify(await measure(browser, current.url)));
    }
    if (process.env.PETRODLE_BROWSER_MEASURE_ONLY !== '1') {
      const result = await verify(browser, current.url);
      await verifyOutcomesAndTraining(browser, current.url);
      result.a11y.push(...await verifyLocalAndMobile(browser, repo, 'atual'));
      console.log('Partidas, teclado, catálogo, dicas, compartilhamento, progresso e abertura local verificados');
      console.log(JSON.stringify(result, null, 2));
      if (process.env.PETRODLE_BROWSER_ACCESSIBILITY_REPORT_ONLY !== '1') {
        assert.ok(Object.values(result.keyboard).every(Boolean), 'Falha nas verificações de teclado ou nomes acessíveis');
        assert.ok(result.a11y.every(screen => screen.findings.length === 0), 'Falha nas verificações de acessibilidade do axe');
      }
    }
  } finally {
    await browser.close();
    await current.close();
    if (original) await original.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
