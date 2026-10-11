# Rodar o site localmente

O site é estático, mas as páginas leem arquivos JSON (`articles/articles-index.json` e `data/palestras.json`).
Por isso ele **não funciona abrindo o `index.html` com dois cliques**: o navegador bloqueia a leitura de JSON em `file://`.
É preciso um servidor local. Um comando por vez:

## 1. Entrar na pasta do repositório

```
cd C:\Users\fmweb\projects\fredmosc.dev\Site-fredmosc.dev
```

## 2. Subir o servidor

Com Python instalado:

```
python -m http.server 8080
```

Sem Python, com Node:

```
npx serve -l 8080
```

## 3. Abrir no navegador

http://localhost:8080

Para parar o servidor: `Ctrl + C` no terminal.

## Observações

- Em `localhost` o Google Analytics **nunca** é carregado, mesmo clicando em "Aceitar".
- O formulário de e-mail envia para o **Brevo de verdade**, mas o Turnstile (anti-robô) só aceita o domínio `fredmosc.tech`: em `localhost` o envio falha na verificação. Para testar local, adicione `localhost` nos hostnames do widget no painel da Cloudflare.
- Artigo novo: crie o `.md` em `articles/` e gere o HTML com
  `npm install` e depois `node .github/scripts/generate-articles.js`.
  No GitHub, o workflow faz isso sozinho a cada push na `main`.
- Palestras: edite só `data/palestras.json`. A home e a página de palestras leem dali.

## Vídeos do YouTube

- A lista de vídeos vem de `data/videos.json`, gerado a partir do feed público do canal (sem chave de API).
- No GitHub, o workflow `youtube-feed.yml` atualiza a cada 6 horas (só roda na `main`).
- Para atualizar na sua máquina (com Node 18 ou mais novo):

```
node scripts/youtube-feed.js
```

- Shorts ficam de fora. Playlists e exclusões: edite `data/youtube.json`.
