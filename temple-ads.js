/* Native AdMob placement API v1. Completion can only originate from Android SDK. */
(function (root) {
  'use strict';
  if (root.TempleAds) return;
  var script = document.currentScript;
  var base = new URL('.', script ? script.src : location.href);
  var pending = new Map(), sequence = 0, configPromise;
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
  root.addEventListener('pagehide',function(){pending.forEach(function(p){clearTimeout(p.timer);p.resolve(result('cancelled'));});pending.clear();});
  function safeTarget(path) {
    try { var u=new URL(path,base);return u.protocol==='https:'&&u.origin===base.origin&&u.pathname.indexOf(base.pathname)===0&&!u.username&&!u.password?u.href:null; } catch(_){return null;}
  }
  async function placement(id,type) {
    var c=await config(), p=c.placements[id];
    if(c.enabled!==true || !p || p.enabled!==true || p.type!==type) return null;
    return p;
  }
  async function reward(id) {
    try {
      var p=await placement(id,'rewarded');if(!p)return result('disabled');
      return await call(id,'request',{type:'rewarded',reward:String(p.reward||'Unlock content'),ttlSeconds:Math.max(0,Math.min(604800,Number(p.ttlSeconds)||0))});
    } catch(_){return result('unavailable');}
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
  root.TempleAds={version:1,available:capable,reward:reward,open:open,interstitial:interstitial,
    status:function(id){return call(id,'status');},
    preload:async function(id){try{var c=await config(),p=c.placements[id];if(c.enabled&&p&&p.enabled&&capable())bridge().preload(p.type);}catch(_){}},
    refresh:function(){configPromise=null;return config();},message:message};
  // Only explicit marked controls trigger an ad. Never auto-show on page load.
  document.addEventListener('click',async function(e){var b=e.target.closest&&e.target.closest('[data-temple-reward]');if(!b)return;e.preventDefault();if(b.dataset.adBusy)return;b.dataset.adBusy='1';try{message(await open(b.getAttribute('data-temple-reward')));}finally{delete b.dataset.adBusy;}});
})(window);
