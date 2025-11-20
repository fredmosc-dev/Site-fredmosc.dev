---
title: "A Saga do BM-800 no Linux: 8 Horas, 2 Vilões e 1 Final Feliz 🎤 🐧"
excerpt: "Funcionava no Windows na mesma máquina. No Linux? Bem... essa é a história de duas sagas que pareciam uma só."
date: "2025-11-16"
category: "Arquitetura"
tags: ["Linux", "PulseAudio", "OBS"]
---
A Saga do BM-800 no Linux: 8 Horas, 2 Vilões e 1 Final Feliz 🎤 🐧 

"Funcionava no Windows na mesma máquina. No Linux? Bem... essa é a história de duas sagas que pareciam uma só." 

# Prólogo: Eu Só Queria Gravar Uns Vídeos 

Olha, eu não sou engenheiro de áudio. Eu só tinha um problema simples: 

Os vídeos que eu gravava no OBS tinham áudio HORRÍVEL. 

Picotes. Silêncios aleatórios. "Chiados" digitais. Sabe aquele áudio de tutorial de YouTube feito por uma criança de 10 anos gritando no microfone? Exatamente isso. 

E o pior: o mesmo microfone funcionava PERFEITAMENTE na mesma máquina com Windows! 

Meu setup: 

● Hardware : Dell Inspiron (notebook) i7 13ª geração, 32GB RAM 

● SO : Ubuntu 22.04 LTS 

● Microfone : BM-800 USB (chip Texas Instruments PCM2902) 

● Software : OBS Studio v30+ (para websocket nativo) 

Então comecei a saga. Uma saga que, somando as duas frentes de batalha, durou quase 8 horas. 

# Capítulo 1: O Primeiro Vilão - Sobrecarga de CPU (A Saga de 4 Horas) 

Minha primeira jornada de 4 horas foi focada no OBS, achando que o problema estava lá. Fase 1: O "Áudio Estourado" (Clipping) 

O primeiro teste mostrou o áudio "estourando" (batendo no vermelho). 

✅ Google Meet : Áudio perfeito 

❌ OBS : Áudio distorcido 

O Meet aplica filtros automáticos (Controle de Ganho). O OBS estava capturando o áudio "cru", que estava com o ganho de entrada muito alto no Linux. 

Solução: Reduzi o ganho de entrada do microfone nas configurações de som do Linux até o medidor do OBS ficar na faixa amarela (-15dB). 

Fase 2: O "Áudio Picotado" (Sobrecarga de CPU) 

O áudio parou de estourar, mas agora tinha picotes grosseiros (falhas de 1 segundo). O painel "Estatísticas" do OBS foi claro: "Quadros perdidos devidos à demora na codificação" .

Diagnóstico: Meu i7 de 13ª Geração (um monstro!) estava sobrecarregado. O OBS estava usando o codificador de software (x264) para comprimir o vídeo 1080p e, na falta de "fôlego", ele "jogava fora" pacotes de áudio. 

A Solução Lógica: Parar de usar o CPU e usar a placa de vídeo integrada (Intel Iris Xe) através da aceleração de hardware: FFmpeg VAAPI .

Fase 3: A Caça ao "Pacote Fantasma" (O Inferno do apt) 

Aqui a jornada de 4 horas realmente começou. A opção FFmpeg VAAPI simplesmente não aparecia no OBS. 

1.  A Hipótese: Faltava o driver intel-media-driver. Tentei sudo apt install intel-media-driver. 

2.  Erro 1: E: Impossível encontrar o pacote. 

3.  Erro 2: Suspeitamos que o repositório universe estava desativado. Não estava. 

4.  Erro 3: Descobrimos um erro de certificado do repositório magalu.cloud, que estava quebrando o apt update. 

5.  Solução 3: Desativei o repositório do Magalu (sudo nano /etc/apt/sources.list.d/magalu.list e comentei a linha). 

6.  Erro 4: Mesmo com o apt funcionando, o pacote intel-media-driver... não existia. 

A Descoberta (O Nome Errado!) 

Depois de horas, descobri o problema: o nome do pacote estava errado! 

Rodei apt-cache search va-api e encontrei o nome correto: intel-media-va-driver. 

Rodei apt-cache policy intel-media-va-driver e... 

intel-media-va-driver: 

Instalado: 22.3.1+dfsg1-1ubuntu2 

O driver JÁ ESTAVA INSTALADO O TEMPO TODO! 

A única coisa que faltava era o utilitário de teste: 

Bash 

sudo apt install vainfo 

Rodei vainfo e... sucesso! O hardware estava pronto. O OBS (depois de reiniciado) finalmente mostrou a opção Codificador FFmpeg VAAPI. 

Resultado da Fase 1: CPU aliviado, sem sobrecarga de codificação. 

# Capítulo 2: A Traição - O Segundo Vilão (USB Autosuspend) Eu estava pronto para comemorar. Mudei o codificador para FFmpeg VAAPI, cliquei em "Gravar" e... 

O ÁUDIO AINDA ESTAVA INUTILIZÁVEL! 💀 

Não eram mais os "micro-picotes" de CPU. Eram "apagões". Silêncios de 1 segundo. 

A Revelação nos Logs 

Frustrado, comecei a investigar os logs do kernel: 

Bash 

sudo dmesg | grep -i usb 

E encontrei isso: 

usb 3-1: USB disconnect, device number 5 

usb 3-1: new full-speed USB device number 6 using xhci_hcd 

usb 3-1: New USB device found, idVendor=08bb, idProduct=2902 

WTF?! O microfone estava sendo desconectado e reconectado pelo Linux constantemente! 

Identificando o BM-800 

Bash lsusb | grep "08bb:2902" 

# Bus 003 Device 005: ID 08bb:2902 Texas Instruments PCM2902 Audio Codec 

O BM-800 USB usa um chip Texas Instruments PCM2902 . E descobri que esse chip tem um problema conhecido no Linux: sofre com USB autosuspend .

O Que é USB Autosuspend? 

É um recurso de economia de energia do kernel Linux. A ideia é: 

● Dispositivo USB sem uso por 2 segundos → kernel desliga ele 

● Dispositivo precisa trabalhar → kernel religa ele 

Na prática : O kernel desligava o microfone no meio da gravação! E o pior: num notebook PLUGADO NA TOMADA. Obrigado, kernel. 

# Capítulo 3: A Solução Definitiva (O Script Udev) 🎯 

A solução era óbvia: desabilitar o autosuspend para este dispositivo específico. 

Script Definitivo: Desabilitar USB Autosuspend 

Criei um script que resolve de forma persistente: 

Bash 

#!/bin/bash 

# Script: correcao_usb.sh echo "============================================" 

echo " CORREÇÃO - DESCONEXÕES USB DO MICROFONE" 

echo "============================================" 

echo "" 

# 1. Identificar o microfone 

echo "[1/4] Identificando microfone (08bb:2902)..." 

DEVICE=$(lsusb | grep "08bb:2902" )

if [ -z "$DEVICE " ]; then 

echo "❌ Microfone (08bb:2902) não encontrado!" 

exit 1

fi 

echo "✓ Encontrado: $DEVICE "

echo "" 

# 2. Criar regra udev PERSISTENTE 

echo "[2/4] Criando regra udev para desabilitar autosuspend..." 

sudo tee /etc/udev/rules.d/50-usb-audio-fix.rules > /dev/null << 'EOF' 

# Desabilitar autosuspend para BM-800 (TI PCM2902) 

ACTION== "add" , SUBSYSTEM== "usb" , ATTR{idVendor}== "08bb" , ATTR{idProduct}== "2902" ,TEST== "power/control" , ATTR{power/control}= "on" 

ACTION== "add" , SUBSYSTEM== "usb" , ATTR{idVendor}== "08bb" , ATTR{idProduct}== "2902" ,TEST== "power/autosuspend" , ATTR{power/autosuspend}= "-1" 

ACTION== "add" , SUBSYSTEM== "usb" , ATTR{idVendor}== "08bb" , ATTR{idProduct}== "2902" ,TEST== "power/autosuspend_delay_ms" , ATTR{power/autosuspend_delay_ms}= "-1" 

EOF 

echo "✓ Regra criada" 

echo "" 

# 3. Recarregar regras udev 

echo "[3/4] Recarregando regras udev..." 

sudo udevadm control --reload-rules 

sudo udevadm trigger 

echo "✓ Regras recarregadas" 

echo "" 

# 4. Aplicar IMEDIATAMENTE ao dispositivo atual 

echo "[4/4] Aplicando configuração ao dispositivo atual..." 

for device in /sys/bus/usb/devices/*/; do 

if [ -f "$device /idVendor" ] && [ -f "$device /idProduct" ]; then 

vendor=$(cat "$device /idVendor" )

product=$(cat "$device /idProduct" )

if [ "$vendor " = "08bb" ] && [ "$product " = "2902" ]; then # Desabilitar autosuspend 

echo "on" | sudo tee "$device /power/control" > /dev/null 

echo "-1" | sudo tee "$device /power/autosuspend" > /dev/null 2>&1 

echo "-1" | sudo tee "$device /power/autosuspend_delay_ms" > /dev/null 2>&1 

echo "✓ Autosuspend desabilitado para BM-800" 

fi 

fi 

done 

echo "" 

echo "============================================" 

echo " CONFIGURAÇÃO CONCLUÍDA" 

echo "============================================" 

echo "IMPORTANTE: DESCONECTE e RECONECTE o microfone" 

echo "" 

Como Usar: 

Bash 

# 1. Salvar o script 

nano correcao_usb.sh 

# 2. Dar permissão 

chmod +x correcao_usb.sh 

# 3. Executar 

./correcao_usb.sh 

# 4. Reconectar o microfone (desplugue, aguarde 5s, plugue de volta) 

Resultado: O áudio ficou CONTÍNUO . Zero picotes. Zero "apagões". 

# Capítulo 4: O Polimento - "Parece que Estou Num Banheiro" 🚽 🎤 O áudio finalmente estava contínuo, mas agora tinha outro problema: reverberação .

O BM-800 é um microfone condensador . Ele capta TUDO: 

● Som da sua voz ✓ 

● Eco da parede ✗

● Barulho do teclado ✗

Com o áudio funcionando, agora os filtros do OBS fariam diferença! 

Filtros no OBS (A Ordem Importa!) 

Apliquei os filtros no OBS nesta sequência exata: 

1. Noise Suppression (RNNoise) - Remove Ruído de Fundo 

Método: RNNoise (boa qualidade, baixo uso de CPU) 

O que faz: Remove ruído constante (ventilador, PC, ar condicionado). 

2. Noise Gate - Remove Som Quando Você Não Está Falando 

Close Threshold: -50 dB 

Open Threshold: -45 dB 

Attack Time: 25ms 

Hold Time: 200ms 

Release Time: 150ms O que faz: Corta o áudio quando você não está falando (elimina respiração, teclado). 

3. Compressor - Equaliza o Volume 

Ratio: 3:1 

Threshold: -18 dB 

Attack: 6ms 

Release: 60ms 

O que faz: Volume consistente (você não grita nem sussurra). 

4. Limiter - Proteção Contra Picos 

Threshold: -6 dB 

O que faz: Impede que o áudio "estoure" (distorça). 

Resultado: De áudio amador pra qualidade de podcast!  🎙 

# Capítulo 5: A Configuração Perfeita (Unindo Tudo) 

Depois de 8 horas de batalha contra dois vilões (CPU e USB), esta é a configuração de ouro: 

Arquivo → Configurações → Saída → Modo Avançado → Gravação: Ini, TOML 

Formato de gravação: Matroska Video (.mkv) 

└─ (Ative "Converter automaticamente para mp4" em Avançado) 

Encoder de Vídeo: FFmpeg VAAPI H.264 

└─ (Usa a GPU Intel, libera o CPU) 

Encoder de Áudio: FFmpeg Opus 

└─ Bitrate: 160 kbps (ótimo para voz) 

Arquivo → Configurações → Áudio: 

Ini, TOML 

Taxa de Amostragem: 48 kHz (padrão profissional) 

Canais: Estéreo 

Áudio do microfone: PCM2902 Audio Codec Monofônico analógico 

# Epílogo: O Que Aprendi Nessa Jornada 

1. A Lição das 8 Horas 

Foram duas sagas de 4 horas: 

1.  A Batalha do apt: Uma luta contra o apt, pacotes com nomes errados e certificados quebrados, só para descobrir que o driver intel-media-va-driver já estava lá. A solução foi mudar o codificador do OBS para FFmpeg VAAPI .

2.  A Batalha do Kernel: Uma luta contra os logs do dmesg, para descobrir que o vilão real era o USB Autosuspend . A solução foi o script udev .

Moral: O problema raramente é um só. Eu estava com dois problemas independentes que causavam o mesmo sintoma (áudio picotado). 

2. O Problema Quase Nunca É Onde Você Acha Que É 

Gastei 4 horas mexendo em configurações do OBS e apt. O problema? Kernel desligando o USB. Nada a ver com áudio, era power management! 

Moral da história: investigue os logs . A resposta está lá. 

3. Linux Te Obriga a Entender Como as Coisas Funcionam 

No Windows, o áudio funcionava "magicamente". No Linux, tive que aprender sobre: 

● Codificação de software (x264) vs. Hardware (VAAPI) 

● O inferno que é o apt quando um PPA quebra 

● Gerenciamento de energia do Kernel (USB Autosuspend) 

● Regras udev 

● Chips de áudio (TI PCM2902) 

Isso te torna um profissional melhor. Quando algo quebrar em produção, você sabe onde procurar. 

4. Documentar Ajuda Todo Mundo 

Quando você resolve um problema obscuro no Linux, documente! A próxima pessoa com o mesmo problema vai te agradecer eternamente. 

# TL;DR (Para os Apressados) 📝 Seu áudio do BM-800 no Linux está picotando? São dois problemas :

1⃣ Problema 1: Sobrecarga de CPU 

O OBS usa x264 (CPU) por padrão. 

Solução: Mude para aceleração de hardware. 

Configurações > Saída > Gravação > Codificador: FFmpeg VAAPI H.264 

(Se não aparecer, sua saga do apt começa...) 

2⃣ Problema 2: USB Autosuspend (O Vilão Principal) 

O Linux desliga seu microfone (chip PCM2902) para economizar energia. 

Solução: Desative isso com um script udev. 

(Use o script do "Capítulo 3" deste post) 

3⃣ Problema 3: Áudio de Banheiro 

O microfone é condensador e capta eco. 

Solução: Use filtros no OBS (Nessa ordem): 

1. Noise Suppression (RNNoise) 

2. Noise Gate 

3. Compressor 

4. Limiter