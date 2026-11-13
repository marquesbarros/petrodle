# Petrodle

Jogo educativo de identificação mineralógica no navegador, com três modalidades: **Clássico**, **Imagem** e **Descrição**. Cada modalidade possui desafios diários e treinamento livre.

## Jogar

Site estático, sem backend ou instalação: https://marquesbarros.github.io/petrodle/

## Modalidades

- **Clássico:** compare propriedades químicas, cristalográficas e ópticas dos minerais, com cores, indicações de proximidade e setas. As tentativas são ilimitadas, como na versão original.
- **Imagem:** observe a fotomicrografia identificada da espécie, sem silhuetas, pixelização ou revelação gradual. Tente identificar o mineral em até oito palpites. Este modo substitui Silhueta e Pixel.
- **Descrição:** identifique a espécie a partir da descrição inicial, com pistas adicionais disponíveis durante o desafio. Mantém o limite de oito palpites e a lógica anterior.

Cada modo mantém sua própria resposta diária e progresso salvo no navegador. Treino livre e pistas opcionais permanecem disponíveis, assim como o catálogo de minerais e a ficha completa ao encerrar uma partida.

## Banco mineralógico e fotográfico

- 152 espécies jogáveis e consultáveis.
- 145 espécies com fotografia identificada nominalmente no guia.
- 7 espécies com imagens ilustrativas de grupo, identificadas como tais e não elegíveis como resposta do modo Imagem.
- Algumas imagens externas do Wikimedia Commons dependem de conexão à internet.

**Direitos de uso:** as fotomicrografias atribuídas a Heinrich T. Frank, UFRGS (2018), têm autorização descrita para uso **não comercial**. Fotografias externas possuem licenças próprias. Consulte `DIREITOS.md` e `AUDITORIA.md`.

## Desenvolvimento e testes

O jogo e o catálogo estão incorporados em `index.html`. Para abrir localmente, basta usar um navegador. Com Node.js, execute:

```bash
node tests/photos.test.cjs index.html
node tests/daily-and-clues.test.cjs index.html
node tests/three-modes.test.cjs index.html
```

## Publicação

Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, selecione **main** e a pasta **/(root)**. O arquivo `.nojekyll` evita o processamento Jekyll.
