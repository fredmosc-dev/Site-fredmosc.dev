---
title: "A Saga do BM-800 no Linux: 8 Horas, 2 Vilões e 1 Final Feliz 🎤🐧"
excerpt: "Funcionava no Windows na mesma máquina. No Linux? Bem... essa é a história de duas sagas que pareciam uma só."
date: "2025-11-16"
category: "Arquitetura"
tags: ["Linux", "PulseAudio", "OBS", "#Audio", "#Ubuntu"]

---

# A Saga do BM-800 no Linux: 8 Horas, 2 Vilões e 1 Final Feliz 🎤🐧

> _"Funcionava no Windows na mesma máquina. No Linux? Bem... essa é a história de duas sagas que pareciam uma só."_

## Prólogo: Eu Só Queria Gravar Uns Vídeos

Olha, eu não sou engenheiro de áudio. Eu só tinha um problema simples:

**Os vídeos que eu gravava no OBS tinham áudio HORRÍVEL.**

Picotes. Silêncios aleatórios. "Chiados" digitais. Sabe aquele áudio de tutorial de YouTube feito por uma criança de 10 anos gritando no microfone? Exatamente isso.

E o pior: **o mesmo microfone funcionava PERFEITAMENTE na mesma máquina com Windows!**

### 🖥️ Meu Setup

|**Componente**|**Especificação**  |
|--|--|
|Hardware  | Dell Inspiron (notebook) i7 13ª geração, 32GB RAM |
|Sistema Operacional  | Ubuntu 22.04 LTS |
|Microfone  | BM-800 USB (chip Texas Instruments PCM2902) |
|Software  | OBS Studio v30+ (para websocket nativo) |

Então comecei a saga. Uma saga que, somando as duas frentes de batalha, durou quase **4 horas**.

----------

## Capítulo 1: O Primeiro Vilão - Sobrecarga de CPU (A Saga de 2 Horas)

Minha primeira jornada de 2 horas foi focada no OBS, achando que o problema estava lá.

### 🎚️ Fase 1: O "Áudio Estourado" (Clipping)

O primeiro teste mostrou o áudio "estourando" (batendo no vermelho).

|Plataforma  | Resultado |
|--|--|
|✅ **Google Meet**  | Áudio perfeito  |
|❌ **OBS** | Áudio distorcido |

O Meet aplica filtros automáticos (Controle de Ganho). O OBS estava capturando o áudio "cru", que estava com o **ganho de entrada muito alto** no Linux.

> **💡 Solução:** Reduzi o ganho de entrada do microfone nas configurações de som do Linux até o medidor do OBS ficar na faixa amarela (-15dB).

### 🎬 Fase 2: O "Áudio Picotado" (Sobrecarga de CPU)

O áudio parou de estourar, mas agora tinha picotes grosseiros (falhas de 1 segundo). O painel "Estatísticas" do OBS foi claro: **"Quadros perdidos devidos à demora na codificação"**.

#### 🔍 Diagnóstico

Meu i7 de 13ª Geração (um monstro!) estava sobrecarregado. O OBS estava usando o codificador de software (`x264`) para comprimir o vídeo 1080p e, na falta de "fôlego", ele "jogava fora" pacotes de áudio.

#### ⚡ A Solução Lógica

Parar de usar o CPU e usar a placa de vídeo integrada (Intel Iris Xe) através da aceleração de hardware: **`FFmpeg VAAPI`**.

### 📦 Fase 3: A Caça ao "Pacote Fantasma" (O Inferno do `apt`)

Aqui a jornada de 2 horas realmente começou. A opção `FFmpeg VAAPI` simplesmente não aparecia no OBS.

#### 🔄 A Saga dos Erros

| Tentativa |Problema | Status | |-----------|----------|--------| |  **1**  | Faltava o driver `intel-media-driver`  | ❌ `E: Impossível encontrar o pacote`  | |  **2**  | Repositório `universe` desativado? | ❌ Estava ativo | |  **3**  | Erro de certificado do repositório `magalu.cloud`  | ✅ Desativei o repositório | |  **4**  | Pacote `intel-media-driver` não existe | 🤔 Nome errado! |

| Tentativa | Problema | Status |
| :--- | :--- | :--- |
| **1** | Faltava o driver `intel-media-driver` | ❌ `E: Impossível encontrar o pacote`  | |
| **2** | Repositório `universe` desativado? | ❌ Estava ativo |
| **3** | Erro de certificado em um repositório  | ✅ Desativei o repositório |
| **4** | Pacote `intel-media-driver` não existe | 🤔 Nome errado! |

🤔 Nome errado!

### 🎯 A Descoberta (O Nome Errado!)

Depois de horas, descobri o problema: o nome do pacote estava errado!

```bash
apt-cache search va-api

```

Encontrei o nome correto: **`intel-media-va-driver`**

```bash
apt-cache policy intel-media-va-driver

```

```
intel-media-va-driver:
  Instalado: 22.3.1+dfsg1-1ubuntu2

```

**O driver JÁ ESTAVA INSTALADO O TEMPO TODO!**

A única coisa que faltava era o utilitário de teste:

```bash
sudo apt install vainfo

```

Rodei `vainfo` e... sucesso! O hardware estava pronto. O OBS (depois de reiniciado) finalmente mostrou a opção `Codificador FFmpeg VAAPI`.

> **✅ Resultado da Fase 1:** CPU aliviado, sem sobrecarga de codificação.

----------

## Capítulo 2: A Traição - O Segundo Vilão (USB Autosuspend)

Eu estava pronto para comemorar. Mudei o codificador para `FFmpeg VAAPI`, cliquei em "Gravar" e...

### 💀 **O ÁUDIO AINDA ESTAVA INUTILIZÁVEL!**

Não eram mais os "micro-picotes" de CPU. Eram "apagões". Silêncios de 1 segundo.

### 🔍 A Revelação nos Logs

Frustrado, comecei a investigar os logs do kernel:

```bash
sudo dmesg | grep -i usb

```

E encontrei isso:

```
usb 3-1: USB disconnect, device number 5
usb 3-1: new full-speed USB device number 6 using xhci_hcd
usb 3-1: New USB device found, idVendor=08bb, idProduct=2902

```

**WTF?!** O microfone estava sendo **desconectado e reconectado** pelo Linux constantemente!

### 🔎 Identificando o BM-800

```bash
lsusb | grep "08bb:2902"
# Bus 003 Device 005: ID 08bb:2902 Texas Instruments PCM2902 Audio Codec

```

O BM-800 USB usa um chip **Texas Instruments PCM2902**. E descobri que esse chip tem um problema conhecido no Linux: **sofre com USB autosuspend**.

### ⚡ O Que é USB Autosuspend?

É um recurso de economia de energia do kernel Linux. A ideia é:

```mermaid
graph LR
    A[Dispositivo USB sem uso<br/>por 2 segundos] --> B[Kernel desliga]
    B --> C[Dispositivo precisa<br/>trabalhar]
    C --> D[Kernel religa]

```
|Teoria| Prática  |
|--|--|
| Economia de energia | O kernel desligava o microfone no meio da gravação! |
| Modo inteligente |Acontecia num notebook PLUGADO NA TOMADA |

**Na prática**: O kernel desligava o microfone no meio da gravação! E o pior: num notebook PLUGADO NA TOMADA. Obrigado, kernel. 🙄

----------

## Capítulo 3: A Solução Definitiva (O Script Udev) 🎯

A solução era óbvia: **desabilitar o autosuspend** para este dispositivo específico.

### 📝 Script Definitivo: Desabilitar USB Autosuspend

Com a ajuda do estagiário (Vulgo Claudinho ou Claude.AI), criei um script que resolve de forma persistente:

```bash
#!/bin/bash
# Script: correcao_usb.sh

echo "============================================"
echo "  CORREÇÃO - DESCONEXÕES USB DO MICROFONE"
echo "============================================"
echo ""

# 1. Identificar o microfone
echo "[1/4] Identificando microfone (08bb:2902)..."
DEVICE=$(lsusb | grep "08bb:2902")
if [ -z "$DEVICE" ]; then
    echo "❌ Microfone (08bb:2902) não encontrado!"
    exit 1
fi
echo "✓ Encontrado: $DEVICE"
echo ""

# 2. Criar regra udev PERSISTENTE
echo "[2/4] Criando regra udev para desabilitar autosuspend..."
sudo tee /etc/udev/rules.d/50-usb-audio-fix.rules > /dev/null << 'EOF'
# Desabilitar autosuspend para BM-800 (TI PCM2902)
ACTION=="add", SUBSYSTEM=="usb", ATTR{idVendor}=="08bb", ATTR{idProduct}=="2902", TEST=="power/control", ATTR{power/control}="on"
ACTION=="add", SUBSYSTEM=="usb", ATTR{idVendor}=="08bb", ATTR{idProduct}=="2902", TEST=="power/autosuspend", ATTR{power/autosuspend}="-1"
ACTION=="add", SUBSYSTEM=="usb", ATTR{idVendor}=="08bb", ATTR{idProduct}=="2902", TEST=="power/autosuspend_delay_ms", ATTR{power/autosuspend_delay_ms}="-1"
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
    if [ -f "$device/idVendor" ] && [ -f "$device/idProduct" ]; then
        vendor=$(cat "$device/idVendor")
        product=$(cat "$device/idProduct")
        if [ "$vendor" = "08bb" ] && [ "$product" = "2902" ]; then
            # Desabilitar autosuspend
            echo "on" | sudo tee "$device/power/control" > /dev/null
            echo "-1" | sudo tee "$device/power/autosuspend" > /dev/null 2>&1
            echo "-1" | sudo tee "$device/power/autosuspend_delay_ms" > /dev/null 2>&1
            echo "✓ Autosuspend desabilitado para BM-800"
        fi
    fi
done

echo ""
echo "============================================"
echo "         CONFIGURAÇÃO CONCLUÍDA"
echo "============================================"
echo "IMPORTANTE: DESCONECTE e RECONECTE o microfone"
echo ""

```

### 🚀 Como Usar:

```bash
# 1. Salvar o script
nano correcao_usb.sh

# 2. Dar permissão
chmod +x correcao_usb.sh

# 3. Executar
./correcao_usb.sh

# 4. Reconectar o microfone (desplugue, aguarde 5s, plugue de volta)

```

> **✅ Resultado:** O áudio ficou **CONTÍNUO**. Zero picotes. Zero "apagões".

----------

## Capítulo 4: O Polimento - "Parece que Estou Num Banheiro" 🚽🎤

O áudio finalmente estava contínuo, mas agora tinha outro problema: **reverberação**.

### 🎤 O Problema dos Microfones Condensadores

O BM-800 é um **microfone condensador**. Ele capta TUDO:

|✅ Capta  |❌ Também Capta  |
|--|--|
|Som da sua voz  |Eco da parede  |
| - | Barulho do teclado |
| - | Respiração |
| - | Ventuinha |

Com o áudio funcionando, **agora** os filtros do OBS fariam diferença!

### 🎛️ Filtros no OBS (A Ordem Importa!)

Apliquei os filtros no OBS nesta sequência exata:

#### 1️⃣ Noise Suppression (RNNoise) - Remove Ruído de Fundo

```
Método: RNNoise (boa qualidade, baixo uso de CPU)

```

**O que faz:** Remove ruído constante (ventilador, PC, ar condicionado).

----------

#### 2️⃣ Noise Gate - Remove Som Quando Você Não Está Falando

|Parâmetro| Valor  |
|--|--|
|**Close Threshold**  | -50db |
|**Open Threshold**| -45db |
|**Attack Time** | 25ms |
| **Hold Time** | 200ms |
| **Release Time ** | 150ms|

**O que faz:** Corta o áudio quando você não está falando (elimina respiração, teclado). Lembrando que esses valores se referem ao meu ambiente, cada ambiente deve ser ajustado diferentemente.

----------

#### 3️⃣ Compressor - Equaliza o Volume

|Parâmetro| Valor  |
|--|--|
|**Ratio**  | 3:1 |
|**Threshold**| -18db |
|**Attack** | 6ms |
| **Release** | 60ms|

**O que faz:** Volume consistente (você não grita nem sussurra).

----------

#### 4️⃣ Limiter - Proteção Contra Picos

```
Threshold: -6 dB

```

**O que faz:** Impede que o áudio "estoure" (distorça).

----------

> **🎙️ Resultado:** De áudio amador pra qualidade ~~quase~~ de podcast!

----------

## Capítulo 5: A Configuração Perfeita (Unindo Tudo)

Depois de 4 horas de batalha contra _dois_ vilões (CPU e USB), esta é a configuração de ouro:

### 📹 Configurações de Saída do OBS

**Arquivo → Configurações → Saída → Modo Avançado → Gravação:**

| Configuração | Valor | Motivo |
| :--- | :--- | :--- |
| **Formato de gravação**  | Matroska Video (.mkv) | Melhor para gravações longas |
|| ↳ Ative "Converter automaticamente para mp4" | Em Avançado |
|  **Encoder de Vídeo**  | FFmpeg VAAPI H.264 | Usa a GPU Intel, libera o CPU | |  **Encoder de Áudio**  | FFmpeg Opus | Ótimo para voz | 
|  | ↳ Bitrate: 160 kbps | Qualidade profissional |


|Configuração| Valor  |
|--|--|
|**Taxa de Amostragem**  | 48 kHz (padrão profissional) |
| **Canais**  | Estéreo |
|**Áudio do microfone**  | PCM2902 Audio Codec Monofônico analógico |

----------

### 🔊 Configurações de Áudio do OBS

**Arquivo → Configurações → Áudio:**

|Configuração | Valor |
|--|--|
| **Taxa de Amostragem**  | 48 kHz (padrão profissional) | 
|  **Canais**  | Estéreo | 
|  **Áudio do microfone**  | PCM2902 Audio Codec Monofônico analógico |

----------

## Epílogo: O Que Aprendi Nessa Jornada

### 1️⃣ A Lição das 4 Horas

Foram duas sagas de 2 horas:

| Saga | Duração | Vilão | Solução |
|---|---|---|---|
| **1. A Batalha do `apt`**  | 4 horas | Pacotes com nomes errados e certificados quebrados | Mudar codificador para `FFmpeg VAAPI`  | 
|  **2. A Batalha do Kernel**  | 4 horas |  `USB Autosuspend`  | Script `udev`  |


**Moral:** O problema raramente é um só. Eu estava com _dois_ problemas independentes que causavam o _mesmo sintoma_ (áudio picotado).

----------

### 2️⃣ O Problema Quase Nunca É Onde Você Acha Que É

Gastei 2 horas mexendo em configurações do OBS e `apt`. O problema? Kernel desligando o USB. Nada a ver com áudio, era power management!

> **📌 Moral da história:** investigue os logs. A resposta está lá.

----------

### 3️⃣ Linux te obriga a entender como as coisas funcionam

No Windows, o áudio funcionava "magicamente". No Linux, tive que aprender sobre:

-   ✅ Codificação de software (x264) vs. Hardware (VAAPI)
-   ✅ O inferno que é o `apt` quando um PPA quebra
-   ✅ Gerenciamento de energia do Kernel (`USB Autosuspend`)
-   ✅ Regras `udev`
-   ✅ Chips de áudio (TI PCM2902)

**Isso te torna um profissional melhor.** Quando algo quebrar em produção, você sabe onde procurar.

----------

### 4️⃣ Documentar Ajuda Todo Mundo

Quando você resolve um problema obscuro no Linux, **documente!** A próxima pessoa com o mesmo problema vai te agradecer eternamente.

----------

## 📚 Recursos Adicionais

-   [Documentação oficial do OBS Studio](https://obsproject.com/)
-   [Wiki do Arch Linux sobre PulseAudio](https://wiki.archlinux.org/title/PulseAudio)
-   [Documentação do FFmpeg VAAPI](https://trac.ffmpeg.org/wiki/Hardware/VAAPI)

----------

**Se este guia te ajudou, considere compartilhar com outros que possam estar enfrentando os mesmos problemas!**

----------
