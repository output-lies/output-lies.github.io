/*
  output-lies text analyzer -- shared, DOM-free classifier. AI-Assisted.
  Source: https://github.com/output-lies/output-lies.github.io

  Pure functions only, so it runs identically in the browser (window.OL) and
  under node (module.exports) for the dist-ai test suite. It flags codepoints
  that are not plain printable ASCII and names the class of deception each
  belongs to. It deliberately does NOT try to judge intent, and it cannot catch
  all-ASCII homoglyphs (rn vs m) -- those need a human reading char by char.
*/
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OL = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function inRange(cp, a, b) { return cp >= a && cp <= b; }

  // Returns null for safe text (printable ASCII plus tab/newline/CR), otherwise
  // { cls, name, visible }. `visible` is true when the character occupies space
  // on screen (homoglyphs, fullwidth, combining) and false when it is invisible
  // or masquerades as a space.
  function classify(cp) {
    // ordinary, safe whitespace
    if (cp === 0x09 || cp === 0x0A || cp === 0x0D) return null;
    // C0 controls
    if (cp < 0x20) return { cls: 'ctrl', name: 'C0 control', visible: false };
    // printable ASCII
    if (cp <= 0x7E) return null;
    if (cp === 0x7F) return { cls: 'ctrl', name: 'DEL', visible: false };
    if (cp <= 0x9F) return { cls: 'ctrl', name: 'C1 control', visible: false };

    // bidirectional controls (Trojan Source)
    if (cp === 0x200E) return { cls: 'bidi', name: 'left-to-right mark', visible: false };
    if (cp === 0x200F) return { cls: 'bidi', name: 'right-to-left mark', visible: false };
    if (cp === 0x061C) return { cls: 'bidi', name: 'Arabic letter mark', visible: false };
    if (inRange(cp, 0x202A, 0x202E)) return { cls: 'bidi', name: 'bidi embedding/override', visible: false };
    if (inRange(cp, 0x2066, 0x2069)) return { cls: 'bidi', name: 'bidi isolate', visible: false };

    // zero-width and invisible format characters
    if (cp === 0x200B) return { cls: 'zw', name: 'zero-width space', visible: false };
    if (cp === 0x200C) return { cls: 'zw', name: 'zero-width non-joiner', visible: false };
    if (cp === 0x200D) return { cls: 'zw', name: 'zero-width joiner', visible: false };
    if (cp === 0x2060) return { cls: 'zw', name: 'word joiner', visible: false };
    if (inRange(cp, 0x2061, 0x2064)) return { cls: 'zw', name: 'invisible math operator', visible: false };
    if (cp === 0xFEFF) return { cls: 'zw', name: 'BOM / zero-width no-break space', visible: false };
    if (cp === 0x180E) return { cls: 'zw', name: 'Mongolian vowel separator', visible: false };
    if (inRange(cp, 0xFFF9, 0xFFFB)) return { cls: 'zw', name: 'interlinear annotation', visible: false };
    if (cp === 0x00AD) return { cls: 'zw', name: 'soft hyphen', visible: false };

    // line and paragraph separators (act like newlines, are not U+000A)
    if (cp === 0x2028) return { cls: 'ctrl', name: 'line separator', visible: false };
    if (cp === 0x2029) return { cls: 'ctrl', name: 'paragraph separator', visible: false };

    // deceptive whitespace: looks like a space, is not U+0020
    if (cp === 0x00A0) return { cls: 'space', name: 'no-break space', visible: false };
    if (cp === 0x1680) return { cls: 'space', name: 'ogham space mark', visible: false };
    if (inRange(cp, 0x2000, 0x200A)) return { cls: 'space', name: 'unicode space', visible: false };
    if (cp === 0x202F) return { cls: 'space', name: 'narrow no-break space', visible: false };
    if (cp === 0x205F) return { cls: 'space', name: 'medium mathematical space', visible: false };
    if (cp === 0x3000) return { cls: 'space', name: 'ideographic space', visible: false };
    if (cp === 0x2800) return { cls: 'space', name: 'braille blank', visible: false };

    // tag characters (deprecated; can smuggle hidden ASCII, e.g. behind an emoji)
    if (inRange(cp, 0xE0000, 0xE007F)) return { cls: 'ctrl', name: 'tag character', visible: false };

    // variation selectors
    if (inRange(cp, 0xFE00, 0xFE0F) || inRange(cp, 0xE0100, 0xE01EF))
      return { cls: 'comb', name: 'variation selector', visible: false };

    // combining grapheme joiner is a combining mark but has no glyph
    if (cp === 0x034F) return { cls: 'comb', name: 'combining grapheme joiner', visible: false };
    // combining marks (Zalgo, overflow, disguise)
    if (inRange(cp, 0x0300, 0x036F) || inRange(cp, 0x1AB0, 0x1AFF) ||
        inRange(cp, 0x1DC0, 0x1DFF) || inRange(cp, 0x20D0, 0x20FF) || inRange(cp, 0xFE20, 0xFE2F))
      return { cls: 'comb', name: 'combining mark', visible: true };

    // private use areas
    if (inRange(cp, 0xE000, 0xF8FF) || inRange(cp, 0xF0000, 0xFFFFD) || inRange(cp, 0x100000, 0x10FFFD))
      return { cls: 'other', name: 'private use', visible: true };

    // homoglyph-prone scripts (coarse: flags the whole script, not confusable pairs)
    if (inRange(cp, 0x0400, 0x052F)) return { cls: 'homo', name: 'Cyrillic', visible: true };
    if (inRange(cp, 0x0370, 0x03FF)) return { cls: 'homo', name: 'Greek', visible: true };
    if (inRange(cp, 0x0530, 0x058F)) return { cls: 'homo', name: 'Armenian', visible: true };
    if (inRange(cp, 0x13A0, 0x13FF)) return { cls: 'homo', name: 'Cherokee', visible: true };

    // fullwidth and halfwidth forms
    if (inRange(cp, 0xFF00, 0xFFEF)) return { cls: 'wide', name: 'fullwidth/halfwidth form', visible: true };

    // anything else outside ASCII
    return { cls: 'other', name: 'non-ASCII', visible: true };
  }

  function hex(cp) {
    var h = cp.toString(16).toUpperCase();
    while (h.length < 4) h = '0' + h;
    return 'U+' + h;
  }

  // Splits a string into a list of tokens: { safe: '...' } runs of safe text and
  // { ch, cp, info } flagged codepoints. Iterates by codepoint (astral-safe).
  function analyze(str) {
    var items = [], counts = {}, flagged = 0, run = '';
    var chars = Array.from(str == null ? '' : String(str));
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i], cp = ch.codePointAt(0), info = classify(cp);
      if (!info) { run += ch; continue; }
      if (run) { items.push({ safe: run }); run = ''; }
      items.push({ ch: ch, cp: cp, info: info });
      flagged++;
      counts[info.name] = (counts[info.name] || 0) + 1;
    }
    if (run) items.push({ safe: run });
    return { items: items, flagged: flagged, counts: counts };
  }

  // Returns the input with every flagged codepoint removed: plain printable
  // ASCII plus tab/newline. This is a coarse "make it safe to paste" helper, not
  // a substitute for stcat/sanitize-string.
  function toAscii(str) {
    var out = '', chars = Array.from(str == null ? '' : String(str));
    for (var i = 0; i < chars.length; i++) {
      var cp = chars[i].codePointAt(0);
      if (classify(cp) === null) out += chars[i];
    }
    return out;
  }

  return { classify: classify, analyze: analyze, hex: hex, toAscii: toAscii };
}));
