/**
 * Deployment-gating integration smoke.
 * Runs INSIDE Railway's pre-deploy environment where DATABASE_URL and ADMIN_TOKEN exist.
 * A uniquely identified synthetic case is created, read, updated, and permanently deleted.
 * Failure means that the new build must not replace the last working deployment.
 */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { Pool } from "pg";

if(!process.env.DATABASE_URL)throw Error("E2E_FAIL: DATABASE_URL is not configured");
if(!process.env.ADMIN_TOKEN||process.env.ADMIN_TOKEN.length<24)throw Error("E2E_FAIL: ADMIN_TOKEN is not configured");

const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:8000});
const port=41000+Math.floor(Math.random()*15000),base="http://127.0.0.1:"+port;
const submissionKey=randomUUID(),marker="synthetic-e2e",email="synthetic+"+submissionKey+"@example.invalid";
let caseId=null,child=null,logs="";
const req=(url,options={})=>fetch(base+url,{...options,signal:AbortSignal.timeout(9000)});
try {
 child=spawn(process.execPath,["server.js"],{
  env:{...process.env,PORT:String(port)},
  stdio:["ignore","pipe","pipe"]
 });
 child.stdout.on("data",b=>logs+=b.toString());
 child.stderr.on("data",b=>logs+=b.toString());
 let ready=false;
 for(let i=0;i<90;i++){
  if(child.exitCode!==null)throw Error("App exited before healthcheck: "+logs.slice(-1500));
  try{const r=await req("/healthz");if(r.status===200){ready=true;break}}catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 assert(ready,"App healthcheck did not become ready: "+logs.slice(-1200));
 const payload={
  submissionKey,name:"SYNTHETIC E2E - DO NOT CONTACT",email,country:"QA TEST",
  businessName:"SYNTHETIC TEST ONLY",businessStage:"mvp",
  description:"Automated internal E2E test for database persistence; not a customer or real business.",
  destination:"US",budget:"1000-3000",service:"readiness",goals:["company_setup"],
  language:"en",source:marker,consent:true,website_field:""
 };
 const post=await req("/api/intakes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const saved=await post.json();
 assert.equal(post.status,201,"Intake must persist: "+JSON.stringify(saved));
 assert.equal(saved.ok,true,"Intake API returned no success");
 assert.match(saved.caseId,/^[0-9a-f-]{36}$/);
 caseId=saved.caseId;
 const direct=await pool.query("SELECT * FROM founder_intakes WHERE id=$1",[caseId]);
 assert.equal(direct.rowCount,1,"Intake missing in PostgreSQL");
 assert.equal(direct.rows[0].email,email);
 assert.equal(direct.rows[0].source,marker);
 assert.equal(direct.rows[0].status,"new");
 assert.equal(direct.rows[0].case_owner,"intake-queue");
 assert(direct.rows[0].next_action,"Actionable intake needs next action");
 const adminHeaders={Authorization:"Bearer "+process.env.ADMIN_TOKEN};
 const forbidden=await req("/api/admin/leads");
 assert.equal(forbidden.status,401,"Uncredentialed admin access must be blocked");
 const listing=await req("/api/admin/leads",{headers:adminHeaders});
 assert.equal(listing.status,200,"Authorized admin listing failed");
 const cases=await listing.json();
 assert(cases.items.some(item=>item.id===caseId),"Synthetic case not visible in operations desk");
 const patch=await req("/api/admin/leads/"+caseId,{
  method:"PATCH",headers:{...adminHeaders,"Content-Type":"application/json"},
  body:JSON.stringify({status:"reviewing",owner:"e2e-verifier",nextAction:"Synthetic end-to-end follow-up verification"})
 });
 assert.equal(patch.status,200,"Case update API failed");
 const changed=await patch.json();
 assert.equal(changed.item.status,"reviewing");
 assert.equal(changed.item.case_owner,"e2e-verifier");
 const confirm=await pool.query("SELECT status,case_owner,next_action FROM founder_intakes WHERE id=$1",[caseId]);
 assert.equal(confirm.rows[0].status,"reviewing");
 assert.equal(confirm.rows[0].case_owner,"e2e-verifier");
 console.info("E2E PASS: health, intake 201, persisted case, admin 401, authorized read, PATCH update, verified DB state");
}finally {
 if(caseId){
  try{
   const result=await pool.query("DELETE FROM founder_intakes WHERE id=$1 AND source=$2 AND email=$3",[caseId,marker,email]);
   if(result.rowCount!==1)process.exitCode=1;
   console.info("Synthetic E2E case cleanup count:",result.rowCount);
  }catch(e){console.error("E2E cleanup failed:",e.message);process.exitCode=1}
 }
 if(child && child.exitCode===null){child.kill("SIGTERM")}
 await pool.end();
}
