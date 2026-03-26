/* nav.js — sets active nav state based on current page */
(function() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  var hash = window.location.hash;

  document.querySelectorAll('.site-nav a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href) return;
    var hFile = href.split('#')[0].split('/').pop();
    if (hFile === path || (path === '' && hFile === 'index.html')) {
      a.classList.add('active');
    }
  });

  // medium subnav
  if (document.querySelector('.medium-nav')) {
    document.querySelectorAll('.medium-nav a').forEach(function(a) {
      var h = a.getAttribute('href');
      if (h === hash || (!hash && h === '#oil')) {
        a.classList.add('active');
      }
    });
  }
})();
