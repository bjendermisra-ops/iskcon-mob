/* In-app broadcast player. No Zoom or external application is required when an approved live stream is configured. */
(function () {
  'use strict';
  var root = document.getElementById('gj-live');
  if (!root) return;
  var status = document.getElementById('gj-live-status');
  var title = document.getElementById('gj-live-title');
  var stage = document.getElementById('gj-live-stage');
  var join = document.getElementById('gj-live-play');
  var refresh = document.getElementById('gj-live-refresh');
  var lowData = document.getElementById('gj-live-audio');
  var player = null;
  var config = null;
  var busy = false;
  var labels = {
    en: {checking:'Checking live broadcast…', unavailable:'In-app broadcast is not active yet. Existing meeting links remain below.', ready:'Broadcast available. Tap Play in app to start.', playing:'Playing inside ISKCON Hadapsar.', ended:'The stream ended or could not be played. Refresh to check again.', invalid:'Broadcast link is unavailable. Please try the meeting links below.', play:'▶ Play in app', audio:'🎧 Low-data audio', refresh:'↻ Refresh status'},
    hi: {checking:'लाइव प्रसारण जाँचा जा रहा है…', unavailable:'अभी ऐप में लाइव प्रसारण उपलब्ध नहीं है। नीचे मौजूदा मीटिंग लिंक हैं।', ready:'प्रसारण उपलब्ध है। ऐप में सुनने के लिए Play दबाएँ।', playing:'ISKCON Hadapsar ऐप में प्रसारण चल रहा है।', ended:'प्रसारण समाप्त हुआ या चल नहीं पाया। फिर जाँचें।', invalid:'प्रसारण लिंक उपलब्ध नहीं है। नीचे के मीटिंग लिंक आज़माएँ।', play:'▶ ऐप में चलाएँ', audio:'🎧 कम डेटा ऑडियो', refresh:'↻ फिर जाँचें'},
    mr: {checking:'थेट प्रसारण तपासत आहे…', unavailable:'सध्या ॲपमध्ये थेट प्रसारण उपलब्ध नाही. खाली विद्यमान मीटिंग लिंक आहेत.', ready:'प्रसारण उपलब्ध आहे. ॲपमध्ये ऐकण्यासाठी Play दाबा.', playing:'ISKCON Hadapsar ॲपमध्ये प्रसारण सुरू आहे.', ended:'प्रसारण संपले किंवा सुरू झाले नाही. पुन्हा तपासा.', invalid:'प्रसारण लिंक उपलब्ध नाही. खालील मीटिंग लिंक वापरा.', play:'▶ ॲपमध्ये प्ले', audio:'🎧 कमी डेटा ऑडिओ', refresh:'↻ पुन्हा तपासा'}
  };
  function words() { var lang = document.documentElement.lang; return labels[lang] || labels.hi; }
  function message(value) { status.textContent = value; }
  function httpsUrl(value) {
    if (typeof value !== 'string' || !value || value.length > 2048) return null;
    try {
      var u = new URL(value);
      if (u.protocol !== 'https:' || !u.hostname || u.username || u.password || /[\\\x00-\x1f]/.test(value)) return null;
      if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[::1\])/i.test(u.hostname)) return null;
      return u.href;
    } catch (_) { return null; }
  }
  function validConfig(data) {
    if (!data || data.enabled !== true || !httpsUrl(data.streamUrl)) return false;
    if (data.mediaType !== 'audio' && data.mediaType !== 'video') return false;
    var until = Date.parse(data.expiresAt || '');
    return Number.isFinite(until) && until > Date.now();
  }
  function clearPlayer() {
    if (player) { player.pause(); player.removeAttribute('src'); player.load(); player.remove(); player = null; }
    stage.textContent = '';
  }
  function resetLabels() {
    join.textContent = words().play;
    lowData.textContent = words().audio;
    refresh.textContent = words().refresh;
    if (config && validConfig(config)) { if (!player || player.paused) message(words().ready); }
    else message(words().unavailable);
  }
  function playerFor(url, kind) {
    var media = document.createElement(kind === 'audio' ? 'audio' : 'video');
    media.controls = true;
    media.preload = 'none';
    media.playsInline = true;
    media.setAttribute('aria-label', 'Global Japa live broadcast');
    media.style.width = '100%';
    media.style.maxHeight = '330px';
    media.style.display = 'block';
    media.src = url;
    media.addEventListener('playing', function () { message(words().playing); });
    media.addEventListener('error', function () { message(words().ended); });
    media.addEventListener('ended', function () { message(words().ended); });
    return media;
  }
  function play(kind) {
    if (!config || !validConfig(config)) { message(words().invalid); return; }
    var url = kind === 'audio' ? httpsUrl(config.audioFallbackUrl) : httpsUrl(config.streamUrl);
    if (!url) { message(words().invalid); return; }
    clearPlayer();
    player = playerFor(url, kind === 'audio' ? 'audio' : config.mediaType);
    stage.appendChild(player);
    var playback = player.play();
    if (playback && typeof playback.catch === 'function') playback.catch(function () { message(words().ended); });
  }
  async function reload() {
    if (busy) return;
    busy = true;
    refresh.disabled = true;
    if (!player) message(words().checking);
    try {
      var timeout = typeof AbortController === 'function' ? new AbortController() : null;
      var stop = timeout ? setTimeout(function () { timeout.abort(); }, 12000) : null;
      var response;
      try {
        response = await fetch('global-japa-live.json?check=' + Date.now(), {cache:'no-store',credentials:'omit',signal:timeout ? timeout.signal : undefined});
      } finally { if (stop) clearTimeout(stop); }
      if (!response.ok) throw new Error('Server status ' + response.status);
      var incoming = await response.json();
      var active = validConfig(incoming);
      var changed = JSON.stringify(config) !== JSON.stringify(incoming);
      config = incoming;
      if ((changed || !active) && player) clearPlayer();
      join.hidden = !active;
      lowData.hidden = !active || !httpsUrl(config.audioFallbackUrl);
      title.textContent = typeof config.title === 'string' ? config.title.slice(0, 100) : 'Global Japa';
      if (!player) message(active ? words().ready : words().unavailable);
      root.dataset.live = active ? 'available' : 'offline';
    } catch (_) {
      if (!player) message(words().unavailable);
      join.hidden = true;
      lowData.hidden = true;
      root.dataset.live = 'offline';
    } finally { busy = false; refresh.disabled = false; }
  }
  join.addEventListener('click', function () { play('main'); });
  lowData.addEventListener('click', function () { play('audio'); });
  refresh.addEventListener('click', reload);
  document.querySelectorAll('.lang-btn').forEach(function (button) { button.addEventListener('click', function () { setTimeout(resetLabels, 0); }); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) reload(); });
  setInterval(function () { if (!document.hidden) reload(); }, 120000);
  resetLabels();
  reload();
})();
