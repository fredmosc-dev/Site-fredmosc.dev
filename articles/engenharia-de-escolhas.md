---
title: "Engenharia de Escolhas: a soft skill por trás da soberania de dados"
excerpt: "Todo arquiteto sabe provisionar uma VM. O que separa o sênior é decidir com informação incompleta e deixar escrito o porquê."
date: "2026-10-10"
category: "Análise"
tags: ["Arquitetura", "ADR", "Soberania de dados", "LGPD", "Carreira sênior"]
---

# Engenharia de Escolhas: a soft skill por trás da soberania de dados

> _Palestra apresentada no DevParaná na Estrada (Ponta Grossa, 09/04/2026, e Curitiba, 11/04/2026) e no The Developers Live Weekend (Maringá, 30/05/2026)._

Você sabe onde o dado do seu sistema dorme essa noite?

Não a região no console. O endereço físico. E, junto com ele, a lei que manda naquele prédio.

Fiz essa pergunta em três palcos este ano. Dado mal arquitetado é como um assalto que você só percebe no dia seguinte. Na hora não dói. Dói quando chega a notificação da ANPD, ou quando o gestor liga num domingo perguntando por que a operação parou por causa de uma lei que ninguém do time leu.

Projeto não falha por falta de tecnologia. Falha por falta de decisão. Este texto é sobre a habilidade que ninguém ensina e todo mundo cobra quando o negócio aperta: escolher bem e deixar a escolha registrada.

## O martelo de ouro (o de 2026 se chama IA)

Quem aprende uma ferramenta muito bem começa a enxergar prego em todo lugar. É a síndrome do martelo de ouro.

O dev que quer controlar um foguete com React. O arquiteto que sobe um cluster Kubernetes de cinco nós para orquestrar três containers, "porque escala". O gestor que descobriu IA generativa e quer trocar o time de suporte inteiro na segunda-feira. Esse último eu já vi acontecer.

O martelo deste ano tem nome. A frase que todo mundo repete diz que a IA não vai tirar seu emprego, mas alguém que sabe usar IA vai. Pode até ser. Só que usar IA bem depende menos de técnica e mais de uma coisa que pouca gente treina: dar contexto.

## Com IA, existe pergunta errada

Compare dois pedidos para a mesma ferramenta.

**Pedido 1:** "Qual cloud devo usar para minha aplicação?"

**Pedido 2:** "Sou arquiteto de uma fintech brasileira com 500 mil usuários. Dados financeiros de pessoa física, LGPD obrigatória, orçamento em reais, latência abaixo de 50 ms. Qual estratégia de cloud você recomenda, considerando jurisdição legal e câmbio?"

A resposta ao primeiro vem bonita, com tópicos e tudo, e não serve para nada. O segundo muda o jogo porque carrega as restrições que definem a decisão.

Entre humanos, pergunta vaga gera resposta vaga. Com IA, pergunta vaga gera resposta vaga com a confiança de um especialista sênior. O júnior implementa, e na sexta-feira alguém explica para o gestor.

A cura do martelo passa por colocar conceito acima de ferramenta. Você continua com o martelo; só para de achar que tudo é prego. Ferramenta muda toda semana, conceito dura a carreira inteira. Menor privilégio é conceito. Latência como decisão de negócio também. E jurisdição como variável de arquitetura, que é onde este texto vai chegar.

## O elevador: a mesma decisão em três andares

Decidir bem resolve o problema técnico. Comunicar a decisão resolve o problema humano. São problemas diferentes, e pedem habilidades diferentes.

A melhor imagem que conheço para isso é a do Gregor Hohpe, no livro *The Software Architect Elevator*: o arquiteto que anda de elevador. Ele sobe à cobertura para falar de dinheiro com o CEO, desce à garagem para falar de Kubernetes com os devs e troca a linguagem em cada andar. Ninguém está sendo enganado. Cada andar tem uma dor diferente.

Veja a mesma decisão, levar o dado crítico para o Brasil, contada três vezes (números ilustrativos):

| Andar | Quem ouve | Como você diz |
|---|---|---|
| Garagem | devs | "O dado fica em região BR. A latência cai de ~180 ms para ~22 ms e o egress diminui." |
| Meio | PM, tech lead | "Provedor nacional, LGPD atendida desde o desenho, custo previsível em reais." |
| Cobertura | CEO, CFO | "Se travar lá fora, a operação não para aqui. Isso é continuidade de negócio." |

Vale também na hora de pedir orçamento. Compare:

> "Precisamos migrar porque o CLOUD Act pode comprometer nosso compliance com a LGPD mediante ordem judicial em jurisdição estrangeira."

A resposta costuma ser um "manda por e-mail", que é o jeito educado de dizer não. Agora:

> "O dado dos nossos clientes está sob uma jurisdição que não responde à lei brasileira. Numa fiscalização da ANPD, a multa pode chegar a R$ 50 milhões por infração. Me dá três meses que eu resolvo, e ainda reduzo o custo."

Mesma decisão. A segunda frase consegue o orçamento.

Comunicar abre a porta. Decidir bem define o que você faz depois que entra.

## As 3 dimensões da decisão

Hard skill diz o que é possível. Soft skill diz o que fazer.

Todo arquiteto sabe rodar `terraform apply`. O sênior aparece na hora de decidir com informação incompleta e prazo apertado. Pensa no piloto de F1: qualquer um acelera na reta. O bom decide a hora de frear debaixo de chuva, com pneu quente e adversário colado. Ele tem telemetria, desgaste e gap na tela, mas nenhum dado garante o resultado. O que decide é julgamento.

Para estruturar esse julgamento eu uso três dimensões:

- **Técnica:** latência, SLA, resiliência, compliance.
- **Negócio:** custo, lock-in, câmbio, time-to-market.
- **Contexto:** jurisdição, geopolítica, maturidade do time.

Toda decisão ruim que vi na carreira ignorou pelo menos uma delas. Quase sempre a terceira, porque ela não aparece em benchmark nem em gráfico de latência. Aparece na notificação da ANPD.

Um ponto que costuma ser mal explicado: a LGPD não deixa de valer só porque o datacenter fica em outro país. Ela continua valendo para quem trata dado de pessoas no Brasil. O problema é que outra lei passa a valer **também**. O CLOUD Act americano, por exemplo, permite que autoridades dos EUA, com ordem judicial, exijam de provedores americanos dados que eles guardam fora dos EUA. Repare que o que pesa aí é a nacionalidade do provedor, e não só a região escolhida no console. Dois ordenamentos sobre o mesmo dado entram na conta da arquitetura, junto com latência e custo.

E tem o argumento que fecha qualquer reunião melhor que LGPD e latência: dinheiro. Conta em dólar paga em real sobe com o câmbio, mesmo sem mudar uma linha da arquitetura. {{Dado com fonte: variação do dólar (PTAX, Banco Central) de 2020 até a data de publicação, e o que isso faz com a mesma fatura}}. Nenhum CFO aprova um aumento desses sem questionar a arquitetura. Melhor você questionar antes dele.

## Dois cases (fictícios, com padrões reais)

**Herança sem testamento.** O BetaBank escolheu sua cloud por decisão do gestor, sem ADR e sem o time técnico na sala. Dezoito meses depois: lacuna de LGPD, custo 60% acima do previsto e o arquiteto sênior pedindo demissão. A frase dele na saída: "Não fui ouvido na decisão, mas sou cobrado pelo resultado." Quem herda a infraestrutura não herda o porquê. E o post-mortem de decisão ruim sempre sobra para quem chegou depois.

**Processo, e não sorte.** Na GammaLog, o arquiteto conduziu um ADR com três cenários: tudo fora do Brasil, tudo nacional e híbrido. Levou ao gestor os trade-offs de cada dimensão. Escolheram o híbrido: dado crítico de brasileiros num provedor nacional, analytics onde o custo fazia mais sentido. Quando veio regulação nova e o câmbio disparou, já estavam cobertos.

## ADR: o menor documento com o maior retorno

ADR é Architecture Decision Record. Quatro campos, cinco minutos para escrever:

```markdown
# ADR-001: {{título da decisão}}

## Contexto
{{o problema, as restrições e as 3 dimensões}}

## Decisão
{{o que foi escolhido}}

## Alternativas consideradas
{{o que ficou de fora e por quê}}

## Consequências
{{o que fica mais fácil, o que fica mais difícil, o que monitorar}}
```

É esse documento que te protege quando o auditor ou o gestor perguntam: "por que vocês escolheram isso?"

Já cheguei em projeto sem nenhum ADR. É como chegar numa cidade nova sem mapa e sem ninguém que morou lá antes. Você se vira, mas perde um tempo que não precisava perder.

O mesmo raciocínio vale para o code review, onde essa habilidade aparece todo dia. No review, o objetivo é melhorar quem escreveu o código, e o código melhora junto. Pergunte e sugira antes de afirmar. É engenharia de escolhas aplicada a um PR.

Quem documenta decisão cresce mais rápido: o erro vira aprendizado registrado, e não vergonha silenciosa que se repete no próximo projeto.

## Para levar

- Cuidado com o martelo de ouro, principalmente quando ele se chama IA.
- Com IA existe, sim, pergunta errada: a que vem sem contexto.
- Ande de elevador. Comunique por andar, não por cargo.
- Técnica, negócio e contexto. Ignore uma dimensão e você paga a conta.
- ADR é o menor artefato com o maior retorno da sua carreira.
- Soberania de dados começa no refinamento. Começa com você.

Hard skills te dão o emprego. Soft skills constroem a sua carreira.

---

Se este texto te lembrou de uma decisão sem ADR no seu projeto, manda para quem vai herdar ela.
