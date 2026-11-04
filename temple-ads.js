/* Native AdMob placement API v2. Completion can only originate from Android SDK. */
(function (root) {
  'use strict';
  if (root.TempleAds) return;
  var script = document.currentScript;
  var base = new URL('.', script ? script.src : location.href);
  var pending = new Map(), sequence = 0, configPromise, rewardBusy=false, closePrompt=null;
  function bridge() { return root.TempleAdsNative; }
  function capable() { try { return bridge() && bridge().version() >= 1; } catch (_) { return false; } }
  function result(status) { return { status: status, unlocked: status === 'earned' || status === 'unlocked' }; }
  function config() {
    if (!configPromise) configPromise = (async function () {
      var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 8000);
      try {
        var response = await fetch(new URL('ads-config.json', base), {cache:'no-cache', signal:controller.signal});
        if (!response.ok) throw new Error('Config unavailable');
        var data = await response.json();
        if (data.version !== 1 || !data.placements || typeof data.placements !== 'object') throw new Error('Invalid config');
        return data;
      } finally { clearTimeout(timer); }
    })().catch(function (e) { configPromise = null; throw e; });
    return configPromise;
  }
  function call(placement, operation, options) {
    return new Promise(function (resolve) {
      if (!capable()) { resolve(result('unsupported')); return; }
      var id = 'r' + Date.now() + '_' + (++sequence);
      var entry = {resolve:resolve, timer:null}; pending.set(id,entry);
      entry.timer = setTimeout(function () { pending.delete(id); resolve(result('unavailable')); },20000);
      try {
        if (operation === 'status') bridge().status(id,placement);
        else bridge().request(JSON.stringify(Object.assign({},options,{id:id,placement:placement})));
      } catch (_) { clearTimeout(entry.timer); pending.delete(id); resolve(result('unavailable')); }
    });
  }
  root.addEventListener('temple-ad-result', function (event) {
    var d=event.detail, entry=d && pending.get(d.id); if(!entry)return;
    if(d.status==='prompt'){clearTimeout(entry.timer);return;}
    if(d.status==='loading'){clearTimeout(entry.timer);entry.timer=setTimeout(function(){pending.delete(d.id);entry.resolve(result('unavailable'));},20000);return;}
    if(d.status==='shown'){clearTimeout(entry.timer);return;}
    clearTimeout(entry.timer);pending.delete(d.id);entry.resolve(result(d.status));
  });
  root.addEventListener('pagehide',function(){if(closePrompt)closePrompt(false);pending.forEach(function(p){clearTimeout(p.timer);p.resolve(result('cancelled'));});pending.clear();});
  function safeTarget(path) {
    try { var u=new URL(path,base);return u.protocol==='https:'&&u.origin===base.origin&&u.pathname.indexOf(base.pathname)===0&&!u.username&&!u.password?u.href:null; } catch(_){return null;}
  }
  async function placement(id,type) {
    var c=await config(), p=c.placements[id];
    if(c.enabled!==true || !p || p.enabled!==true || p.type!==type) return null;
    return p;
  }
  function promptReward(p) {
    return new Promise(function(resolve){
      var lang='en';try{lang=localStorage.getItem('lang')||'en';}catch(_){}
      if(!['en','hi','mr'].includes(lang))lang='en';
      var words={en:{badge:'A LITTLE EXTRA',title:'Unlock something special',watch:'Watch ad & unlock',cancel:'Maybe later',note:'Complete the ad to earn this reward. You can cancel and keep using the app.'},hi:{badge:'आपके लिए कुछ खास',title:'कुछ खास अनलॉक करें',watch:'विज्ञापन देखें और खोलें',cancel:'अभी नहीं',note:'रिवॉर्ड पाने के लिए विज्ञापन पूरा देखें। आप रद्द करके ऐप इस्तेमाल करते रह सकते हैं।'},mr:{badge:'तुमच्यासाठी खास',title:'काहीतरी खास उघडा',watch:'जाहिरात पाहा आणि उघडा',cancel:'आत्ता नको',note:'बक्षीस मिळवण्यासाठी जाहिरात पूर्ण पाहा. रद्द करूनही ॲप वापरता येईल.'}}[lang];
      var ui=p.ui||{};
      function localized(value,fallback){return typeof value==='string'?value:value&&typeof value[lang]==='string'?value[lang]:value&&typeof value.en==='string'?value.en:fallback;}
      function colour(value,fallback){return /^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;}
      if(!document.getElementById('temple-reward-style')){
        var style=document.createElement('style');style.id='temple-reward-style';style.textContent=`
#temple-reward-overlay{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:20px;background:rgba(25,13,35,.7);backdrop-filter:blur(7px);font-family:system-ui,sans-serif;overflow:auto;color:#301932}
#temple-reward-overlay *{box-sizing:border-box}
#temple-reward-overlay .tr-card{position:relative;width:100%;max-width:410px;max-height:90dvh;overflow:auto;border-radius:30px;background:#fffaf2;box-shadow:0 24px 90px #0006;animation:tr-enter .24s ease-out}
#temple-reward-overlay .tr-art{position:relative;overflow:hidden;padding:28px 28px 24px;background:linear-gradient(125deg,var(--tr-a),var(--tr-b));color:#fff;text-align:center}
#temple-reward-overlay .tr-art:before{content:'';position:absolute;width:220px;height:220px;border:1px solid #ffffff30;border-radius:50%;left:-90px;top:-90px;pointer-events:none}
#temple-reward-overlay .tr-icon{display:grid;place-items:center;margin:8px auto 16px;width:82px;height:82px;border-radius:26px;background:#ffffff24;border:1px solid #ffffff60;font-size:42px;box-shadow:0 9px 22px #0002}
#temple-reward-overlay .tr-badge{font-size:11px;letter-spacing:.16em;font-weight:700}
#temple-reward-overlay h2{font-size:27px;line-height:1.25;margin:10px 0 0;color:#fff}
#temple-reward-overlay .tr-body{padding:22px 26px 26px;text-align:center}
#temple-reward-overlay .tr-reward{font-size:17px;line-height:1.5;margin:0 0 18px;font-weight:600}
#temple-reward-overlay .tr-note{font-size:12px;line-height:1.6;color:#756371;margin:16px 0 0}
#temple-reward-overlay button{font:600 15px/1.4 system-ui;cursor:pointer;width:100%;min-height:48px;border-radius:16px;padding:13px 16px}
#temple-reward-overlay .tr-watch{background:linear-gradient(110deg,var(--tr-a),var(--tr-b));color:white;border:0;box-shadow:0 6px 17px #67254925}
#temple-reward-overlay .tr-cancel{background:transparent;color:#604459;border:1px solid #ddccd6;margin-top:10px}
#temple-reward-overlay button:focus-visible{outline:3px solid #158c9b;outline-offset:3px}
@keyframes tr-enter{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){#temple-reward-overlay .tr-card{animation:none}}
@media(max-height:580px){#temple-reward-overlay{align-items:flex-start}#temple-reward-overlay .tr-icon{width:54px;height:54px;font-size:30px;margin:0 auto 10px}#temple-reward-overlay .tr-art{padding:18px}}
`;document.head.appendChild(style);
      }
      var overlay=document.createElement('div');overlay.id='temple-reward-overlay';overlay.lang=lang;
      overlay.style.setProperty('--tr-a',colour(ui.accent,'#9a2364'));overlay.style.setProperty('--tr-b',colour(ui.accentEnd,'#e98238'));
      var card=document.createElement('section');card.className='tr-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','tr-heading');card.setAttribute('aria-describedby','tr-description');
      function element(tag,cls,text,parent){var e=document.createElement(tag);e.className=cls;e.textContent=text;parent.appendChild(e);return e;}
      var art=element('div','tr-art','',card);
      var icon=element('div','tr-icon',String(ui.icon||'🎁').slice(0,16),art);icon.setAttribute('aria-hidden','true');
      element('div','tr-badge',words.badge,art);
      var heading=element('h2','',localized(ui.title,words.title),art);heading.id='tr-heading';
      var body=element('div','tr-body','',card);
      var description=element('p','tr-reward',localized(ui.rewardText,String(p.reward||'Unlock content')),body);description.id='tr-description';
      var watch=element('button','tr-watch','▶  '+words.watch,body);watch.type='button';
      var cancel=element('button','tr-cancel',words.cancel,body);cancel.type='button';
      element('p','tr-note',words.note,body);overlay.appendChild(card);
      var oldFocus=document.activeElement,oldOverflow=document.body.style.overflow,done=false;
      function finish(accepted){if(done)return;done=true;closePrompt=null;document.removeEventListener('keydown',keys);document.removeEventListener('visibilitychange',visibility);overlay.remove();document.body.style.overflow=oldOverflow;if(oldFocus&&oldFocus.isConnected)oldFocus.focus();resolve(accepted);}
      function keys(e){if(e.key==='Escape'){e.preventDefault();finish(false);}if(e.key==='Tab'){e.preventDefault();(document.activeElement===watch?cancel:watch).focus();}}
      function visibility(){if(document.hidden)finish(false);}
      watch.onclick=function(){finish(true);};cancel.onclick=function(){finish(false);};overlay.onclick=function(e){if(e.target===overlay)finish(false);};
      document.body.style.overflow='hidden';document.body.appendChild(overlay);document.addEventListener('keydown',keys);document.addEventListener('visibilitychange',visibility);closePrompt=finish;cancel.focus();
    });
  }

  async function reward(id) {
    if(rewardBusy)return result('busy');
    rewardBusy=true;
    try {
      var p=await placement(id,'rewarded');if(!p)return result('disabled');
      if(!capable())return result('unsupported');
      var ttl=Math.max(0,Math.min(604800,Number(p.ttlSeconds)||0));
      if(ttl>0){var saved=await call(id,'status');if(saved.unlocked)return saved;}
      var custom=bridge().version()>=2;
      if(custom && !(await promptReward(p)))return result('cancelled');
      return await call(id,'request',{type:'rewarded',reward:String(p.reward||'Unlock content'),ttlSeconds:ttl,userConfirmed:custom});
    } catch(_){return result('unavailable');}
    finally {rewardBusy=false;}
  }
  async function open(id) {
    try {
      var p=await placement(id,'rewarded');if(!p)return result('disabled');
      var target=safeTarget(p.target);if(!target)return result('invalid_target');
      var r=await reward(id);if(r.unlocked)location.assign(target);return r;
    }catch(_){return result('unavailable');}
  }
  async function interstitial(id) {
    try {var p=await placement(id,'interstitial');return p?await call(id,'request',{type:'interstitial'}):result('disabled');}catch(_){return result('unavailable');}
  }
  function message(r) {
    var messages={unsupported:'Please install the latest temple app to watch this ad.',unavailable:'Ad is unavailable right now. Please try again later.',cooldown:'Please wait before watching another ad.',cancelled:'No reward earned. You can keep using the app.',busy:'Another action is in progress. Please try again.',disabled:'This placement is currently unavailable.',invalid_target:'This page is not configured yet.'};
    var text=messages[r.status];if(!text)return;
    if(typeof root.showCustomAdAlert==='function')root.showCustomAdAlert('Temple app',text,'fa-circle-info');else root.alert(text);
  }
  root.TempleAds={version:2,available:capable,reward:reward,open:open,interstitial:interstitial,
    status:function(id){return call(id,'status');},
    preload:async function(id){try{var c=await config(),p=c.placements[id];if(c.enabled&&p&&p.enabled&&capable())bridge().preload(p.type);}catch(_){}},
    refresh:function(){configPromise=null;return config();},message:message};
  // Only explicit marked controls trigger an ad. Never auto-show on page load.
  document.addEventListener('click',async function(e){var b=e.target.closest&&e.target.closest('[data-temple-reward]');if(!b)return;e.preventDefault();if(b.dataset.adBusy)return;b.dataset.adBusy='1';try{message(await open(b.getAttribute('data-temple-reward')));}finally{delete b.dataset.adBusy;}});
})(window);

