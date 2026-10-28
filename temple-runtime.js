/* Shared connection and APK-version contract. No external dependencies. */
(function (root) {
  'use strict';
  function updateFor(manifest, installed) {
    if (!manifest || !Number.isSafeInteger(manifest.latestVersionCode) ||
        manifest.latestVersionCode <= 0 || !Number.isSafeInteger(installed) || installed <= 0 ||
        manifest.latestVersionCode <= installed) return null;
    try {
      var url = new URL(manifest.updateUrl);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
    } catch (_) { return null; }
    return { code: manifest.latestVersionCode, url: url.href,
      force: manifest.forceUpdate === true,
      title: String(manifest.title || 'Update available'),
      message: String(manifest.message || 'Please install the latest app version.') };
  }
  function linkTarget(input, base) {
    if (typeof input !== 'string' || !input.trim()) return null;
    var value = input.trim();
    if (/[\\\x00-\x1f]/.test(value)) return null;
    if (/^intent:/i.test(value)) {
      var fallback = value.match(/;S\.browser_fallback_url=([^;]+)/);
      if (!fallback) return null;
      try { value = decodeURIComponent(fallback[1]); } catch (_) { return null; }
    }
    try {
      var url = new URL(value, base);
      if (!/^(https?:|mailto:|tel:|geo:|market:|upi:|whatsapp:|phonepe:|paytmmp:|paytm:|gpay:|tez:|bhim:)$/.test(url.protocol) || url.username || url.password) return null;
      var site = new URL('.', base);
      return { url: url.href, internal: url.protocol === 'https:' && url.origin === site.origin &&
        (url.pathname === site.pathname.slice(0,-1) || url.pathname.indexOf(site.pathname) === 0) };
    } catch (_) { return null; }
  }
  if (typeof module === 'object' && module.exports) { module.exports = { updateFor: updateFor, linkTarget: linkTarget }; return; }
  if (root.TempleRuntime) return;
  var script = document.currentScript;
  var endpoint = new URL('version.json', script ? script.src : location.href);
  var bridge = root.AndroidBridge || root.AndroidInterface || root.Android;
  var busy = false, lastCheck = 0, banner, dialog;
  root.TempleRuntime = { check: check, updateFor: updateFor, openLink: openLink };
  function openLink(input) {
    var target = linkTarget(input, endpoint.href);
    if (!target) return false;
    if (!target.internal) {
      // Existing v12 already exposes openExternal. Use it instead of navigating WebView.
      try {
        var current = root.AndroidBridge || root.AndroidInterface || root.Android;
        if (current && typeof current.openExternal === 'function' &&
            (/^(https?:|mailto:|tel:)/.test(target.url) ||
             (typeof current.getBridgeVersion === 'function' && current.getBridgeVersion() >= 2))) {
          current.openExternal(target.url); return true;
        }
      } catch (_) {}
    }
    location.href = target.url; return true;
  }
  function button(label, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.onclick = fn; return b;
  }
  function showStatus(text) {
    banner.textContent = text; banner.hidden = !text;
  }
  function nativeOffline() {
    try { return bridge && typeof bridge.isInternetValidated === 'function' && !bridge.isInternetValidated(); }
    catch (_) { return false; }
  }
  function offer(update) {
    if (dialog) return;
    try { if (!update.force && sessionStorage.getItem('temple-deferred') === String(update.code)) return; } catch (_) {}
    dialog = document.createElement('section'); dialog.id = 'temple-update';
    dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'temple-update-title');
    var card = document.createElement('div'); card.className = 'temple-update-card';
    var title = document.createElement('h2'); title.id = 'temple-update-title'; title.textContent = update.title;
    var text = document.createElement('p'); text.textContent = update.message;
    var version = document.createElement('p'); version.textContent = 'New app version: ' + update.code;
    card.append(title, text, version);
    var install = button('Update now / अपडेट करें', function () { openLink(update.url); });
    card.appendChild(install);
    if (!update.force) card.appendChild(button('Later / बाद में', function () {
      try { sessionStorage.setItem('temple-deferred', String(update.code)); } catch (_) {}
      dialog.remove(); dialog = null;
    }));
    dialog.appendChild(card); document.body.appendChild(dialog); install.focus();
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var buttons = card.querySelectorAll('button');
      if (event.shiftKey && document.activeElement === buttons[0]) {
        event.preventDefault(); buttons[buttons.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
        event.preventDefault(); buttons[0].focus();
      }
    });
  }
  async function check(force) {
    if (!banner || busy || document.hidden || (!force && Date.now() - lastCheck < 30000)) return;
    if (!navigator.onLine) { showStatus('No internet connection · इंटरनेट कनेक्शन जाँचें'); return; }
    busy = true; lastCheck = Date.now();
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var url = new URL(endpoint.href); url.searchParams.set('_check', String(Date.now()));
      var response = await fetch(url.href, { cache: 'no-store', signal: controller.signal, credentials: 'omit' });
      if (!response.ok) { showStatus('Update service unavailable. Your current page is still open.'); return; }
      var data = await response.json();
      showStatus('');
      var installed = 0;
      try { if (bridge && typeof bridge.getAppVersionCode === 'function') installed = Number(bridge.getAppVersionCode()); } catch (_) {}
      var update = updateFor(data, installed); if (update) offer(update);
    } catch (_) {
      showStatus(!navigator.onLine || nativeOffline()
        ? 'No working internet connection · Wi-Fi / mobile data जाँचें'
        : 'Temple service could not be reached. Check your connection and try again.');
    } finally { clearTimeout(timer); busy = false; }
  }
  function init() {
    document.documentElement.classList.add('temple-runtime');
    var css = document.createElement('style');
    css.textContent = '.temple-runtime .offline-banner{display:none!important}' +
      '#temple-connection{position:fixed;bottom:12px;left:12px;right:12px;z-index:100000;background:#402515;color:#fff;padding:12px 16px;border-radius:12px;font:14px/1.5 sans-serif;box-shadow:0 4px 18px #0003;cursor:pointer}' +
      '#temple-connection[hidden]{display:none}' +
      '#temple-update{position:fixed;inset:0;z-index:2147483647;background:#fff8ee;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;color:#402515;font:16px/1.6 sans-serif}' +
      '.temple-update-card{width:100%;max-width:440px;padding:24px;background:#fff;border-radius:24px;box-shadow:0 12px 50px #66331420}' +
      '.temple-update-card button{display:block;width:100%;padding:14px;margin-top:14px;border:0;border-radius:12px;background:#d85b0b;color:white;font:600 16px sans-serif;cursor:pointer}' +
      '.temple-update-card button+button{background:#f5e5d7;color:#663314}';
    document.head.appendChild(css);
    banner = document.createElement('button'); banner.id = 'temple-connection'; banner.type = 'button';
    banner.hidden = true; banner.setAttribute('aria-live', 'polite'); banner.onclick = function () { check(true); };
    document.body.appendChild(banner);
    document.addEventListener('click', function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!anchor || event.defaultPrevented || anchor.hasAttribute('download')) return;
      var target = linkTarget(anchor.getAttribute('href'), endpoint.href);
      if (!target) return;
      if (!target.internal) {
        event.preventDefault(); event.stopPropagation(); openLink(target.url);
      } else if (anchor.target === '_blank') { anchor.target = '_self'; }
    }, true);
    var originalOpen = root.open;
    if (typeof originalOpen === 'function') root.open = function (url, target, features) {
      var destination = linkTarget(url, endpoint.href);
      if (destination && !destination.internal && bridge) { openLink(destination.url); return null; }
      return originalOpen.call(root,url,target,features);
    };
    root.addEventListener('online', function () { check(true); });
    root.addEventListener('offline', function () { showStatus('No internet connection · इंटरनेट कनेक्शन जाँचें'); });
    root.addEventListener('temple-network', function () { check(true); });
    root.addEventListener('pageshow', function () { check(false); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(false); });
    setInterval(function () { check(false); }, 60000);
    check(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(typeof window === 'undefined' ? globalThis : window);
