const DB_NAME="aura-tts-studio", DB_VERSION=1;
let db;
const $=s=>document.querySelector(s);
const fmt=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`;
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("models"))d.createObjectStore("models",{keyPath:"id"});if(!d.objectStoreNames.contains("audio"))d.createObjectStore("audio",{keyPath:"id"});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function store(name,mode="readonly"){return db.transaction(name,mode).objectStore(name);}
function all(name){return new Promise((res,rej)=>{const r=store(name).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function put(name,value){return new Promise((res,rej)=>{const r=store(name,"readwrite").put(value);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function del(name,id){return new Promise((res,rej)=>{const r=store(name,"readwrite").delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function toast(s){const t=$("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);}
function id(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function kind(name){const ext=(name.split(".").pop()||"FILE").toUpperCase();return ext.slice(0,5);}
async function refresh(){
 const models=await all("models"), audios=await all("audio");
 $("#modelCount").textContent=models.length;$("#audioCount").textContent=audios.length;
 $("#modelSelect").innerHTML=models.length?models.filter(x=>/onnx|ort/i.test(x.name)).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join(""):'<option value="">Kein ONNX-Modell registriert</option>';
 $("#modelList").className="stack"+(models.length?"":" empty-state");
 $("#modelList").innerHTML=models.length?models.map(x=>`<div class="item"><div class="file-icon">${esc(kind(x.name))}</div><div class="item-main"><b>${esc(x.name)}</b><span>${fmt(x.size)} · ${new Date(x.added).toLocaleDateString()}</span></div><button data-del-model="${esc(x.id)}" aria-label="Datei löschen">×</button></div>`).join(""):"Noch keine Dateien importiert.";
 $("#audioList").className="stack"+(audios.length?"":" empty-state");
 $("#audioList").innerHTML=audios.length?audios.map(x=>`<div class="item"><div class="file-icon">WAV</div><div class="item-main"><b>${esc(x.name)}</b><span>${fmt(x.size)} · ${new Date(x.added).toLocaleString()}</span></div><button data-download="${esc(x.id)}">↓</button><button data-del-audio="${esc(x.id)}">×</button></div>`).join(""):"Noch keine Audiodateien vorhanden.";
}
$("#modelFiles").addEventListener("change",async e=>{
 const files=[...e.target.files];if(!files.length)return;
 let ok=0;
 for(const f of files){await put("models",{id:id(),name:f.name,size:f.size,type:f.type,added:Date.now(),blob:f});ok++;}
 e.target.value="";await refresh();toast(`${ok} Datei(en) lokal importiert.`);
});
document.addEventListener("click",async e=>{
 const m=e.target.closest("[data-del-model]");if(m){await del("models",m.dataset.delModel);refresh();toast("Modelldatei gelöscht.");}
 const a=e.target.closest("[data-del-audio]");if(a){await del("audio",a.dataset.delAudio);refresh();toast("Audiodatei gelöscht.");}
 const d=e.target.closest("[data-download]");if(d){const x=(await all("audio")).find(v=>v.id===d.dataset.download);if(x)downloadBlob(x.blob,x.name);}
});
function downloadBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);}
$("#textInput").addEventListener("input",e=>$("#charCount").textContent=`${e.target.value.length} / 12000`);
$("#clearText").onclick=()=>{$("#textInput").value="";$("#charCount").textContent="0 / 12000";};
$("#demoWav").onclick=async()=>{
 // A 1-second low-volume test tone proves WAV creation/export only; it is not speech.
 const rate=24000,n=rate,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
 const write=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
 write(0,"RIFF");v.setUint32(4,36+n*2,true);write(8,"WAVE");write(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,"data");v.setUint32(40,n*2,true);
 for(let i=0;i<n;i++){const sample=Math.sin(2*Math.PI*440*i/rate)*0.08;v.setInt16(44+i*2,sample*32767,true);}
 const blob=new Blob([buf],{type:"audio/wav"}),name=`aura-wav-test-${Date.now()}.wav`;
 await put("audio",{id:id(),name,size:blob.size,added:Date.now(),blob});await refresh();downloadBlob(blob,name);toast("Test-WAV erstellt und gespeichert.");
};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===`view-${b.dataset.view}`));});
$("#settingsBtn").onclick=()=>$("#settingsDialog").showModal();
$("#clearAll").onclick=async()=>{if(!confirm("Alle lokal gespeicherten Modelle und Audiodateien löschen?"))return;for(const n of ["models","audio"]){await new Promise((res,rej)=>{const r=store(n,"readwrite").clear();r.onsuccess=res;r.onerror=()=>rej(r.error);});}$("#settingsDialog").close();refresh();toast("Lokale Daten gelöscht.");};
$("#refreshModels").onclick=refresh;
(async()=>{try{db=await openDB();await refresh();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});}catch(e){$("#storageState").textContent="ERROR";toast("Lokaler Speicher konnte nicht initialisiert werden.");}})();
