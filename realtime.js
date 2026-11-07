/*
 * Instant chat updates using Supabase Realtime "broadcast" (no table access needed).
 * A broadcast is only a nudge ("something changed, reload"); all real data still
 * goes through the secure database functions. If Realtime is unavailable the pages
 * keep working through their normal polling.
 */
(function () {
  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  var listeners = { message: [] };
  var remoteTyping = {};
  var channel = null, connecting = null;

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = SDK; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function connect() {
    if (channel) return Promise.resolve(channel);
    if (connecting) return connecting;
    connecting = loadSdk().then(function () {
      var client = window.supabase.createClient(window.HC.url, window.HC.anonKey, { auth: { persistSession: false } });
      var ch = client.channel('hashclass-chat', { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'message' }, function () {
        listeners.message.forEach(function (fn) { try { fn(); } catch (e) {} });
      });
      ch.on('broadcast', { event: 'typing' }, function (msg) {
        var p = (msg && msg.payload) || {};
        if (!p.userId) return;
        if (p.isTyping) remoteTyping[p.userId] = Date.now(); else delete remoteTyping[p.userId];
      });
      ch.subscribe();
      channel = ch;
      return ch;
    }).catch(function () { connecting = null; return null; });
    return connecting;
  }

  window.chatRealtime = {
    // fn is called whenever somebody sends a message
    onMessage: function (fn) {
      listeners.message.push(fn);
      connect();
      return function () { listeners.message = listeners.message.filter(function (f) { return f !== fn; }); };
    },
    notifyMessage: function () {
      connect().then(function (ch) { if (ch) ch.send({ type: 'broadcast', event: 'message', payload: {} }); });
    },
    sendTyping: function (userId, isTyping) {
      connect().then(function (ch) {
        if (ch) ch.send({ type: 'broadcast', event: 'typing', payload: { userId: userId, isTyping: !!isTyping } });
      });
    },
    typingUsers: function (exceptUserId) {
      var now = Date.now(), out = [];
      Object.keys(remoteTyping).forEach(function (id) {
        if (id !== exceptUserId && now - remoteTyping[id] < 5000) out.push(id);
      });
      return out;
    },
    isConnected: function () { return !!channel; }
  };
})();
