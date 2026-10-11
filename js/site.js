/* fredmosc.tech — JS único do site (sem dependências) */
(function () {
  'use strict';

  var GA_ID = 'G-CWTC51T090';
  var BREVO_URL = 'https://ccbc6458.sibforms.com/serve/MUIFAGeGHkrSRoJSdkhS5x3gAu5YqyFxCdkR2FDNEyxxY1B6w61fXxRpVGc5S9Dhqd6iK_jEs6gxZHEwkal9pfvV93KQZac05-JAClkkNxAQ8CLEdbjqGKykZJB5Ffb1C7EGR10EXrKQhSSyTYcA7wJHcM1-6E6aZGFyxjXZi2T2LHDgmlks4KpSUNTz2B8siMpyTbxHXcz5VYseAw==?isAjax=1';
  var TURNSTILE_KEY = '0x4AAAAAAFTaHdkwGqXzqStY';   // chave pública do widget (Cloudflare)
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
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    var mm = /^(\d{4})-(\d{2})$/.exec(ymd || '');   // só mês: "10/2026"
    return mm ? mm[2] + '/' + mm[1] : esc(ymd);
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
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function todayYMD() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // "2026-10" vale até o último dia de outubro; "2026-10-21" vale até o próprio dia
  function endOf(data) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
    var m = /^(\d{4})-(\d{2})$/.exec(data || '');
    if (!m) return '0000-00-00';
    var last = new Date(Date.UTC(+m[1], +m[2], 0)).getUTCDate();
    return m[1] + '-' + m[2] + '-' + String(last).padStart(2, '0');
  }
  function fmtWhen(data) {
    var m = /^(\d{4})-(\d{2})$/.exec(data || '');
    return m ? MESES[+m[2] - 1] + ' de ' + m[1] : fmtDate(data);
  }
  function city(local) { return String(local).split('/')[0].trim(); }
  function evName(p) { return esc(p.evento) + (p.por ? ' <span class="por">via ' + esc(p.por) + '</span>' : ''); }
  function isOnline(local) { return /online/i.test(local); }

  function splitPalcos(d) {
    var hoje = todayYMD();
    var futuros = d.palcos.filter(function (p) { return endOf(p.data) >= hoje; })
      .sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    var passados = d.palcos.filter(function (p) { return endOf(p.data) < hoje; })
      .sort(function (a, b) { return a.data < b.data ? 1 : -1; });
    return { futuros: futuros, passados: passados };
  }
  function stats(passados, teses) {
    var cidades = {}, estados = {}, anos = {};
    passados.forEach(function (p) {
      anos[p.data.slice(0, 4)] = 1;
      if (isOnline(p.local)) return;
      cidades[city(p.local)] = 1;
      var uf = /\/([A-Z]{2})/.exec(p.local);
      if (uf) estados[uf[1]] = 1;
    });
    var a = Object.keys(anos).sort();
    return {
      palcos: passados.length,
      cidades: Object.keys(cidades).length,
      estados: Object.keys(estados).length,
      teses: teses.length,
      rotulo: a.length <= 1 ? 'palcos em ' + (a[0] || new Date().getFullYear()) : 'palcos desde ' + a[0]
    };
  }
  function photo(foto, legenda, cls, h) {
    var st = h ? ' style="height:' + h + 'px"' : '';
    return foto
      ? '<img class="pic-img ' + cls + '"' + st + ' src="' + ROOT + esc(foto) + '" alt="Fred palestrando: ' + esc(legenda) + '" loading="lazy">'
      : '<div class="ph ' + cls + '"' + st + '>[ foto ]<br>' + esc(legenda) + '</div>';
  }
  function nextBar(futuros, withLink) {
    if (!futuros.length) return '';
    var n = futuros[0];
    var extra = futuros.length > 1 ? ' · e mais ' + (futuros.length - 1) : '';
    var when = fmtWhen(n.data) + (n.horario ? ' · ' + esc(n.horario) : '');
    return '<div class="wrap"><div><div class="k">Próximo palco</div>' +
      '<h3>' + esc(n.evento) + ' · ' + esc(n.local) + '</h3>' +
      '<p>' + esc(n.tema) + ' · ' + when + extra + '</p></div>' +
      (withLink ? '<a class="pill" href="' + ROOT + 'palestras.html">Ver palestras →</a>'
                : '<span class="pill">' + (n.confirmado ? 'Confirmado' : 'Data a confirmar') + '</span>') + '</div>';
  }
  function wall(passados) {
    var ordem = [], n = {};
    passados.slice().reverse().forEach(function (p) {
      if (!n[p.evento]) { n[p.evento] = 0; ordem.push(p.evento); }
      n[p.evento]++;
    });
    // destaques primeiro
    var dest = passados.filter(function (p) { return p.destaque; }).map(function (p) { return p.evento; });
    ordem.sort(function (a, b) { return (dest.indexOf(a) === -1) - (dest.indexOf(b) === -1); });
    return ordem.map(function (e) {
      return '<span class="wall-item' + (dest.indexOf(e) !== -1 ? ' hot' : '') + '">' + esc(e) +
        (n[e] > 1 ? '<small>×' + n[e] + '</small>' : '') + '</span>';
    }).join('');
  }
  function featured(passados) {
    return passados.filter(function (p) { return p.destaque; }).map(function (p) {
      return '<article class="feat">' + photo(p.foto, p.evento + ' · ' + city(p.local), 'feat-pic') +
        '<div class="feat-body"><div class="k">' + evName(p) + '</div>' +
        '<h3>' + esc(p.tema) + '</h3>' + (p.resumo ? '<p>' + esc(p.resumo) + '</p>' : '') +
        '<div class="where">' + esc(p.local) + ' · ' + fmtDate(p.data) + '</div></div></article>';
    }).join('');
  }
  function apresentacoes(tese, passados) {
    return passados.filter(function (p) { return p.tese === tese.id; }).slice().reverse();
  }
  function fillStats(s) {
    document.querySelectorAll('[data-stat]').forEach(function (e) {
      var k = e.getAttribute('data-stat');
      if (k === 'rotulo') e.textContent = s.rotulo; else if (s[k] != null) e.textContent = s[k];
    });
  }

  var talksHome = $('#talks-home'), talksPage = $('#talks-list'), nextHome = $('#next-home'), statEls = $('[data-stat]');
  if (talksHome || talksPage || nextHome || statEls) {
    getJSON('data/palestras.json').then(function (d) {
      var sp = splitPalcos(d), s = stats(sp.passados, d.teses);
      fillStats(s);

      if (nextHome) {
        if (sp.futuros.length) nextHome.innerHTML = nextBar(sp.futuros, true);
        else nextHome.remove();
      }
      var w = $('#talks-wall'); if (w) w.innerHTML = wall(sp.passados);
      var f = $('#talks-feat'); if (f) f.innerHTML = featured(sp.passados);

      if (talksHome) {
        talksHome.innerHTML = d.teses.map(function (t) {
          var ap = apresentacoes(t, sp.passados);
          return '<a class="tcard" href="' + ROOT + 'palestras.html#' + esc(t.id) + '">' +
            '<div class="k">Tese · ' + esc(t.rotulo) + '</div>' +
            '<h3>' + esc(t.titulo) + '</h3><p>' + esc(t.tese) + '</p>' +
            '<div class="where">' + ap.length + (ap.length > 1 ? ' palcos' : ' palco') + ' · ' +
            ap.map(function (p) { return esc(city(p.local)); }).join(', ') + '</div></a>';
        }).join('');
      }

      if (talksPage) {
        var next = $('#talks-next');
        if (next) { if (sp.futuros.length) next.innerHTML = nextBar(sp.futuros, false); else next.remove(); }
        talksPage.innerHTML = d.teses.map(function (t) {
          var ap = apresentacoes(t, sp.passados);
          var ideias = t.ideias && t.ideias.length
            ? '<ul class="keys">' + t.ideias.map(function (i) { return '<li><span><b>' + esc(i[0]) + '</b> ' + esc(i[1]) + '</span></li>'; }).join('') + '</ul>'
            : '';
          var link = t.artigo ? '<div class="links"><a href="' + ROOT + esc(t.artigo) + '">Ler o artigo →</a></div>' : '';
          return '<article class="thesis" id="' + esc(t.id) + '">' + photo(t.foto, t.legenda_foto, 'pic') +
            '<div><div class="tag analise"><i></i>Tese · ' + esc(t.rotulo) + '</div>' +
            '<h2>' + esc(t.titulo) + '</h2><p class="q">' + esc(t.tese) + '</p>' + ideias +
            '<div class="where2">' + ap.map(function (p) {
              return '<b>' + evName(p) + '</b> · ' + esc(p.local) + ' · ' + fmtDate(p.data);
            }).join('<br>') + '</div>' + link + '</div></article>';
        }).join('');
        var hist = $('#talks-hist');
        if (hist) {
          hist.innerHTML = sp.passados.map(function (p) {
            return '<div class="row"><span class="d">' + fmtDate(p.data) + '</span><span class="e">' +
              evName(p) + ' · ' + esc(p.local) + (p.destaque ? ' <em class="star">destaque</em>' : '') +
              '</span><span class="c">' + esc(p.tema) + '</span></div>';
          }).join('');
        }
      }
    }).catch(function (e) { console.error('palestras:', e); });
  }

  /* ---------- vídeos (data/videos.json, gerado pelo workflow do YouTube) ---------- */
  var CANAL = 'https://www.youtube.com/@fredmosc-tech';
  var PLAY = '<svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true"><rect width="68" height="48" rx="12" fill="#0267AE"/><path d="M27 15 L47 24 L27 33 Z" fill="#fff"/></svg>';
  // Fachada: só carrega o player (youtube-nocookie) quando a pessoa clica
  function ytFacade(v, big, vertical) {
    return '<button class="yt' + (big ? ' yt-big' : '') + (vertical ? ' yt-v' : '') + '" type="button" data-yt="' + esc(v.id) + '" aria-label="Assistir: ' + esc(v.titulo) + '">' +
      '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy">' +
      '<span class="yt-play">' + PLAY + '</span></button>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-yt]');
    if (!b) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.getAttribute('data-yt')) + '?autoplay=1&rel=0';
    f.title = b.getAttribute('aria-label') || 'Vídeo';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.className = 'yt-frame' + (b.classList.contains('yt-v') ? ' yt-v' : '');
    b.replaceWith(f);
  });
  function trim(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function videoCard(v) {
    return '<article class="vcard">' + ytFacade(v, false) +
      '<div class="vbody"><h3>' + esc(v.titulo) + '</h3>' +
      '<div class="meta">' + fmtDate(v.publicado) + '</div></div></article>';
  }

  var vHome = $('#video-home'), vPage = $('#videos-list');
  if (vHome || vPage) {
    getJSON('data/videos.json').then(function (d) {
      var vids = d.videos || [];
      var shorts = d.shorts || [];
      if (vHome) {
        // vídeo longo mais recente; enquanto não houver, o Short mais recente
        var v = vids[0] || shorts[0], isShort = !vids.length;
        if (!v) { vHome.remove(); } else {
          var slot = $('#video-home-slot');
          if (isShort) slot.classList.add('is-short');
          slot.innerHTML =
            '<div>' + ytFacade(v, true, isShort) + '</div>' +
            '<div class="vtext"><div class="eyebrow"><i></i>' + (isShort ? 'Último vídeo no canal' : 'Último vídeo') + '</div><h2>' + esc(v.titulo) + '</h2>' +
            '<p>' + esc(trim(v.descricao, 220)) + '</p><div class="meta">' + fmtDate(v.publicado) + '</div>' +
            '<div class="links"><a href="' + ROOT + 'videos.html">Ver todos os vídeos →</a>' +
            '<a href="' + CANAL + '?sub_confirmation=1" target="_blank" rel="noopener">Inscrever no canal</a></div></div>';
        }
      }
      if (vPage) {
        vPage.innerHTML = vids.length ? '<div class="grid3">' + vids.map(videoCard).join('') + '</div>'
          : '<div class="empty">Os primeiros vídeos longos chegam em breve. Enquanto isso, o canal está no <a href="' + CANAL + '" target="_blank" rel="noopener" style="color:var(--azul);text-decoration:underline">YouTube</a>.</div>';
        var sh = $('#shorts-list');
        if (sh) {
          sh.innerHTML = shorts.length
            ? '<section class="playlist"><div class="sec-head"><div><h2>Shorts</h2><p>O recado em menos de um minuto.</p></div>' +
              '<a class="more" href="' + CANAL + '/shorts" target="_blank" rel="noopener">Ver no YouTube →</a></div>' +
              '<div class="shorts">' + shorts.map(function (v) {
                return '<article class="vcard">' + ytFacade(v, false, true) + '<div class="vbody"><h3>' + esc(v.titulo) + '</h3><div class="meta">' + fmtDate(v.publicado) + '</div></div></article>';
              }).join('') + '</div></section>'
            : '';
        }
        var pl = $('#playlists');
        if (pl) {
          pl.innerHTML = (d.playlists || []).filter(function (p) { return p.videos && p.videos.length; }).map(function (p) {
            return '<section class="playlist"><div class="sec-head"><div><h2>' + esc(p.titulo) + '</h2>' +
              (p.descricao ? '<p>' + esc(p.descricao) + '</p>' : '') + '</div>' +
              '<a class="more" href="https://www.youtube.com/playlist?list=' + esc(p.id) + '" target="_blank" rel="noopener">Abrir no YouTube →</a></div>' +
              '<div class="grid3">' + p.videos.map(videoCard).join('') + '</div></section>';
          }).join('');
        }
      }
    }).catch(function (e) { console.error('videos:', e); if (vHome) vHome.remove(); });
  }

  /* ---------- newsletter (Brevo + Cloudflare Turnstile, com consentimento) ---------- */
  var form = $('#newsletter');
  if (form) {
    var msg = $('.form-msg', form), sub = $('button[type=submit]', form), tsBox = $('#nl-turnstile', form);
    var tsId = null, tsReady = null, tsWait = null;

    // Turnstile só é carregado quando a pessoa começa a usar o formulário
    var loadTurnstile = function () {
      if (tsReady) return tsReady;
      tsReady = new Promise(function (ok, no) {
        window.__onTurnstile = function () {
          tsId = window.turnstile.render(tsBox, {
            sitekey: TURNSTILE_KEY, execution: 'execute', language: 'pt-br',
            callback: function (t) { if (tsWait) { tsWait.ok(t); tsWait = null; } },
            'error-callback': function () { if (tsWait) { tsWait.no(); tsWait = null; } }
          });
          ok();
        };
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onTurnstile';
        s.async = true;
        s.onerror = function () { tsReady = null; no(); };
        document.head.appendChild(s);
      });
      return tsReady;
    };
    var getToken = function () {
      return loadTurnstile().then(function () {
        return new Promise(function (ok, no) {
          tsWait = { ok: ok, no: no };
          window.turnstile.reset(tsId);
          window.turnstile.execute(tsId);
        });
      });
    };
    var fail = function (t) {
      sub.disabled = false; sub.textContent = 'Quero receber';
      msg.className = 'form-msg err'; msg.textContent = t;
    };
    form.addEventListener('focusin', loadTurnstile, { once: true });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#nl-email', form).value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Confira o e-mail.');
      if (!$('#consent-news', form).checked) return fail('Marque a caixa de consentimento para continuar.');
      sub.disabled = true; sub.textContent = 'Enviando...'; msg.textContent = '';
      var nome = $('#nl-name', form).value.trim().split(/\s+/);
      getToken().then(function (token) {
        var fd = new FormData(form);   // EMAIL, NIVEL, INTERESSES[]
        fd.set('FIRSTNAME', nome.shift() || '');
        fd.set('LASTNAME', nome.join(' '));
        fd.set('EMAIL', email);          // e-mail já sem espaços nas pontas
        fd.set('email_address_check', ''); // sempre vazio: o autocompletar do Chrome preenchia qualquer honeypot e o Brevo descartava a inscrição
        fd.set('ORIGEM', 'site-fredmosc.tech');
        fd.set('locale', 'pt');
        fd.set('cf-turnstile-response', token);
        return fetch(BREVO_URL, { method: 'POST', body: fd });
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data && data.success) {
          form.innerHTML = '<p class="form-msg ok">Quase lá: mandei um e-mail para confirmar sua inscrição. Clique no link dele (olhe o spam se não chegar em 5 minutos).</p>';
        } else {
          fail('Não consegui registrar. Confira o e-mail e tente de novo.');
        }
      }).catch(function () {
        fail('A verificação anti-robô ou a conexão falhou. Tente de novo em instantes.');
      });
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
