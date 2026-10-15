const {test,expect} = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs=require('node:fs');
const path=require('node:path');
const widths=[360,390,768,1024,1440];
for(const width of widths) test(`layout and controls at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const errors=[],missing=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().startsWith('http://127.0.0.1')&&response.status()>=400) missing.push(response.url());});
  await page.goto('/');
  await expect(page.locator('#themeBtn')).toBeVisible();
  await expect(page.locator('#monitor-title')).toContainText('Distributed System');
  for(const id of ['about','work','stats','experience','focus','skills','profiles','contact']) {
    await page.locator('#'+id).scrollIntoViewIfNeeded();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  const overflow=await page.locator('.continuation a,.continuation button,.nav-controls button').evaluateAll(els=>els.filter(el=>{
    const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.right>innerWidth+.5);
  }).map(el=>el.textContent));
  expect(overflow).toEqual([]);
  await page.locator('#architecture').scrollIntoViewIfNeeded();
  await page.locator('[data-node="zapfix"]').click();
  await expect(page.locator('#nodeDetail')).toContainText('no commands are executed');
  await page.locator('[data-node="controller"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-node="database"]')).toBeFocused();
  await expect(page.locator('[data-node="database"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#themeBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  if(width===1440) { await page.waitForTimeout(2300); await expect(page.locator('.hero-name .cursor-blink')).toHaveCount(1); }
  expect(errors).toEqual([]);expect(missing).toEqual([]);
});
test('mobile menu focus, escape, navigation, and touch selection',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/');
  await page.locator('#menuBtn').tap();
  await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#mobileNav a').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.locator('#menuBtn')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#mobileNav')).toBeHidden();
  await expect(page.locator('#menuBtn')).toBeFocused();
  await page.locator('#menuBtn').tap();await page.locator('#mobileNav a[href="#work"]').tap();
  await expect(page.locator('#mobileNav')).toBeHidden();await expect(page.locator('#work')).toBeFocused();
  expect(await page.locator('#work').evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(95);
  await page.locator('[data-node="rag"]').tap();await expect(page.locator('#nodeDetail')).toContainText('Background analysis');
  await context.close();
});
test('reduced motion and user pause work across JavaScript and CSS',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion','paused');
  await expect(page.locator('#motionBtn')).toBeDisabled();
  expect(await page.evaluate(()=>window.gsap ? gsap.getTweensOf('.hero-name .line').length : 0)).toBe(0);
  await page.mouse.move(120,120);await expect(page.locator('body')).not.toHaveClass(/cursor-ready/);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#motionBtn').click();await expect(page.locator('html')).toHaveAttribute('data-motion','paused');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-motion','paused');
});
test('essential content and navigation survive blocked optional CDNs',async({page})=>{
  await page.route('**/cdn.jsdelivr.net/**',route=>route.abort());await page.goto('/');
  await expect(page.locator('#themeBtn')).toBeVisible();
  await expect(page.locator('#stats')).toContainText('2196');
  await page.locator('[data-node="zapfix"]').click();await expect(page.locator('#nodeDetail')).toContainText('integration');
  await expect(page.locator('#architecture')).not.toHaveClass(/webgl-ready/);
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).cursor)).toBe(await page.locator('body').evaluate(el=>el.classList.contains('cursor-ready')?'none':'auto'));
});
test('without JavaScript content, ratings and mobile navigation are readable',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:844}});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('.nojs-nav')).toBeVisible();await expect(page.locator('#stats')).toContainText('1985');
  await expect(page.locator('#work')).toContainText('LangGraph');
  await expect(page.locator('#themeBtn')).toBeHidden();expect(await page.locator('body').evaluate(el=>getComputedStyle(el).cursor)).toBe('auto');await context.close();
});
test('WebGL failure keeps static diagrams and controls available',async({page})=>{
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.locator('#architecture').scrollIntoViewIfNeeded();
  await expect(page.locator('.architecture-fallback')).toBeVisible();
  await page.locator('[data-node="incidents"]').click();await expect(page.locator('#nodeDetail')).toContainText('Deduplication');
  expect(errors).toEqual([]);
});
test('lost WebGL contexts fall back without restarting animation',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.locator('#architecture').scrollIntoViewIfNeeded();
  await expect(page.locator('#architecture')).toHaveClass(/webgl-ready/);
  await page.locator('canvas').evaluateAll(canvases=>canvases.forEach(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}))));
  await expect(page.locator('.architecture-fallback')).toBeVisible();
  await page.locator('#motionBtn').click();await page.locator('#motionBtn').click();
  await page.locator('[data-node="database"]').click();await expect(page.locator('#nodeDetail')).toContainText('SQLAlchemy');
  await expect(page.locator('#hero-canvas')).toBeHidden();expect(errors).toEqual([]);
});
test('below-hero accessibility in both themes',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  for(const theme of ['dark','light']) {
    if(theme==='light') await page.locator('#themeBtn').click();
    const result=await new AxeBuilder({page}).include('.continuation').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});
test('local assets, anchors, contact links, and HTML structure are valid',async({page})=>{
  await page.goto('/');
  const bad=await page.locator('a[href^="#"]').evaluateAll(els=>els.map(el=>el.hash.slice(1)).filter(id=>!document.getElementById(id)));
  expect(bad).toEqual([]);expect(await page.locator('a a').count()).toBe(0);
  await expect(page.locator('a[href="mailto:gnanasri005@gmail.com"]').first()).toBeAttached();
  const assets=await page.locator('[src],link[rel="stylesheet"],link[rel="icon"]').evaluateAll(els=>els.map(el=>el.getAttribute('src')||el.getAttribute('href')).filter(url=>!url.startsWith('http')));
  for(const asset of assets) expect(fs.existsSync(path.join(__dirname,'..',asset.split('?')[0]))).toBe(true);
});
