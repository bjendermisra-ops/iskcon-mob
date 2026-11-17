/* V21 offline-first multilingual schedule / Japa controls. */
(function(){
"use strict";
const sch=/\/schedule\.html$/.test(location.pathname), jap=/\/global_jap\.html$/.test(location.pathname);
if(!sch&&!jap)return;
const b=window.AndroidBridge, native=!!(b&&typeof b.getReminderState==="function");
let cfg=null, box=null;
const $=id=>document.getElementById(id);
const language=()=>{const v=localStorage.getItem("lang")||"hi";return ["en","hi","mr"].includes(v)?v:"hi"};
const state=()=>{try{return native?JSON.parse(b.getReminderState()):{}}catch(e){return {}}};
const clock=t=>{const a=t.split(":");let h=+a[0];return ((h%12)||12)+":"+a[1]+" "+(h>=12?"PM":"AM")};
function valid(c){return c&&c.timezone==="Asia/Kolkata"&&c.japa&&/^([01]\d|2[0-3]):[0-5]\d$/.test(c.japa.time)&&Array.isArray(c.events)&&c.events.length<=60&&c.events.every(e=>Number.isInteger(e.id)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)&&e.en&&e.hi&&e.mr)}
function prefs(){
 if(!sch||!native)return;
 const p=state().schedule;if(!p)return;
 const out={};Object.keys(p).forEach(id=>{const ev=EVENTS.find(x=>String(x.id)===id);if(!ev)return;const m=+p[id];out[id]={advanceMinutes:m,reqCode:100000+(+id),timestamp:calculateExactAlarmTarget(ev.h,m).timestamp,eventHour:ev.h}});
 reminderStore=out;try{localStorage.setItem("schedule_reminders",JSON.stringify(out))}catch(e){}
 renderUI();updateTime();
}
function drawSchedule(){
 if(!sch||!cfg||typeof EVENTS==="undefined")return;
 const former={};EVENTS.forEach(e=>former[e.id]=e);
 const mapped=cfg.events.filter(e=>e.enabled!==false).map(e=>{
  const h=+e.time.slice(0,2)+(+e.time.slice(3)/60);
  const item={id:e.id,t:clock(e.time),h};
  for(const l of ["en","hi","mr"])item[l]={n:e[l],d:(e.desc&&e.desc[l])||(former[e.id]&&former[e.id][l]&&former[e.id][l].d)||""};
  return item;
 });
 EVENTS.splice(0,EVENTS.length,...mapped);renderUI();updateTime();
}
function drawJapa(){
 if(!jap||!box)return;
 const j=cfg&&cfg.japa?cfg.japa:{time:"05:15",end:"07:30",enabled:true};
 const p=state(),l=language();
 const label={en:["📿 Global Japa Reminders","Early reminder","At Japa start","Save Reminders"],hi:["📿 ग्लोबल जप रिमाइंडर","जप से पहले याद दिलाएं","जप शुरू होने पर","रिमाइंडर सेव करें"],mr:["📿 ग्लोबल जप रिमाइंडर","जपाआधी आठवण द्या","जप सुरू होताना","रिमाइंडर सेव्ह करा"]}[l];
 box.innerHTML='<h3 style="margin:0 0 12px;font-size:18px">'+label[0]+'</h3><p>'+clock(j.time)+' IST – '+clock(j.end)+' IST</p>'+
 '<label style="display:block;margin:12px 0"><input type="checkbox" id="japaPre"> '+label[1]+'</label>'+
 '<label style="display:block;margin:12px 0"><input type="checkbox" id="japaAt"> '+label[2]+'</label>'+
 '<label style="display:block;margin:12px 0">⏱ <select id="japaM"><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option></select></label>'+
 '<button id="japaSave" style="border:0;border-radius:12px;background:#e65100;color:white;padding:12px 16px">'+label[3]+'</button>';
 $("japaPre").checked=!!p.japaEarly;$("japaAt").checked=!!p.japaStart;$("japaM").value=String(p.japaAdvance||10);
 $("japaSave").onclick=()=>{
  if(!native){alert("Please update the Android APK to v21");return}
  b.setJapaReminders($("japaPre").checked,$("japaAt").checked,+$("japaM").value);
  b.setReminderLanguage(language());
  if(b.hasNotificationPermission&&!b.hasNotificationPermission())b.requestNotificationPermission();
  if(b.hasExactAlarmPermission&&!b.hasExactAlarmPermission())b.requestExactAlarmPermission();
  $("japaSave").textContent=l==="en"?"Saved ✓":"सेव ✓";
 };
 try{
  if(typeof LIVE_START_MIN!=="undefined")LIVE_START_MIN=+j.time.slice(0,2)*60+(+j.time.slice(3));
  if(typeof LIVE_END_MIN!=="undefined")LIVE_END_MIN=+j.end.slice(0,2)*60+(+j.end.slice(3));
  if(typeof updateClockAndStatus==="function")updateClockAndStatus();
 }catch(e){}
}
function useConfig(c){
 if(!valid(c))return false;cfg=c;
 try{localStorage.setItem("temple_schedule_v21",JSON.stringify(c))}catch(e){}
 if(native)try{b.applyScheduleJson(JSON.stringify(c))}catch(e){}
 drawSchedule();prefs();drawJapa();return true;
}
async function refresh(){
 try{const r=await fetch("data/schedule.json?ts="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return useConfig(await r.json())}
 catch(e){return false}
}
function boot(){
 const st=state();if(st.config)useConfig(st.config);
 else try{const c=JSON.parse(localStorage.getItem("temple_schedule_v21")||"null");if(c)useConfig(c)}catch(e){}
 refresh();addRefresh();
}
function addRefresh(){
 if($("v21Refresh"))return;const anchor=sch?$("container_schedule"):document.querySelector(".japa-counter-wrapper");if(!anchor)return;
 const btn=document.createElement("button");btn.id="v21Refresh";btn.type="button";btn.textContent="🔄 "+(language()==="en"?"Refresh time":language()==="mr"?"वेळ अपडेट करा":"समय अपडेट करें");
 btn.style.cssText="display:block;margin:14px auto;border:0;border-radius:12px;padding:12px 20px;background:#ef7a19;color:#fff;font-weight:700";
 btn.onclick=async()=>{btn.disabled=true;const ok=await refresh();if(native)b.syncScheduleNow();btn.textContent=ok?"✓ Updated":"Offline · cached timings";setTimeout(()=>{btn.disabled=false;btn.textContent="🔄 Refresh Schedule"},2500)};
 anchor.parentNode.insertBefore(btn,anchor);
}
function setLang(){if(native)try{b.setReminderLanguage(language())}catch(e){}}
if(sch){
 const old=window.bootLoader;window.bootLoader=function(){
  old();setLang();
  if(native){try{b.migrateLegacySchedule(localStorage.getItem("schedule_reminders")||"{}")}catch(e){}}
  boot();
 };
 const orig=window.manualLangSwitch;window.manualLangSwitch=function(){orig();setLang()};
}
if(jap){
 const launch=()=>{
  const anchor=document.querySelector(".japa-counter-wrapper");if(anchor){box=document.createElement("section");box.style.cssText="background:#fff9ef;color:#402b1c;margin:16px auto;padding:20px;border:1px solid #e6ac66;border-radius:16px;max-width:650px";anchor.parentNode.insertBefore(box,anchor)}
  setLang();drawJapa();boot();
  const old=window.setLanguage;if(typeof old==="function")window.setLanguage=function(l){old(l);setLang();drawJapa()};
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",launch);else launch();
}
window.addEventListener("temple-schedule-updated",refresh);
})();