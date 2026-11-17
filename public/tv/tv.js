/*
 * The workout on any smart TV (owner, 2026-11-16).
 *
 * The TV opens peilimplus.co.il/tv in its own browser (LG webOS, Samsung
 * Tizen, any other), shows a 4-digit code, and the trainee types it once in the
 * app's workout player ("טלוויזיה עם קוד"). The page keeps a device token so
 * later workouts connect with one tap; the phone then sends the clip queue
 * (landscape variants) and acts as the remote, and the page reports where it is
 * so the phone keeps the exercise countdown.
 *
 * Deliberately ES5 with no libraries and no build: TV browsers are years old
 * (webOS 3 is Chrome 38). No const/let, arrow functions, template strings,
 * Promise, fetch, classList-only features or flex gaps. Realtime is spoken by
 * hand: Supabase Realtime is Phoenix v1 JSON over one WebSocket.
 *
 * The protocol (frames and messages) is shared with the apps:
 * FitnessForSeniorsApp shared/tv-link/protocol.fixtures.json, copied byte for
 * byte to tests/fixtures/tv-link-protocol.fixtures.json and run in
 * tests/unit/tv-link-protocol.test.ts.
 */
(function (root) {
  'use strict';

  // MARK: - Protocol (pure; the same cases run on both apps)

  var EVENT = 'tv';

  function realtimeTopic(topic) {
    return 'realtime:' + topic;
  }

  function joinFrame(topic, accessToken, ref) {
    return {
      topic: realtimeTopic(topic),
      event: 'phx_join',
      payload: {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: '' },
          postgres_changes: [],
          'private': true
        },
        access_token: accessToken
      },
      ref: ref,
      join_ref: ref
    };
  }

  function heartbeatFrame(ref) {
    return { topic: 'phoenix', event: 'heartbeat', payload: {}, ref: ref };
  }

  function broadcastFrame(topic, message, ref, joinRef) {
    return {
      topic: realtimeTopic(topic),
      event: 'broadcast',
      payload: { type: 'broadcast', event: EVENT, payload: message },
      ref: ref,
      join_ref: joinRef
    };
  }

  /** What one incoming frame means to us: joined, refused, closed, message or none. */
  function parseFrame(frame, topic, joinRef) {
    if (!frame || frame.topic !== realtimeTopic(topic)) return { kind: 'none' };
    var payload = frame.payload || {};
    if (frame.event === 'phx_reply') {
      if (frame.ref !== joinRef) return { kind: 'none' };
      return payload.status === 'ok' ? { kind: 'joined' } : { kind: 'refused' };
    }
    if (frame.event === 'phx_close' || frame.event === 'phx_error') return { kind: 'closed' };
    if (frame.event === 'system') {
      return payload.status === 'error' ? { kind: 'closed' } : { kind: 'none' };
    }
    if (frame.event === 'broadcast' && payload.event === EVENT &&
        payload.payload && typeof payload.payload.t === 'string') {
      return { kind: 'message', message: payload.payload };
    }
    return { kind: 'none' };
  }

  /** The code the trainee typed, or null: exactly four digits once spaces and dashes go. */
  function normalizeCode(input) {
    var digits = String(input == null ? '' : input).replace(/[\s-]/g, '');
    return /^[0-9]{4}$/.test(digits) ? digits : null;
  }

  function websocketUrl(supabaseUrl, anonKey) {
    var base = String(supabaseUrl).replace(/\/+$/, '').replace(/^http/, 'ws');
    return base + '/realtime/v1/websocket?apikey=' + encodeURIComponent(anonKey) + '&vsn=1.0.0';
  }

  var protocol = {
    joinFrame: joinFrame,
    heartbeatFrame: heartbeatFrame,
    broadcastFrame: broadcastFrame,
    parseFrame: parseFrame,
    normalizeCode: normalizeCode,
    websocketUrl: websocketUrl
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = protocol;
    return;
  }
  root.TvLink = protocol;

  // MARK: - Page

  var config = root.TV_CONFIG || {};
  var TOKEN_KEY = 'activeplus_tv_token';
  var POLL_WAITING_MS = 3000;
  var HEARTBEAT_MS = 25000;
  var STATE_EVERY_MS = 1000;
  var RECONNECT_MS = 4000;
  var DONE_SCREEN_MS = 20000;
  var PAIRED_RECHECK_MS = 5 * 60 * 1000;
  // Paused or not, the phone hears from the TV this often; its silence means
  // the page was closed, and the phone takes the workout back.
  var STATE_KEEPALIVE_MS = 4000;

  var doc = root.document;
  function el(id) { return doc.getElementById(id); }

  function show(screenId) {
    var screens = ['screen-code', 'screen-paired', 'screen-play', 'screen-done', 'screen-error'];
    for (var i = 0; i < screens.length; i++) {
      el(screens[i]).style.display = screens[i] === screenId ? 'block' : 'none';
    }
  }

  function storageGet(key) {
    try { return root.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try {
      if (value == null) root.localStorage.removeItem(key); else root.localStorage.setItem(key, value);
    } catch (e) { /* private mode: the TV pairs again next time */ }
  }

  function rpc(fn, body, onDone) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', String(config.supabaseUrl).replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', config.anonKey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + config.anonKey);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var data = null;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch (e) { data = null; }
      onDone(xhr.status >= 200 && xhr.status < 300 ? null : (xhr.status || 'network'), data);
    };
    xhr.send(JSON.stringify(body || {}));
  }

  // MARK: - Pairing

  var token = storageGet(TOKEN_KEY);
  var pollTimer = null;
  var pairedTopic = null;

  function schedulePoll(ms) {
    if (pollTimer) root.clearTimeout(pollTimer);
    pollTimer = root.setTimeout(checkSession, ms);
  }

  function showError() {
    show('screen-error');
    schedulePoll(RECONNECT_MS * 2);
  }

  function requestCode() {
    rpc('tv_request_code', { p_device_token: token }, function (err, data) {
      if (err || !data || !data.ok) { showError(); return; }
      token = data.device_token;
      storageSet(TOKEN_KEY, token);
      showCode(data.code);
      schedulePoll(POLL_WAITING_MS);
    });
  }

  function showCode(code) {
    var digits = el('code-digits');
    digits.innerHTML = '';
    for (var i = 0; i < code.length; i++) {
      var span = doc.createElement('span');
      span.className = 'digit';
      span.appendChild(doc.createTextNode(code.charAt(i)));
      digits.appendChild(span);
    }
    show('screen-code');
  }

  function checkSession() {
    if (!token) { requestCode(); return; }
    rpc('tv_session', { p_device_token: token }, function (err, data) {
      if (err || !data) { showError(); return; }
      if (data.status === 'unknown') {
        token = null;
        storageSet(TOKEN_KEY, null);
        disconnect();
        requestCode();
      } else if (data.status === 'waiting') {
        if (data.code) { showCode(data.code); schedulePoll(POLL_WAITING_MS); } else { requestCode(); }
      } else if (data.status === 'paired') {
        el('paired-name').innerHTML = '';
        el('paired-name').appendChild(doc.createTextNode(data.first_name ? 'שלום ' + data.first_name : 'שלום'));
        if (!playing.active) show('screen-paired');
        // Now and then, so a TV unpaired from the phone goes back to its code.
        schedulePoll(PAIRED_RECHECK_MS);
        if (pairedTopic !== data.topic) {
          pairedTopic = data.topic;
          connect();
        }
      }
    });
  }

  function forgetPairing() {
    var old = token;
    disconnect();
    pairedTopic = null;
    token = null;
    storageSet(TOKEN_KEY, null);
    if (old) rpc('tv_forget', { p_device_token: old }, function () { requestCode(); });
    else requestCode();
  }

  // MARK: - Realtime

  var socket = null;
  var refCounter = 0;
  var joinRef = null;
  var joined = false;
  var heartbeatTimer = null;
  var reconnectTimer = null;

  function nextRef() { refCounter += 1; return String(refCounter); }

  function sendFrame(frame) {
    if (socket && socket.readyState === 1) socket.send(JSON.stringify(frame));
  }

  function sendMessage(message) {
    if (joined) sendFrame(broadcastFrame(pairedTopic, message, nextRef(), joinRef));
  }

  function connect() {
    disconnect();
    if (!pairedTopic) return;
    try {
      socket = new root.WebSocket(websocketUrl(config.supabaseUrl, config.anonKey));
    } catch (e) {
      scheduleReconnect();
      return;
    }
    socket.onopen = function () {
      joinRef = nextRef();
      sendFrame(joinFrame(pairedTopic, config.anonKey, joinRef));
      heartbeatTimer = root.setInterval(function () { sendFrame(heartbeatFrame(nextRef())); }, HEARTBEAT_MS);
    };
    socket.onmessage = function (event) {
      var frame = null;
      try { frame = JSON.parse(event.data); } catch (e) { return; }
      var result = parseFrame(frame, pairedTopic, joinRef);
      if (result.kind === 'joined') {
        joined = true;
        sendMessage(playing.active ? stateMessage() : { t: 'ready' });
      } else if (result.kind === 'refused' || result.kind === 'closed') {
        // A refused join is a pairing that was undone: ask the server.
        scheduleReconnect();
      } else if (result.kind === 'message') {
        handleMessage(result.message);
      }
    };
    socket.onclose = function () { scheduleReconnect(); };
    socket.onerror = function () { /* onclose follows */ };
  }

  function disconnect() {
    joined = false;
    if (heartbeatTimer) { root.clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (reconnectTimer) { root.clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (socket) {
      socket.onclose = null;
      socket.onmessage = null;
      try { socket.close(); } catch (e) { /* already closed */ }
      socket = null;
    }
  }

  function scheduleReconnect() {
    disconnect();
    reconnectTimer = root.setTimeout(function () {
      reconnectTimer = null;
      pairedTopic = null;
      checkSession();
    }, RECONNECT_MS);
  }

  // MARK: - Playback

  var video = null;
  var playing = { active: false, clips: [], index: 0, pendingPos: 0, lastStateAt: 0 };

  function handleMessage(message) {
    switch (message.t) {
      case 'hello':
        sendMessage(playing.active ? stateMessage() : { t: 'ready' });
        break;
      case 'load':
        load(message.clips || [], message.index || 0, message.pos || 0, message.play !== false);
        break;
      case 'play':
        if (playing.active) playVideo();
        break;
      case 'pause':
        if (playing.active) { video.pause(); sendState(); }
        break;
      case 'seek':
        if (playing.active) startClip(message.index || 0, 0, true);
        break;
      case 'stop':
        stop(false);
        break;
      default:
        break;
    }
  }

  function load(clips, index, pos, play) {
    if (!clips.length) return;
    playing.active = true;
    playing.clips = clips;
    show('screen-play');
    startClip(index, pos, play);
  }

  function startClip(index, pos, play) {
    var i = Math.max(0, Math.min(index, playing.clips.length - 1));
    playing.index = i;
    playing.pendingPos = pos || 0;
    var clip = playing.clips[i];
    el('play-title').innerHTML = '';
    el('play-title').appendChild(doc.createTextNode(clip.title || ''));
    el('play-count').innerHTML = '';
    el('play-count').appendChild(doc.createTextNode('תרגיל ' + (i + 1) + ' מתוך ' + playing.clips.length));
    video.src = clip.url;
    video.load();
    if (play) playVideo(); else sendState();
  }

  function playVideo() {
    var result;
    try { result = video.play(); } catch (e) { result = null; }
    // Newer TV browsers refuse sound before a key press: play silently and ask for OK.
    if (result && typeof result.then === 'function') {
      result.then(null, function () {
        video.muted = true;
        el('sound-hint').style.display = 'block';
        try { video.play(); } catch (e) { /* nothing more to try */ }
      });
    }
  }

  function unmute() {
    if (!video.muted) return;
    video.muted = false;
    el('sound-hint').style.display = 'none';
  }

  function stateMessage() {
    var dur = video && isFinite(video.duration) ? video.duration : 0;
    return {
      t: 'state',
      index: playing.index,
      pos: video ? Math.round(video.currentTime * 100) / 100 : 0,
      dur: Math.round(dur * 100) / 100,
      playing: !!(video && !video.paused && !video.ended),
      ended: false
    };
  }

  function sendState() {
    playing.lastStateAt = new Date().getTime();
    el('paused-badge').style.display = video && video.paused && playing.active ? 'block' : 'none';
    sendMessage(stateMessage());
  }

  function stop(finished) {
    playing.active = false;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      try { video.load(); } catch (e) { /* nothing loaded */ }
    }
    el('sound-hint').style.display = 'none';
    if (finished) {
      show('screen-done');
      root.setTimeout(function () { if (!playing.active) show('screen-paired'); }, DONE_SCREEN_MS);
    } else {
      show('screen-paired');
    }
  }

  function wireVideo() {
    video = el('video');
    video.addEventListener('loadedmetadata', function () {
      if (playing.pendingPos > 0) {
        try { video.currentTime = playing.pendingPos; } catch (e) { /* start of clip */ }
        playing.pendingPos = 0;
      }
      sendState();
    });
    video.addEventListener('play', sendState);
    video.addEventListener('pause', function () { if (!video.ended) sendState(); });
    video.addEventListener('timeupdate', function () {
      if (new Date().getTime() - playing.lastStateAt >= STATE_EVERY_MS) sendState();
    });
    video.addEventListener('ended', function () {
      if (playing.index < playing.clips.length - 1) {
        startClip(playing.index + 1, 0, true);
      } else {
        var last = stateMessage();
        last.ended = true;
        last.playing = false;
        sendMessage(last);
        stop(true);
      }
    });
    // A clip that will not play is skipped, as the apps do.
    video.addEventListener('error', function () {
      if (!playing.active) return;
      if (playing.index < playing.clips.length - 1) startClip(playing.index + 1, 0, true);
    });
  }

  function wireKeys() {
    doc.addEventListener('keydown', function (event) {
      unmute();
      var key = event.keyCode;
      // OK / Enter on the forget button; any key also unlocks the sound.
      if ((key === 13 || key === 32) && doc.activeElement === el('forget')) forgetPairing();
    });
    doc.addEventListener('click', unmute);
    el('forget').addEventListener('click', forgetPairing);
  }

  function start() {
    if (!config.supabaseUrl || !config.anonKey) { show('screen-error'); return; }
    wireVideo();
    wireKeys();
    root.setInterval(function () { if (playing.active) sendState(); }, STATE_KEEPALIVE_MS);
    checkSession();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : this);
