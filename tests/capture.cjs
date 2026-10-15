// Review artifacts against the pre-change commit. Freeze decorative time and randomness only in screenshots.
const {chromium}=require('@playwright/test');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const directory=path.join(__dirname,'..','docs','screenshots');
const baseline=process.env.BASELINE_REF || 'b04f322';
(async()=>{
  fs.mkdirSync(directory,{recursive:true});
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
  const measurements={};
  for(const version of ['before','after']) for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1});
    await page.addInitScript(()=>{let seed=42;Math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;});
    await page.route('http://127.0.0.1:4173/**',async route=>{
      const url=new URL(route.request().url());
      const file=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
      let body;
      if(version==='before') body=execFileSync('git',['show',`${baseline}:${file}`],{cwd:path.join(__dirname,'..')}).toString('utf8');
      else body=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
      if(file==='js/scene.js') body=body.replace('new THREE.Clock()','({getElapsedTime:()=>4.2})');
      await route.fulfill({body,contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'text/html'});
    });
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(5000);
    await page.addStyleTag({content:'.grain,.ticker-track{animation:none!important}.cursor-dot,.cursor-ring,.cursor-blink{visibility:hidden!important}#hero{scroll-margin-top:0!important}'});
    measurements[`${version}-${width}`]=await page.locator('#hero').evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),children:[...el.querySelectorAll('.hero-name,.hero-role,.hero-tags,.hero-cta,.hero-eyebrow')].map(n=>({class:n.className,rect:n.getBoundingClientRect().toJSON(),font:getComputedStyle(n).font,text:n.textContent}))}));
    const hideHeader=await page.addStyleTag({content:'.top-nav,.ticker{visibility:hidden!important}.scroll-line{animation:none!important}'});
    await page.locator('#hero').evaluate(el=>window.scrollTo(0,el.offsetTop));await page.waitForTimeout(600);
    await page.locator('#hero').screenshot({path:path.join(directory,`hero-${version}-${width}.png`)});
    await hideHeader.evaluate(el=>el.remove());
    // Visit each section to complete the original scroll-triggered reveals too.
    const sections=await page.locator('main section').count();
    for(let i=1;i<sections;i++){await page.locator('main section').nth(i).scrollIntoViewIfNeeded();await page.waitForTimeout(version==='before'?1000:600);}
    if(version==='before') await page.evaluate(()=>{if(window.gsap)gsap.globalTimeline.getChildren().forEach(t=>t.progress(1));});
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(600);
    await page.screenshot({path:path.join(directory,`page-${version}-${width}.png`),fullPage:true});
    if(version==='after') {
      // Hide sticky chrome for a clean, complete component review image only.
      await page.addStyleTag({content:'.top-nav,.ticker{visibility:hidden!important}'});
      await page.locator('.architecture').screenshot({path:path.join(directory,`architecture-${width}.png`)});
      await page.locator('#themeBtn').evaluate(el=>el.click());await page.waitForTimeout(300);
      await page.screenshot({path:path.join(directory,`page-light-${width}.png`),fullPage:true});
    }
    await page.close();
  }
  const comparisons={};
  for(const width of [390,1440]) comparisons[width]={sameLayout:JSON.stringify(measurements[`before-${width}`])===JSON.stringify(measurements[`after-${width}`]),before:measurements[`before-${width}`],after:measurements[`after-${width}`]};
  fs.writeFileSync(path.join(directory,'hero-comparison.json'),JSON.stringify(comparisons,null,2));
  console.log(Object.fromEntries(Object.entries(comparisons).map(([w,c])=>[w,{sameLayout:c.sameLayout}])));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
