// Client-side only. Classification lives in analyzer.js (shared with the
// dist-ai test suite). User input is rendered via DOM text nodes (never
// innerHTML), so pasted content can never inject markup.
(function () {
  var input = document.getElementById('in');
  var out = document.getElementById('out');
  var verdict = document.getElementById('verdict');
  var tallies = document.getElementById('tallies');

  var SAMPLES = {
    homoglyph: 'https://ex\u0430mple.org/account/login',
    zerowidth: 'npm install expr\u200Bess',
    bidi: 'Downloaded: report\u202Ecod.exe\u202C',
    ascii: 'git clone https://github.com/exarnple/build-toolkit',
    space: 'sudo\u00A0rm\u00A0-rf\u00A0/tmp/cache',
    combining: 'de\u0301ploy\u0300 to\u0308 prod\u0301',
    clean: 'git commit -m "fix typo in README"',
    clear: ''
  };

  var CLSMAP = { bidi:'m-bidi', zw:'m-zw', ctrl:'m-ctrl', space:'m-space',
    homo:'m-homo', wide:'m-wide', comb:'m-comb', other:'m-other' };

  function chip(ch, cp, info) {
    var s = document.createElement('span');
    s.className = 'mark ' + (CLSMAP[info.cls] || 'm-other');
    s.title = info.name + ' ' + OL.hex(cp);
    if (info.visible) {
      var g = document.createElement('span');
      g.className = 'g';
      g.textContent = ch;
      s.appendChild(g);
      s.appendChild(document.createTextNode(' ' + OL.hex(cp)));
    } else {
      s.textContent = OL.hex(cp);
    }
    return s;
  }

  function render() {
    var str = input.value;
    out.textContent = '';
    var res = OL.analyze(str);
    res.items.forEach(function (it) {
      if (it.safe !== undefined) {
        var t = document.createElement('span'); t.className = 'safe'; t.textContent = it.safe;
        out.appendChild(t);
      } else {
        out.appendChild(chip(it.ch, it.cp, it.info));
      }
    });

    if (!str) {
      verdict.textContent = ''; verdict.className = 'verdictline'; tallies.textContent = '';
      return;
    }
    if (res.flagged === 0) {
      verdict.textContent = 'Clean: printable ASCII only. Nothing hidden.';
      verdict.className = 'verdictline clean';
      tallies.textContent = '';
    } else {
      verdict.textContent = res.flagged + ' suspicious codepoint' + (res.flagged === 1 ? '' : 's') +
        ' found. Do not trust the rendering.';
      verdict.className = 'verdictline dirty';
      var parts = Object.keys(res.counts).map(function (k) { return res.counts[k] + ' ' + k; });
      tallies.textContent = '';
      tallies.appendChild(document.createTextNode('Breakdown: '));
      var b = document.createElement('b'); b.textContent = parts.join(', ');
      tallies.appendChild(b);
    }
  }

  input.addEventListener('input', render);
  document.getElementById('samples').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    /* own-property guard: a crafted/polluted data-k (e.g. __proto__, constructor) must not
       resolve to an inherited value; only our own sample keys load. */
    var k = btn.getAttribute('data-k');
    input.value = Object.prototype.hasOwnProperty.call(SAMPLES, k) ? SAMPLES[k] : '';
    render();
    input.focus();
  });

  var copyBtn = document.getElementById('copyascii');
  var copyMsg = document.getElementById('copymsg');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var safe = OL.toAscii(input.value);
    function ok(m) { copyMsg.textContent = m; setTimeout(function () { copyMsg.textContent = ''; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(safe).then(function () { ok('copied ASCII-only version to clipboard'); },
        function () { input.value = safe; render(); ok('clipboard blocked; stripped in place instead'); });
    } else { input.value = safe; render(); ok('stripped in place'); }
  });

  /* Preload from a sibling page (e.g. the terminal board's "send to x-ray
     tool"): the content is handed over in sessionStorage, never over the
     network, so this page still makes no request of its own. */
  try {
    var pre = sessionStorage.getItem('ol-xray-input');
    if (pre !== null) { sessionStorage.removeItem('ol-xray-input'); input.value = pre; }
  } catch (e) { /* sessionStorage unavailable; leave the box empty */ }

  render();
})();
