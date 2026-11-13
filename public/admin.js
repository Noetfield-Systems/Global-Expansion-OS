const form=document.querySelector("#authForm"),auth=document.querySelector("#authPanel"),desk=document.querySelector("#desk"),list=document.querySelector("#leadList"),count=document.querySelector("#leadCount"),deskError=document.querySelector("#deskError");let access="";
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function safeHref(s){try{const u=new URL(s);return ["https:","http:"].includes(u.protocol)?u.href:""}catch{return ""}}
async function fetchLeads(){
 deskError.textContent="";
 try{
  const r=await fetch("/api/admin/leads",{headers:{Authorization:"Bearer "+access}});
  if(!r.ok)throw Error(r.status===401?"Unauthorized. Check your operations token.":"Unable to load cases.");
  const d=await r.json();count.textContent=d.items.length+" recent requests";
  if(!d.items.length){list.innerHTML='<div class="ops-empty">No founder requests yet. New submissions appear here.</div>';return;}
  list.innerHTML=d.items.map(item=>{
   const url=safeHref(item.business_url);
   const meta=[["Country",item.country],["Stage",item.business_stage],["Destination",item.destination],["Budget",item.budget],["Service",item.service],["Source",item.source],["Created",new Date(item.created_at).toLocaleString()]];
   return '<article class="ops-item" data-id="'+escapeHtml(item.id)+'"><div><div class="ops-item-head"><h3>'+escapeHtml(item.name)+'</h3><span class="ops-status">'+escapeHtml(item.status)+'</span></div><p><a href="mailto:'+encodeURIComponent(item.email)+'">'+escapeHtml(item.email)+'</a></p><h3>'+escapeHtml(item.business_name||"Unnamed business")+'</h3>'+(url?'<p><a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(url)+'">'+escapeHtml(url)+'</a></p>':"")+'<p>'+escapeHtml(item.description)+'</p><div class="ops-meta">'+meta.map(m=>'<span>'+escapeHtml(m[0])+': <b>'+escapeHtml(m[1]||"—")+'</b></span>').join("")+'</div><p class="ops-pills">Priorities: '+escapeHtml((item.goals||[]).join(", ")||"Not specified")+'</p><div class="ops-id">'+escapeHtml(item.id)+'</div></div><form class="ops-update"><label>Case status<select name="status">'+["new","reviewing","qualified","contacted","closed"].map(x=>'<option '+(item.status===x?"selected ":"")+'value="'+x+'">'+x+'</option>').join("")+'</select></label><label>Responsible owner<input name="owner" maxlength="100" required value="'+escapeHtml(item.case_owner)+'"></label><label>Next action<input name="nextAction" maxlength="250" required value="'+escapeHtml(item.next_action)+'"></label><div class="ops-pills">Follow-up due: '+escapeHtml(new Date(item.next_action_due).toLocaleString())+'</div><button class="button button-gold" type="submit">Save case update ↗</button><span class="ops-saved" role="status"></span></form></article>'
  }).join("");
  list.querySelectorAll(".ops-update").forEach(f=>f.addEventListener("submit",saveCase));
 }catch(e){deskError.textContent=e.message}
}
async function saveCase(e){
 e.preventDefault();const f=e.currentTarget,id=f.closest(".ops-item").dataset.id,d=new FormData(f),status=f.querySelector(".ops-saved"),button=f.querySelector("button");
 status.textContent="Saving…";button.disabled=true;
 try{
  const r=await fetch("/api/admin/leads/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+access},body:JSON.stringify({status:d.get("status"),owner:d.get("owner"),nextAction:d.get("nextAction")})});
  const data=await r.json();if(!r.ok||!data.ok)throw Error(data.error||"Save failed");status.textContent="✓ Saved";f.closest(".ops-item").querySelector(".ops-status").textContent=data.item.status;
 }catch(e){status.textContent=e.message}finally{button.disabled=false}
}
form.addEventListener("submit",async e=>{
 e.preventDefault();access=document.querySelector("#token").value.trim();auth.hidden=true;desk.hidden=false;await fetchLeads();
 if(deskError.textContent){auth.hidden=false;desk.hidden=true;document.querySelector("#authError").textContent=deskError.textContent;access=""}
});
document.querySelector("#refresh").addEventListener("click",fetchLeads);
document.querySelector("#lock").addEventListener("click",()=>{access="";document.querySelector("#token").value="";list.innerHTML="";desk.hidden=true;auth.hidden=false});
