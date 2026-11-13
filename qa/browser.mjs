import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const port=39881,origin="http://127.0.0.1:"+port;
const child=spawn(process.execPath,["server.js"],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATABASE_URL:"",ADMIN_TOKEN:""}});
let log="";
child.stdout.on("data",d=>log+=d.toString());
child.stderr.on("data",d=>log+=d.toString());
const start=Date.now();
while(!log.includes("listening on")){
 if(child.exitCode!==null)throw Error("Server exited: "+log);
 if(Date.now()-start>15000)throw Error("Server did not start: "+log);
 await new Promise(resolve=>setTimeout(resolve,120));
}
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
try{
 await mkdir("artifacts",{recursive:true});
 const desktop=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
 desktop.on("pageerror",e=>errors.push("desktop: "+e.message));
 await desktop.goto(origin,{waitUntil:"domcontentloaded"});
 await desktop.waitForSelector(".hero-console");
 assert.equal(await desktop.locator(".capability").count(),6,"Six hero capabilities are present");
 assert.equal(await desktop.locator(".visual-card").count(),3,"Three premium service cards are present");
 assert.equal(await desktop.locator(".step").count(),5,"Five execution steps are present");
 assert.equal(await desktop.locator(".tier").count(),3,"Three commercial packages are present");
 assert.equal(await desktop.locator(".country").count(),12,"All regional market markers are present");
 assert.match(await desktop.locator("#hero-title").innerText(),/Built locally/i);
 assert.equal(await desktop.locator(".world-visual").count(),1,"Original world artwork must be present");
 const visual=await desktop.locator(".world-visual").evaluate(el=>el.complete&&el.naturalWidth>0);
 assert.equal(visual,true,"Globe SVG must load");
 assert.equal(await desktop.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,"No desktop horizontal overflow");
 assert.equal(await desktop.locator("#compareDialog").getAttribute("open"),null);
 await desktop.locator("#comparePlansBtn").click();
 assert.equal(await desktop.locator("#compareDialog").evaluate(el=>el.open),true,"Comparison dialog should open");
 assert.equal(await desktop.locator(".compare-table tbody tr").count(),6,"All comparison rows are present");
 await desktop.locator("#compareClose").click();
 assert.equal(await desktop.locator("#compareDialog").evaluate(el=>el.open),false,"Comparison dialog should close");
 await desktop.locator('.console-tab[data-panel="market"]').click();
 assert.match(await desktop.locator("#consoleHeading").innerText(),/market/i);
 await desktop.locator("#lang").selectOption("fa");
 assert.equal(await desktop.evaluate(()=>document.documentElement.dir),"rtl","Persian layout is RTL");
 assert.match(await desktop.locator("#hero-title").innerText(),/محلی/);
 await desktop.locator("#lang").selectOption("en");
 await desktop.screenshot({path:"artifacts/desktop-1440.png",fullPage:true});
 // Exercise the entire founder form. Failing storage must not produce a success.
 await desktop.locator(".hero-ctas .js-intake").first().click();
 assert.equal(await desktop.locator("#intakeDialog").evaluate(el=>el.open),true);
 await desktop.locator("#fName").fill("Synthetic QA Founder");
 await desktop.locator("#fEmail").fill("qa-founder@example.invalid");
 await desktop.locator("#fCountry").fill("Türkiye");
 await desktop.locator("#formNext").click();
 await desktop.locator("#fStage").selectOption("mvp");
 await desktop.locator("#formNext").click();
 await desktop.locator("#fDescription").fill("Synthetic UI smoke test. No real startup or customer transaction.");
 await desktop.locator("#fConsent").check();
 await desktop.locator("#formSubmit").click();
 await desktop.locator("#formError").waitFor({state:"visible"});
 assert.equal(await desktop.locator("#formSuccess").isVisible(),false,"Server failure cannot show fake success");
 assert.match(await desktop.locator("#formError").innerText(),/unavailable|not saved/i);
 // A successful, mocked 201 verifies form handling, not database persistence.
 await desktop.route("**/api/intakes",route=>route.fulfill({status:201,contentType:"application/json",body:JSON.stringify({ok:true,caseId:"123e4567-e89b-42d3-a456-426614174000",status:"received"})}));
 await desktop.locator("#formSubmit").click();
 await desktop.locator("#formSuccess").waitFor({state:"visible"});
 assert.match(await desktop.locator("#caseRef").innerText(),/123e4567/);
 await desktop.locator("#successClose").click();
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 mobile.on("pageerror",e=>errors.push("mobile: "+e.message));
 await mobile.goto(origin,{waitUntil:"domcontentloaded"});
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,"No mobile horizontal overflow");
 assert.equal(await mobile.locator(".capability").count(),6);
 assert.equal(await mobile.locator(".visual-card").count(),3);
 await mobile.locator("#menuToggle").click();
 assert.equal(await mobile.locator("#menuToggle").getAttribute("aria-expanded"),"true");
 await mobile.locator("#menuToggle").click();
 await mobile.screenshot({path:"artifacts/mobile-390.png",fullPage:true});
 assert.deepEqual(errors,[],"No uncaught JS errors on desktop or mobile");
 console.log("PASS: 1440px desktop, 390px mobile, RTL, pricing dialog, OS tabs, full intake fail-closed and mocked 201, console errors");
}finally{
 await browser.close();
 child.kill("SIGTERM");
}
