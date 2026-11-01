// AG Work Tracker — Supabase-connected PWA
// La Publishable Key es pública. Nunca pongas aquí una Secret/service_role key.
const SUPABASE_URL = "https://bkvsvpuccqmlehmiqhcf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MTDIvIADCL29cnC9DajQzw_gwnnqRy6";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});
const DB="ag-work-tracker-v2", STORE="entries";
let idb, currentUser=null, cloudEntries=[];
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));
const today=()=>new Date().toLocaleDateString("en-CA");
function openDb(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function allLocal(){return new Promise((ok,no)=>{let r=idb.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function addLocal(x){return new Promise((ok,no)=>{let r=idb.transaction(STORE,"readwrite").objectStore(STORE).add(x);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function updateLocal(x){return new Promise((ok,no)=>{let r=idb.transaction(STORE,"readwrite").objectStore(STORE).put(x);r.onsuccess=()=>ok();r.onerror=()=>no(r.error)})}
function duration(s,e){let [a,b]=s.split(":").map(Number),[c,d]=e.split(":").map(Number),m=c*60+d-(a*60+b);if(m<0)m+=1440;return m/60}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showView(v){document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===v));document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.view===v));refresh()}
async function allEntries(){let local=await allLocal();return local.sort((a,b)=>b.work_date.localeCompare(a.work_date)||b.id-a.id)}
async function refresh(){if(!currentUser)return;let rows=await allEntries(),sum=rows.reduce((s,x)=>s+Number(x.daily_pay),0),hrs=rows.reduce((s,x)=>s+Number(x.hours),0);
$("daysTotal").textContent=rows.length;$("hoursTotal").textContent=hrs.toFixed(1);$("earningsTotal").textContent=money(sum);$("reportDays").textContent=rows.length;$("averagePay").textContent=money(rows.length?sum/rows.length:0);
let now=new Date(),month=today().slice(0,7),ws=new Date();ws.setDate(now.getDate()-6);let week=ws.toLocaleDateString("en-CA");
$("monthPay").textContent=money(rows.filter(x=>x.work_date.startsWith(month)).reduce((s,x)=>s+Number(x.daily_pay),0));
$("weekPay").textContent=money(rows.filter(x=>x.work_date>=week&&x.work_date<=today()).reduce((s,x)=>s+Number(x.daily_pay),0));
let markup=rows.map(x=>`<div class="entry"><div class="entry-top"><span>${esc(x.client_name)}</span><span class="entry-pay">${money(x.daily_pay)}</span></div><div class="entry-meta">${x.work_date} · ${esc(x.job_type)} · ${x.start_time||"—"}–${x.end_time||"—"} · ${Number(x.hours).toFixed(2)} h</div>${x.notes?`<div class="entry-note">${esc(x.notes)}</div>`:""}</div>`).join("")||'<p class="empty">No hay jornadas todavía.</p>';
$("recentList").innerHTML=markup;$("historyList").innerHTML=markup}
async function syncCloud(){if(!currentUser)throw Error("Inicia sesión primero.");$("syncDetails").textContent="Sincronizando…";
let local=await allLocal();
for(const item of local){if(item.cloud_id)continue;
const payload={user_id:currentUser.id,work_date:item.work_date,client_name:item.client_name,job_type:item.job_type,start_time:item.start_time||null,end_time:item.end_time||null,hours:item.hours,daily_pay:item.daily_pay,notes:item.notes||null};
const {data,error}=await supabaseClient.from("work_entries").insert(payload).select("id").single();
if(error)throw error;item.cloud_id=data.id;await updateLocal(item)}
const {data,error}=await supabaseClient.from("work_entries").select("*").order("work_date",{ascending:false});
if(error)throw error;
for(const cloud of data){let exists=local.some(x=>x.cloud_id===cloud.id);if(!exists){await addLocal({work_date:cloud.work_date,client_name:cloud.client_name,job_type:cloud.job_type,start_time:cloud.start_time,end_time:cloud.end_time,hours:Number(cloud.hours),daily_pay:Number(cloud.daily_pay),notes:cloud.notes,cloud_id:cloud.id})}}
$("syncState").textContent="Nube sincronizada";$("syncDetails").textContent=`Sincronización correcta. ${data.length} registros en la nube.`;await refresh()}
async function enterApp(user){currentUser=user;$("authPanel").hidden=true;$("mainApp").hidden=false;$("syncState").textContent="Conectando…";await refresh();try{await syncCloud()}catch(e){$("syncState").textContent="Error de sincronización";$("syncDetails").textContent=e.message;console.error(e)}}
$("authForm").addEventListener("submit",async e=>{e.preventDefault();$("authMessage").textContent="Verificando acceso…";let {data,error}=await supabaseClient.auth.signInWithPassword({email:$("authEmail").value.trim(),password:$("authPassword").value});if(error){$("authMessage").textContent="No se pudo iniciar sesión: "+error.message;return}await enterApp(data.user)});
$("signOut").addEventListener("click",async()=>{await supabaseClient.auth.signOut();currentUser=null;$("mainApp").hidden=true;$("authPanel").hidden=false;$("syncState").textContent="Sesión cerrada"});
$("workDate").value=today();
function updateDuration(){$("durationPreview").textContent=`Duración estimada: ${duration($("startTime").value,$("endTime").value).toFixed(2)} horas`}
$("startTime").addEventListener("change",updateDuration);$("endTime").addEventListener("change",updateDuration);
$("workForm").addEventListener("submit",async e=>{e.preventDefault();if(!currentUser){alert("Inicia sesión primero.");return}let start=$("startTime").value,end=$("endTime").value,h=duration(start,end);if(h<=0){alert("Revisa las horas.");return}
let item={work_date:$("workDate").value,client_name:$("client").value.trim(),job_type:$("jobType").value,start_time:start,end_time:end,hours:h,daily_pay:Number($("pay").value),notes:$("notes").value.trim(),created_at:new Date().toISOString()};
try{let {data,error}=await supabaseClient.from("work_entries").insert({...item,user_id:currentUser.id}).select("id").single();if(error)throw error;item.cloud_id=data.id;await addLocal(item);$("workForm").reset();$("workDate").value=today();$("startTime").value="08:00";$("endTime").value="16:00";$("pay").value="200";updateDuration();await refresh();$("syncState").textContent="Guardado en nube";showView("home");alert("Jornada guardada en iPhone y nube.")}catch(err){alert("No se pudo guardar en la nube: "+err.message)}});
async function download(name,content,type){let blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
$("exportCsv").addEventListener("click",async()=>{let rows=await allEntries(),head=["Fecha","Cliente","Tipo","Entrada","Salida","Horas","Ganancia","Notas"],data=rows.map(x=>[x.work_date,x.client_name,x.job_type,x.start_time,x.end_time,x.hours,x.daily_pay,x.notes]);let csv=[head,...data].map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");download("AG-Work-Tracker.csv","\ufeff"+csv,"text/csv;charset=utf-8")});
$("syncNow").addEventListener("click",()=>syncCloud().catch(e=>{$("syncDetails").textContent=e.message}));
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
(async()=>{if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});idb=await openDb();updateDuration();let {data}=await supabaseClient.auth.getSession();if(data.session)await enterApp(data.session.user);supabaseClient.auth.onAuthStateChange((_event,session)=>{if(session&&!currentUser)enterApp(session.user)})})().catch(console.error);
