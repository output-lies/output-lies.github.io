/* Local-only share links. No third-party script or resource is loaded; a
   target opens only when the user clicks it. */
(function () {
  var u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
  var L = {
    x: 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t,
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
    telegram: 'https://t.me/share/url?url=' + u + '&text=' + t,
    reddit: 'https://www.reddit.com/submit?url=' + u + '&title=' + t,
    whatsapp: 'https://api.whatsapp.com/send?text=' + t + '%20' + u,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
    hn: 'https://news.ycombinator.com/submitlink?u=' + u + '&t=' + t,
    email: 'mailto:?subject=' + t + '&body=' + u
  };
  document.querySelectorAll('.fshare a.sh').forEach(function (a) {
    var n = a.getAttribute('data-net');
    if (L[n]) { a.href = L[n]; if (n !== 'email') { a.target = '_blank'; } }
  });
  var m = document.querySelector('.fshare [data-net=mastodon]');
  if (m) m.addEventListener('click', function (e) {
    e.preventDefault();
    var i = prompt('Your Mastodon instance (e.g. mastodon.social):');
    if (i) { i = i.replace('https://', '').replace('http://', '').replace(/\/+$/, '');
      window.open('https://' + i + '/share?text=' + t + '%20' + u, '_blank', 'noopener'); }
  });
  var msg = document.querySelector('.fshare .sh-msg');
  function flash(x) { if (msg) { msg.textContent = x; setTimeout(function () { msg.textContent = ''; }, 2000); } }
  var c = document.querySelector('.fshare [data-net=copy]');
  if (c) c.addEventListener('click', function () {
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { flash('link copied'); });
  });
  var md = document.querySelector('.fshare [data-net=md]');
  if (md) md.addEventListener('click', function () {
    var text = '[' + document.title + '](' + location.href + ')';
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { flash('markdown copied'); });
  });
})();
