#!/usr/bin/env node
/*
 * Atualiza data/videos.json a partir do feed RSS público do YouTube (sem chave de API).
 * Uso local:   node scripts/youtube-feed.js
 * No GitHub:   workflow youtube-feed.yml (agendado).
 * Configuração: data/youtube.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CFG_PATH = path.join(ROOT, 'data', 'youtube.json');
const OUT_PATH = path.join(ROOT, 'data', 'videos.json');
const cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));

function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function tag(xml, name) {
  const m = new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>').exec(xml);
  return m ? decode(m[1]).trim() : '';
}

async function feed(param) {
  const url = 'https://www.youtube.com/feeds/videos.xml?' + param;
  const r = await fetch(url, { headers: { 'User-Agent': 'fredmosc.tech feed bot' } });
  if (!r.ok) throw new Error(r.status + ' em ' + url);
  const xml = await r.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
    const e = m[1];
    const id = tag(e, 'yt:videoId');
    const link = (/<link rel="alternate" href="([^"]+)"/.exec(e) || [])[1] || '';
    return {
      id,
      titulo: tag(e, 'title'),
      descricao: tag(e, 'media:description').slice(0, 400),
      publicado: tag(e, 'published').slice(0, 10),
      link_feed: link
    };
  });
}

// Shorts: o link do feed costuma vir como /shorts/ (acredito; verificar). Como reforço,
// /shorts/ID responde 200 para Short e redireciona para /watch quando é vídeo normal.
async function isShort(v) {
  if (cfg.incluir && cfg.incluir.includes(v.id)) return false;
  if (/\/shorts\//.test(v.link_feed)) return true;
  try {
    const r = await fetch('https://www.youtube.com/shorts/' + v.id, { method: 'HEAD', redirect: 'manual' });
    return r.status === 200;
  } catch (e) {
    return false;
  }
}

function clean(v) {
  return { id: v.id, titulo: v.titulo, descricao: v.descricao, publicado: v.publicado };
}

(async () => {
  const excluir = new Set(cfg.excluir || []);
  const canal = await feed('channel_id=' + encodeURIComponent(cfg.channel_id));
  const longos = [];
  for (const v of canal) {
    if (excluir.has(v.id)) continue;
    if (await isShort(v)) continue;
    longos.push(clean(v));
  }
  const playlists = [];
  for (const p of cfg.playlists || []) {
    const itens = await feed('playlist_id=' + encodeURIComponent(p.id));
    playlists.push({
      id: p.id,
      titulo: p.titulo,
      descricao: p.descricao || '',
      videos: itens.filter(v => !excluir.has(v.id)).map(clean)
    });
  }
  const novo = { videos: longos.slice(0, cfg.max || 12), playlists };
  let antigo = null;
  try { antigo = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')); } catch (e) { /* primeira vez */ }
  const igual = antigo && JSON.stringify({ videos: antigo.videos, playlists: antigo.playlists }) === JSON.stringify(novo);
  if (igual) { console.log('Sem vídeos novos.'); return; }
  fs.writeFileSync(OUT_PATH, JSON.stringify(Object.assign({ atualizado: new Date().toISOString() }, novo), null, 2) + '\n');
  console.log('data/videos.json atualizado: ' + novo.videos.length + ' vídeo(s) longo(s), ' + playlists.length + ' playlist(s).');
})().catch(e => { console.error('Falhou:', e.message); process.exit(1); });
