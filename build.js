/*
 * Build: turns the editable source (JSX in <script type="text/babel">) into plain,
 * minified JavaScript so pages load fast (no in-browser Babel). Output goes to ./dist
 *
 *   node build.js        (needs Node 18+ and:  npm i esbuild)
 *
 * Upload the CONTENTS of ./dist to your web host.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let esbuild;
try { esbuild = require('esbuild'); }
catch (e) { esbuild = require('/opt/npm-tools/node_modules/esbuild'); }

const SRC = __dirname;
const OUT = path.join(SRC, 'dist');

const REACT = 'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js';
const REACT_DOM = 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js';
const LUCIDE = 'https://cdn.jsdelivr.net/npm/lucide-static@0.516.0/font/lucide.css';

// old Trickle-hosted images -> files you place in ./assets
const ASSETS = {
  '8bc308c7-6235-4d78-a090-8bd032e869f0.png': 'assets/logo.png',
  'ff96661b-0b33-45d8-9670-a9e8d7ca2e11.png': 'assets/favicon.png',
  '91a05dbc-39e4-4cd6-8fbb-ec60cf3f1a5c.png': 'assets/crdb.png',
  'acaeced0-5df0-40e1-950d-789fc68ea53d.jpeg': 'assets/founder.jpg',
  '1000816181.jpg': 'assets/share.jpg'
};

function swapAssets(text) {
  return text.replace(/https:\/\/app\.trickle\.so\/storage\/[^"'`\s)]*?([0-9a-f-]{36}\.(?:png|jpeg)|1000816181\.jpg)/g, (url, file) => {
    const local = ASSETS[file];
    return local && fs.existsSync(path.join(SRC, local)) ? local : url;
  });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });

// static files
for (const f of ['sitemap.xml', 'theme.css']) if (fs.existsSync(path.join(SRC, f))) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
if (fs.existsSync(path.join(SRC, 'assets'))) fs.cpSync(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });
// files that must be served from /.well-known (e.g. assetlinks.json for the Android app)
if (fs.existsSync(path.join(SRC, '.well-known'))) fs.cpSync(path.join(SRC, '.well-known'), path.join(OUT, '.well-known'), { recursive: true });
// installable app (PWA): manifest, service worker and icons
if (fs.existsSync(path.join(SRC, 'pwa'))) {
  fs.cpSync(path.join(SRC, 'pwa'), path.join(OUT, 'pwa'), { recursive: true });
  fs.copyFileSync(path.join(SRC, 'pwa', 'sw.js'), path.join(OUT, 'sw.js'));                       // root scope
  fs.copyFileSync(path.join(SRC, 'pwa', 'manifest.webmanifest'), path.join(OUT, 'manifest.webmanifest'));
}
const SPLASH_CSS = '<style id="hc-splash-css">\nhtml.hc-nosplash #hc-splash{display:none}\n#hc-splash{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:#1230B5 url(/assets/splash.jpg) center 38%/cover no-repeat}\n#hc-splash:before{content:"";position:absolute;inset:0;background:rgba(18,48,181,.8)}\n#hc-splash.hc-out{display:none}\n#hc-splash>*{position:relative}\n#hc-splash img{width:112px;height:auto;filter:drop-shadow(0 6px 16px rgba(0,0,0,.4))}\n#hc-splash b{margin-top:10px;font:800 30px/1.1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;letter-spacing:-.5px}\n#hc-splash em{font-style:normal;color:#F5B400}\n#hc-splash span{margin-top:4px;font:italic 600 14px system-ui,sans-serif;color:#FFD24A}\n#hc-splash i{margin-top:26px;width:120px;height:4px;border-radius:4px;background:rgba(255,255,255,.25);overflow:hidden}\n#hc-splash i:after{content:"";display:block;width:40%;height:100%;border-radius:4px;background:#F5B400;animation:hcsp 1s ease-in-out infinite}\n@keyframes hcsp{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}\n</style>\n<script>try{if(!sessionStorage.getItem("hc_alive")){sessionStorage.setItem("hc_alive","1");localStorage.removeItem("currentUser");localStorage.removeItem("hc_session")}}catch(e){}try{if(sessionStorage.getItem("hc_splash")==="1")document.documentElement.classList.add("hc-nosplash")}catch(e){}</script>';
const SPLASH_HTML = '<div id="hc-splash" aria-hidden="true"><img src="/assets/logo.png" alt=""><b>Hash<em>CLASS</em></b><span>The Golden Minds</span><i></i></div>\n<script>(function(){var s=document.getElementById("hc-splash");if(!s)return;var m=document.querySelector(\'meta[name="theme-color"]\'),old=m&&m.content;if(m&&!document.documentElement.classList.contains("hc-nosplash"))m.content="#1230B5";var t0=Date.now(),done=false,ready=false;function fin(){if(done)return;done=true;try{sessionStorage.setItem("hc_splash","1")}catch(e){}if(m&&old)m.content=old;s.remove()}function hide(){ready=true;var w=5000-(Date.now()-t0);if(w<=0)fin();else setTimeout(fin,w)}setTimeout(fin,15000);function init(){var r=document.getElementById("root");if(!r)return;if(r.children.length)return hide();new MutationObserver(function(x,o){if(r.children.length){o.disconnect();hide()}}).observe(r,{childList:true})}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init()})();</script>';
const PWA_TAGS = '<link rel="manifest" href="/manifest.webmanifest">\n    <meta name="theme-color" content="#1230B5">\n' +
  '    <meta name="mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '    <meta name="apple-mobile-web-app-title" content="HashCLASS">\n    <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png">\n' +
  '    <script>if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})})</script>\n';
for (const f of ['supabase-client.js', 'realtime.js']) {
  const code = esbuild.transformSync(fs.readFileSync(path.join(SRC, f), 'utf8'), { minify: true, target: 'es2018' }).code;
  fs.writeFileSync(path.join(OUT, f), code);
}

let problems = 0;
for (const page of fs.readdirSync(SRC).filter(f => f.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(SRC, page), 'utf8');
  const babelRe = /^[ \t]*<script type="text\/babel" src="([^"]+)"><\/script>[ \t]*\r?\n?/gm;
  const files = [];
  let first = -1;
  html = html.replace(babelRe, (m, src, offset) => {
    files.push(src);
    if (first < 0) { first = offset; return '\u0000BUNDLE\u0000'; }
    return '';
  });

  if (files.length) {
    let combined = '';
    for (const f of files) {
      const code = fs.readFileSync(path.join(SRC, f), 'utf8');
      combined += '\n;/* ' + f + ' */\n' + swapAssets(code) + '\n';
    }
    try {
      const out = esbuild.transformSync(combined, {
        loader: 'jsx', jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
        minify: true, target: 'es2018', legalComments: 'none'
      }).code;
      const name = 'js/' + page.replace('.html', '') + '.' + crypto.createHash('md5').update(out).digest('hex').slice(0, 8) + '.js';
      fs.writeFileSync(path.join(OUT, name), out);
      html = html.replace('\u0000BUNDLE\u0000', '    <script src="' + name + '"></script>\n');
    } catch (e) {
      problems++;
      console.error('BUILD ERROR in ' + page + ':\n' + e.message);
    }
  }

  html = html
    .replace(/^[ \t]*<script src="https:\/\/resource\.trickle\.so\/vendor_lib\/unpkg\/@babel\/standalone\/babel\.min\.js"><\/script>\r?\n/gm, '')
    .replace(/https:\/\/resource\.trickle\.so\/vendor_lib\/unpkg\/react@18\/umd\/react\.production\.min\.js/g, REACT)
    .replace(/https:\/\/resource\.trickle\.so\/vendor_lib\/unpkg\/react-dom@18\/umd\/react-dom\.production\.min\.js/g, REACT_DOM)
    .replace(/https:\/\/resource\.trickle\.so\/vendor_lib\/unpkg\/lucide-static@0\.516\.0\/font\/lucide\.css/g, LUCIDE);
  html = swapAssets(html);
  if (!/rel="manifest"/.test(html)) {
    const hints = ['https://cdn.tailwindcss.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com', 'https://yyadebqnrapcvamxfnsn.supabase.co']
      .map(h => '    <link rel="preconnect" href="' + h + '" crossorigin>\n').join('');
    // splash + hints first so the page paints instantly; manifest/service worker at the end
    html = html.replace(/<head>/i, '<head>\n' + SPLASH_CSS + '\n' + hints);
    html = html.replace(/<\/head>/i, '    ' + PWA_TAGS + '<script>' + fs.readFileSync(path.join(__dirname, 'utils/popanim.js'), 'utf8') + '</script></head>');
    html = html.replace(/<body([^>]*)>/i, '<body$1>\n' + SPLASH_HTML);
  }
  fs.writeFileSync(path.join(OUT, page), html);
  console.log('built', page, files.length ? '(' + files.length + ' scripts bundled)' : '');
}
if (problems) { console.error(problems + ' page(s) failed'); process.exit(1); }
console.log('Done -> dist/');
