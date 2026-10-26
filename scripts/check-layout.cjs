/* Local Chrome checks using the existing tooling dependency; sends no contact emails. */
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), WS = require('ws');
const { spawn } = require('child_process');
const chrome = process.env.PORTFOLIO_CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'
].find(file => fs.existsSync(file));
if (!chrome) throw new Error('Set PORTFOLIO_CHROME_PATH to your local Chrome executable.');
const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:8787';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-layout-'));
const browser = spawn(chrome, ['--headless', '--disable-gpu', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 50 && !fs.existsSync(portFile); i++) await delay(200);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
    ws = new WS(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => ws.on('open', resolve));
    let id = 0; const jobs = new Map(), errors = [];
    ws.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      if (jobs.has(message.id)) {
        const job = jobs.get(message.id); clearTimeout(job.timer); jobs.delete(message.id);
        message.error ? job.reject(message.error) : job.resolve(message.result);
      }
    });
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const number = ++id;
      const timer = setTimeout(() => { jobs.delete(number); reject(new Error('Timeout: ' + method)); }, 15000);
      jobs.set(number, { resolve, reject, timer }); ws.send(JSON.stringify({ id: number, method, params }));
    });
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    await call('Network.setBlockedURLs', { urls: ['*static.cloudflareinsights.com*'] });
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    async function navigate(route, width) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 360 });
      await call('Page.navigate', { url: base + route }); await delay(700);
      for (let i = 0; i < 24; i++) { if (await evaluate("document.readyState === 'complete'")) break; await delay(200); }
    }
    for (const width of [360, 768, 1440]) for (const route of ['/', '/about', '/services', '/portfolio', '/awards', '/contact']) {
      await navigate(route, width);
      const data = JSON.parse(await evaluate(`JSON.stringify({ width: innerWidth, scroll: document.documentElement.scrollWidth, h1: document.querySelectorAll('h1').length,
        badImages: [...document.images].filter(image => !image.hasAttribute('alt') || !image.hasAttribute('width') || !image.hasAttribute('height')).map(image => image.className),
        headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(e => e.getClientRects().length && !e.closest('[hidden]')).map(e => ({ level: Number(e.tagName.slice(1)), text: e.textContent.trim() })),
        counters: [...document.querySelectorAll('.counter')].map(e => e.textContent) })`));
      assert(data.scroll <= data.width, `Horizontal overflow: ${route} at ${width} (${data.scroll})`);
      assert.equal(data.h1, 1); assert.deepEqual(data.badImages, [], 'Image metadata: ' + route);
      for (let i = 1; i < data.headings.length; i++) assert(data.headings[i].level <= data.headings[i - 1].level + 1, 'Heading order: ' + route + ' ' + data.headings[i].text);
      if (route === '/') {
        assert.deepEqual(data.counters, ['15+', '10+', '4+', '4.9/5']);
        assert.equal(await evaluate("document.querySelectorAll('#heroVideoDialogPlayer iframe').length"), 0);
        assert.equal(await evaluate("document.querySelectorAll('.hero-actions a').length"), 2);
        await evaluate("document.querySelector('.hero-video-preview').click()");
        assert(await evaluate("document.querySelector('#heroVideoDialog').open && document.querySelector('#heroVideoDialogPlayer iframe').src.includes('UBaeXPFcrYw')"));
        await evaluate("document.querySelector('#heroVideoDialogClose').click()"); await delay(100);
        if (width < 1100) {
          await evaluate("document.querySelector('#navToggle').click()");
          assert.equal(await evaluate("document.querySelector('#navToggle').getAttribute('aria-expanded')"), 'true');
          assert.equal(await evaluate("getComputedStyle(document.querySelector('.nav-mobile-action')).display"), 'list-item');
          await evaluate("document.querySelector('#navToggle').focus()");
          await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
          assert(await evaluate("document.querySelector('#navLinks').contains(document.activeElement)"));
          await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
          assert.equal(await evaluate("document.querySelector('#navToggle').getAttribute('aria-expanded')"), 'false');
        }
        await evaluate("document.querySelector('.skip-link').focus()");
        assert(await evaluate("document.querySelector('.skip-link').getBoundingClientRect().top >= 0"));
        await evaluate("document.querySelector('.skip-link').click()"); assert.equal(await evaluate('document.activeElement.id'), 'main-content');
        const screenshot = await call('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(os.tmpdir(), 'portfolio-essentials-' + width + '.png'), Buffer.from(screenshot.data, 'base64'));
      }
      if (route === '/about') assert(await evaluate("document.querySelector('.story-photo').src.endsWith('.webp')"));
      if (route === '/portfolio') {
        assert(await evaluate("[...document.querySelectorAll('.portfolio-card')].every(card => card.querySelector('.project-facts') && card.querySelector('.project-tech-tags'))"));
        await evaluate("document.querySelector('.portfolio-view-btn').click()"); assert.equal(await evaluate('document.activeElement.id'), 'lightboxClose');
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
        assert(!(await evaluate("document.querySelector('#lightboxModal').classList.contains('open')")));
      }
      console.log('PASS', width, route);
    }
    // Browser form states are tested with fetch mocked, so no messages are sent.
    await navigate('/contact', 360);
    const fill = "document.querySelector('#name').value='Test Person';document.querySelector('#email').value='test@example.com';document.querySelector('#serviceSelect').value='computer-vision';document.querySelector('#message').value='This is a browser validation check only.';document.querySelector('#contactForm').requestSubmit()";
    await evaluate("window.fetch=async()=>new Response(JSON.stringify({ok:true,acknowledgmentSent:false}),{status:200,headers:{'Content-Type':'application/json'}});" + fill);
    await delay(150); assert(await evaluate("document.querySelector('#formStatus').classList.contains('success')"));
    await evaluate("window.fetch=async()=>new Response(JSON.stringify({ok:false,error:'Test delivery failure'}),{status:503,headers:{'Content-Type':'application/json'}});" + fill);
    await delay(150); assert.equal(await evaluate("document.querySelector('#formStatus').getAttribute('role')"), 'alert');
    assert(!(await evaluate("document.querySelector('#submitBtn').disabled")));
    await call('Emulation.setScriptExecutionDisabled', { value: true });
    await navigate('/', 1440); assert.deepEqual(await evaluate("[...document.querySelectorAll('.counter')].map(e=>e.textContent)"), ['15+', '10+', '4+', '4.9/5']);
    await navigate('/portfolio', 1440); assert((await evaluate("document.querySelectorAll('.portfolio-card').length")) > 0);
    await call('Emulation.setScriptExecutionDisabled', { value: false });
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await navigate('/', 1440); await evaluate("document.querySelector('#stats').scrollIntoView({block:'center',behavior:'instant'})"); await delay(1300);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.counter')].map(e=>e.textContent)"), ['15+', '10+', '4+', '4.9/5']);
    assert(await evaluate("[...document.querySelectorAll('.counter')].every(e=>e.dataset.animated==='true')"));
    await evaluate("scrollTo({top:0,behavior:'instant'})"); await delay(100);
    await evaluate("document.querySelector('#stats').scrollIntoView({block:'center',behavior:'instant'})");
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.counter')].map(e=>e.textContent)"), ['15+', '10+', '4+', '4.9/5']);
    assert.deepEqual(errors, []); console.log('PASS keyboard, no-JavaScript, reduced-motion, once-only counters, intro video, and contact states.');
    await call('Browser.close'); ws.close();
  } catch (error) { console.error(error); browser.kill(); ws?.close(); process.exitCode = 1; }
})();
