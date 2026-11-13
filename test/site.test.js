import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

test("public site and secure intake fail-closed contract", async t=>{
 const port=39871,base="http://127.0.0.1:"+port;
 const proc=spawn(process.execPath,["server.js"],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATABASE_URL:"",ADMIN_TOKEN:""}});
 t.after(()=>proc.kill("SIGTERM"));
 let output="";
 await Promise.race([
  new Promise((resolve,reject)=>{
   proc.stdout.on("data",d=>{output+=d.toString();if(output.includes("listening on"))resolve()});
   proc.stderr.on("data",d=>{output+=d.toString()});
   proc.once("exit",code=>reject(Error("Server exited "+code+" "+output)));
  }),
  new Promise((_,reject)=>setTimeout(()=>reject(Error("Server startup timeout "+output)),12000))
 ]);
 const home=await fetch(base+"/");
 assert.equal(home.status,200);
 const html=await home.text();
 assert.match(html,/Built locally/);
 assert.match(html,/id="intakeForm"/);
 assert.doesNotMatch(html,/60,000\+ founders|Trusted by founders|Iran/);
 assert.equal((await fetch(base+"/styles.css")).status,200);
 assert.equal((await fetch(base+"/app.js")).status,200);
 assert.equal((await fetch(base+"/favicon.svg")).status,200);
 assert.equal((await fetch(base+"/ops")).status,200);
 assert.equal((await fetch(base+"/healthz")).status,503);
 assert.equal((await fetch(base+"/api/admin/leads")).status,401);
 const missing=await fetch(base+"/api/intakes",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
 assert.equal(missing.status,422);
 const good=await fetch(base+"/api/intakes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
  submissionKey:randomUUID(),name:"Test Case",email:"test@example.invalid",country:"Türkiye",
  description:"Testing database fail-closed behavior only",destination:"US",budget:"1000-3000",service:"readiness",consent:true
 })});
 assert.equal(good.status,503);
 const result=await good.json();
 assert.equal(result.ok,undefined);
 assert.match(result.error,/No request was saved/);
 assert.equal((await fetch(base+"/../server.js")).status,404);
});
