/* fredmosc.tech — JS único do site (sem dependências) */
(function () {
  'use strict';

  var GA_ID = 'G-CWTC51T090';
  var ML_URL = 'https://assets.mailerlite.com/jsonp/1926896/forms/171352208571368570/subscribe';
  var CONSENT_KEY = 'fm_consent_v1';
  var ROOT = document.body.getAttribute('data-root') || '';
  var IS_LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|)$/.test(location.hostname);

  /* ---------- utilidades ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // AAAA-MM-DD -> DD/MM/AAAA sem passar por Date (evita cair no dia anterior por fuso)
  function fmtDate(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : esc(ymd);
  }
  function typeOf(category) {
    var c = String(category || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (c.indexOf('noticia') === 0) return { cls: 'noticia', label: 'Notícia' };
    if (c.indexOf('analise') === 0) return { cls: 'analise', label: 'Análise técnica' };
    if (c.indexOf('relato') === 0) return { cls: 'relato', label: 'Relato' };
    if (c.indexOf('fora') === 0) return { cls: 'fora', label: 'Fora da tech' };
    return { cls: 'analise', label: esc(category) };
  }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function getJSON(path) {
    return fetch(ROOT + path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + path);
      return r.json();
    });
  }

  /* ---------- menu mobile ---------- */
  var btn = $('.menu-btn'), nav = $('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- consentimento + GA4 (só carrega depois do "Aceitar") ---------- */
  function loadGA() {
    if (IS_LOCAL || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }
  function showConsent() {
    if ($('.consent')) return;
    var box = document.createElement('div');
    box.className = 'consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Preferências de cookies');
    box.innerHTML =
      '<p>Uso o Google Analytics para saber quais textos são lidos. Ele só é ativado se você aceitar. ' +
      '<a href="' + ROOT + 'privacidade.html">Política de Privacidade</a></p>' +
      '<div class="acts"><button class="no" type="button">Recusar</button>' +
      '<button class="yes" type="button">Aceitar</button></div>';
    document.body.appendChild(box);
    $('.yes', box).addEventListener('click', function () { store(CONSENT_KEY, 'granted'); box.remove(); loadGA(); });
    $('.no', box).addEventListener('click', function () { store(CONSENT_KEY, 'denied'); box.remove(); });
  }
  var choice = store(CONSENT_KEY);
  if (choice === 'granted') loadGA();
  else if (choice !== 'denied') showConsent();
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-consent-open]');
    if (a) { e.preventDefault(); showConsent(); }
  });

  /* ---------- artigos ---------- */
  function articleCard(a) {
    var t = typeOf(a.category);
    return '<a class="card" href="' + ROOT + esc(a.url) + '">' +
      '<div class="band ' + t.cls + '"><b>' + esc(a.title) + '</b></div>' +
      '<div class="body"><div class="tag ' + t.cls + '"><i></i>' + t.label + '</div>' +
      '<p>' + esc(a.excerpt) + '</p>' +
      '<div class="meta">' + fmtDate(a.date) + ' · ' + esc(a.readTime) + ' de leitura</div></div></a>';
  }

  var latest = $('#latest');
  if (latest) {
    getJSON('articles/articles-index.json').then(function (list) {
      latest.innerHTML = list.length
        ? list.slice(0, 3).map(articleCard).join('')
        : '<div class="empty">As primeiras análises chegam em breve.</div>';
    }).catch(function () { latest.innerHTML = '<div class="empty">Não consegui carregar as análises agora.</div>'; });
  }

  var grid = $('#articles');
  if (grid) {
    var all = [], current = 'todas', term = '';
    var params = new URLSearchParams(location.search);
    if (params.get('tipo')) current = params.get('tipo');
    var render = function () {
      var items = all.filter(function (a) {
        var okType = current === 'todas' || typeOf(a.category).cls === current;
        var hay = (a.title + ' ' + a.excerpt + ' ' + (a.tags || []).join(' ')).toLowerCase();
        return okType && (!term || hay.indexOf(term) !== -1);
      });
      grid.innerHTML = items.length ? items.map(articleCard).join('')
        : '<div class="empty">Nada por aqui com esse filtro.</div>';
      document.querySelectorAll('.filters button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-tipo') === current ? 'true' : 'false');
      });
    };
    document.querySelectorAll('.filters button').forEach(function (b) {
      b.addEventListener('click', function () { current = b.getAttribute('data-tipo'); render(); });
    });
    var search = $('#search');
    if (search) search.addEventListener('input', function () { term = search.value.trim().toLowerCase(); render(); });
    getJSON('articles/articles-index.json').then(function (list) { all = list; render(); })
      .catch(function () { grid.innerHTML = '<div class="empty">Não consegui carregar as análises agora.</div>'; });
  }

  /* ---------- palestras ---------- */
  function wherePlain(t) {
    return t.apresentacoes.map(function (p) {
      return esc(p.evento) + ' · ' + esc(p.local) + ' · ' + fmtDate(p.data);
    }).join('<br>');
  }
  function photo(t, cls) {
    return t.foto
      ? '<img class="pic-img ' + cls + '" src="' + ROOT + esc(t.foto) + '" alt="Fred palestrando: ' + esc(t.legenda_foto) + '" loading="lazy">'
      : '<div class="ph ' + cls + '">[ foto ]<br>' + esc(t.legenda_foto) + '</div>';
  }

  var talksHome = $('#talks-home');
  var talksPage = $('#talks-list');
  if (talksHome || talksPage) {
    getJSON('data/palestras.json').then(function (d) {
      var nPalcos = d.palcos.length, nTeses = d.teses.length;
      document.querySelectorAll('[data-stat="palcos"]').forEach(function (e) { e.textContent = nPalcos; });
      document.querySelectorAll('[data-stat="teses"]').forEach(function (e) { e.textContent = nTeses; });

      if (talksHome) {
        talksHome.innerHTML = d.teses.map(function (t) {
          return '<div class="tcard">' + photo(t, '').replace('class="ph ', 'style="height:150px" class="ph ').replace('class="pic-img ', 'style="height:150px" class="pic-img ') +
            '<h3>' + esc(t.titulo) + '</h3><p>' + esc(t.tese) + '</p>' +
            '<div class="where">' + wherePlain(t) + '</div></div>';
        }).join('');
        var inst = d.palcos.filter(function (p) { return p.institucional; });
        var oth = $('#talks-others');
        if (oth && inst.length) {
          oth.innerHTML = '<b>Outros palcos em 2026:</b> ' + inst.slice().reverse().map(function (p) {
            return esc(p.evento) + ' ' + esc(p.local.split('/')[0]) + ' (' + fmtDate(p.data).slice(0, 5) + ')';
          }).join(' · ');
        }
      }

      if (talksPage) {
        var next = $('#talks-next');
        if (next) {
          if (d.proximos && d.proximos.length) {
            var n = d.proximos[0];
            next.innerHTML = '<div class="wrap"><div><div class="k">Próximo palco</div>' +
              '<h3>' + esc(n.evento) + ' · ' + esc(n.local) + '</h3>' +
              '<p>' + esc(n.detalhe) + ' · ' + esc(n.quando) + '</p></div>' +
              '<span class="pill">' + (n.confirmado ? 'Confirmado' : 'Data a confirmar') + '</span></div>';
          } else { next.remove(); }
        }
        talksPage.innerHTML = d.teses.map(function (t) {
          var ideias = t.ideias && t.ideias.length
            ? '<ul class="keys">' + t.ideias.map(function (i) { return '<li><span><b>' + esc(i[0]) + '</b> ' + esc(i[1]) + '</span></li>'; }).join('') + '</ul>'
            : '';
          var link = t.artigo ? '<a href="' + ROOT + esc(t.artigo) + '">Ler o artigo →</a>' : '';
          return '<article class="thesis" id="' + esc(t.id) + '">' + photo(t, 'pic') +
            '<div><div class="tag analise"><i></i>Tese · ' + esc(t.rotulo) + '</div>' +
            '<h2>' + esc(t.titulo) + '</h2><p class="q">' + esc(t.tese) + '</p>' + ideias +
            '<div class="where2">' + t.apresentacoes.map(function (p) {
              return '<b>' + esc(p.evento) + '</b> · ' + esc(p.local) + ' · ' + fmtDate(p.data);
            }).join('<br>') + '</div>' +
            (link ? '<div class="links">' + link + '</div>' : '') + '</div></article>';
        }).join('');
        var hist = $('#talks-hist');
        if (hist) {
          hist.innerHTML = d.palcos.map(function (p) {
            return '<div class="row"><span class="d">' + fmtDate(p.data) + '</span><span class="e">' +
              esc(p.evento) + ' · ' + esc(p.local) + '</span><span class="c">' + esc(p.tema) + '</span></div>';
          }).join('');
        }
      }
    }).catch(function (e) { console.error('palestras:', e); });
  }

  /* ---------- newsletter (MailerLite, JSONP, com consentimento) ---------- */
  var form = $('#newsletter');
  if (form) {
    var msg = $('.form-msg', form), sub = $('button[type=submit]', form);
    window.ml_callback = function (data) {
      sub.disabled = false; sub.textContent = 'Quero receber';
      if (data && data.success) {
        form.innerHTML = '<p class="form-msg ok">Quase lá: confirme a inscrição no e-mail que acabei de enviar.</p>';
      } else {
        msg.className = 'form-msg err';
        msg.textContent = 'Não consegui registrar. Confira o e-mail e tente de novo.';
      }
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!$('#consent-news', form).checked) {
        msg.className = 'form-msg err';
        msg.textContent = 'Marque a caixa de consentimento para continuar.';
        return;
      }
      sub.disabled = true; sub.textContent = 'Enviando...'; msg.textContent = '';
      var p = new URLSearchParams({
        'fields[name]': $('#nl-name', form).value,
        'fields[email]': $('#nl-email', form).value,
        'ml-submit': '1', 'anticsrf': 'true', 'callback': 'ml_callback'
      });
      var s = document.createElement('script');
      s.src = ML_URL + '?' + p.toString();
      s.onload = function () { s.remove(); };
      s.onerror = function () { window.ml_callback(null); s.remove(); };
      document.body.appendChild(s);
    });
  }

  /* ---------- artigo: compartilhar ---------- */
  var share = $('.share');
  if (share) {
    var url = location.href, title = document.title;
    share.addEventListener('click', function (e) {
      var b = e.target.closest('[data-share]');
      if (!b) return;
      e.preventDefault();
      var k = b.getAttribute('data-share');
      if (k === 'linkedin') window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
      if (k === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), '_blank', 'noopener');
      if (k === 'copy') {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
          .then(function () { b.textContent = 'Link copiado'; })
          .catch(function () { prompt('Copie o link:', url); });
      }
    });
  }

  /* ---------- artigo: diagramas mermaid (só carrega se houver) ---------- */
  var mer = document.querySelectorAll('pre code.language-mermaid');
  if (mer.length) {
    mer.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'mermaid';
      d.textContent = c.textContent;
      c.parentNode.replaceWith(d);
    });
    var ms = document.createElement('script');
    ms.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    ms.onload = function () { window.mermaid.initialize({ startOnLoad: false, theme: 'neutral' }); window.mermaid.run(); };
    document.body.appendChild(ms);
  }
})();
