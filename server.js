import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";

const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,"public");
const port=Number(process.env.PORT||3000);
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:20000}):null;
const adminSecret=process.env.ADMIN_TOKEN||"";
const maxBody=18000,ipHits=new Map();
const markets=new Set(["US","UK","EU","UAE","CA","OTHER","UNDECIDED"]);
const services=new Set(["readiness","launch","operations","unsure"]);
const budgets=new Set(["under-1000","1000-3000","3000-10000","10000-25000","25000-plus","undecided"]);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8"};
const clean=(v,n=250)=>String(v??"").trim().slice(0,n);
const pick=(v,set,fallback)=>set.has(v)?v:fallback;
function json(res,status,value,extra={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...extra});res.end(JSON.stringify(value));}
function security(res){
 res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
 res.setHeader("X-Frame-Options","DENY");res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");
 res.setHeader("Cross-Origin-Opener-Policy","same-origin");
 res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://images-assets.nasa.gov; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
}
async function initDB(){
 if(!pool){console.warn("DATABASE_URL not set. Founder intake returns 503 until DB linked.");return;}
 await pool.query([
  "CREATE TABLE IF NOT EXISTS founder_intakes (",
  "id uuid PRIMARY KEY, submission_key uuid NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),",
  "name text NOT NULL, email text NOT NULL, country text NOT NULL, business_name text, business_url text,",
  "description text, business_stage text, destination text NOT NULL, budget text NOT NULL,",
  "service text NOT NULL, goals jsonb NOT NULL DEFAULT '[]', language text NOT NULL DEFAULT 'en', source text,",
  "status text NOT NULL DEFAULT 'new', case_owner text NOT NULL DEFAULT 'intake-queue',",
  "next_action text NOT NULL DEFAULT 'Review founder request',",
  "next_action_due timestamptz NOT NULL DEFAULT (now() + interval '2 days'),",
  "consented_at timestamptz NOT NULL DEFAULT now())"
 ].join(" "));
 await pool.query("CREATE INDEX IF NOT EXISTS founder_intakes_created ON founder_intakes(created_at DESC)");
 console.info("database schema ready");
}
function limited(req){
 const now=Date.now(),key=clean(req.headers["x-forwarded-for"]?.toString().split(",")[0]||req.socket.remoteAddress,100);
 const arr=(ipHits.get(key)||[]).filter(t=>now-t<3600000);if(arr.length>=8){ipHits.set(key,arr);return true;}
 arr.push(now);ipHits.set(key,arr);if(ipHits.size>2000){for(const [k,v] of ipHits)if(!v.some(t=>now-t<3600000))ipHits.delete(k);}return false;
}
function authed(req){if(adminSecret.length<24)return false;const a=Buffer.from((req.headers.authorization||"").replace(/^Bearer /i,"")),b=Buffer.from(adminSecret);return a.length===b.length&&timingSafeEqual(a,b);}
async function readBody(req){
 let size=0,data="";for await(const chunk of req){size+=chunk.length;if(size>maxBody)throw Error("TOO_LARGE");data+=chunk.toString();}
 try{return JSON.parse(data);}catch{throw Error("INVALID_JSON");}
}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host;}catch{return false;}}
async function intake(req,res){
 if(!sameOrigin(req))return json(res,403,{error:"Invalid origin"});
 if(!req.headers["content-type"]?.startsWith("application/json"))return json(res,415,{error:"JSON required"});
 if(limited(req))return json(res,429,{error:"Too many requests. Try again later."},{"Retry-After":"3600"});
 let d;try{d=await readBody(req);}catch{return json(res,400,{error:"Invalid request body"});}
 if(d.website_field)return json(res,200,{ok:true,status:"received"});
 const name=clean(d.name,100),email=clean(d.email,250).toLowerCase(),country=clean(d.country,100);
 const description=clean(d.description,1200),businessName=clean(d.businessName,120),website=clean(d.businessUrl,240);
 const destination=pick(d.destination,markets,"UNDECIDED"),budget=pick(d.budget,budgets,"undecided");
 const service=pick(d.service,services,"unsure"),language=["en","tr","ar","fa"].includes(d.language)?d.language:"en";
 const stage=clean(d.businessStage,80),source=clean(d.source,120);
 const goals=(Array.isArray(d.goals)?d.goals:[]).map(g=>clean(g,50)).slice(0,8);
 const key=clean(d.submissionKey,50);
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(key)||name.length<2||!country||description.length<15||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||d.consent!==true) return json(res,422,{error:"Complete required fields and accept the privacy notice."});
 if(website&&!/^https?:\/\/[^\s]+\.[^\s]+/i.test(website))return json(res,422,{error:"Enter a full website URL or leave it blank."});
 if(!pool)return json(res,503,{error:"Intake is temporarily unavailable. No request was saved."});
 try{
  const result=await pool.query("INSERT INTO founder_intakes (id,submission_key,name,email,country,business_name,business_url,description,business_stage,destination,budget,service,goals,language,source) VALUES ($1,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15) ON CONFLICT (submission_key) DO UPDATE SET submission_key=EXCLUDED.submission_key RETURNING id",[randomUUID(),key,name,email,country,businessName,website,description,stage,destination,budget,service,JSON.stringify(goals),language,source]);
  return json(res,201,{ok:true,caseId:result.rows[0].id,status:"received"});
 }catch(e){console.error("intake DB issue",e.code||e.message);return json(res,503,{error:"Unable to save your request. Please retry."});}
}
async function admin(req,res,url){
 if(!authed(req))return json(res,401,{error:"Authorization required"});
 if(!pool)return json(res,503,{error:"Database unavailable"});
 if(req.method==="GET"&&url.pathname==="/api/admin/leads"){
  try{const r=await pool.query("SELECT * FROM founder_intakes ORDER BY created_at DESC LIMIT 200");return json(res,200,{items:r.rows});}catch(e){console.error("admin read issue",e.code||e.message);return json(res,503,{error:"Database unavailable"});}
 }
 if(req.method==="PATCH"&&/^\/api\/admin\/leads\/[0-9a-f-]{36}$/.test(url.pathname)){
  if(!sameOrigin(req))return json(res,403,{error:"Invalid origin"});let d;try{d=await readBody(req);}catch{return json(res,400,{error:"Invalid JSON"});}
  const status=["new","reviewing","qualified","contacted","closed"].includes(d.status)?d.status:null,owner=clean(d.owner,100),next=clean(d.nextAction,250);
  if(!status||!owner||!next)return json(res,422,{error:"Status, owner, and next action required"});
  try{const r=await pool.query("UPDATE founder_intakes SET status=$1,case_owner=$2,next_action=$3,next_action_due=now()+interval '2 days' WHERE id=$4 RETURNING id,status,case_owner,next_action",[status,owner,next,url.pathname.split("/").pop()]);return r.rowCount?json(res,200,{ok:true,item:r.rows[0]}):json(res,404,{error:"Case not found"});}catch(e){console.error("admin write issue",e.code||e.message);return json(res,503,{error:"Database write unavailable"});}
 }
 return json(res,404,{error:"Not found"});
}
function staticFile(res,p){
 const file=p==="/"?"index.html":p==="/ops"?"admin.html":p.slice(1);
 const full=path.resolve(publicDir,file);
 if(!(full.startsWith(publicDir+path.sep))||!existsSync(full)||!statSync(full).isFile()){res.writeHead(404);return res.end("Not found");}
 const ext=path.extname(full);
 res.writeHead(200,{"Content-Type":mime[ext]||"application/octet-stream","Cache-Control":ext===".html"?"no-cache":"public, max-age=3600"});
 createReadStream(full).pipe(res);
}
const server=http.createServer(async(req,res)=>{
 security(res);const url=new URL(req.url||"/","http://localhost");
 try{
  if(url.pathname==="/healthz"){if(!pool)return json(res,503,{ok:false,db:"not_configured"});try{await pool.query("SELECT 1");return json(res,200,{ok:true,db:"ready"});}catch{return json(res,503,{ok:false,db:"unavailable"});}}
  if(url.pathname==="/api/intakes"&&req.method==="POST")return await intake(req,res);
  if(url.pathname.startsWith("/api/admin/"))return await admin(req,res,url);
  if(url.pathname.startsWith("/api/"))return json(res,404,{error:"Not found"});
  if(req.method!=="GET"&&req.method!=="HEAD")return json(res,405,{error:"Method not allowed"});
  return staticFile(res,url.pathname);
 }catch(e){console.error("unhandled",e.message);return json(res,500,{error:"Unexpected server error"});}
});
initDB().catch(e=>console.error("DB initialization pending",e.code||e.message)).finally(()=>server.listen(port,"0.0.0.0",()=>console.info("Global Expansion OS listening on "+port)));
process.on("SIGTERM",()=>server.close(async()=>{await pool?.end();process.exit(0);}));
