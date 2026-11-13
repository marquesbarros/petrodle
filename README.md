# Petrodle

Jogo educativo de identificação mineralógica no navegador. Um único desafio: **observar a fotografia do mineral e tentar identificar a espécie**. Há desafio diário e treino livre, sem limite de palpites.

## Jogar

O site é estático e funciona com o arquivo `index.html`, sem backend ou instalação.

Endereço: https://marquesbarros.github.io/petrodle/

## Modos de execução

- **Diário:** a mesma espécie para os jogadores na data local do navegador. A fotografia permanece visível e sem filtros durante todo o desafio. Uma dica opcional é liberada a cada três palpites.
- **Treino:** desafios adicionais com escolha aleatória, possibilidade de trocar mineral, tentativas livres e as mesmas dicas opcionais.

A tela apresenta a imagem integral, o campo para inserir palpites, as tentativas anteriores e, após o acerto, a ficha mineralógica completa. A coleção de descobertas é mantida no armazenamento local do navegador.

O sorteio inclui apenas espécies com fotografia nominalmente identificada. Sempre que possível, mantém o mineral já estabelecido para os desafios diários anteriores. Espécies sem fotografia específica continuam consultáveis no catálogo e disponíveis como opções de palpite.

## Banco mineralógico e fotográfico

- 152 espécies jogáveis e consultáveis.
- 145 espécies com fotografia identificada nominalmente na fonte, elegíveis como resposta do desafio por imagem.
- 7 espécies com imagens ilustrativas de grupo (não elegíveis como resposta visual).
- Algumas fotografias externas do Wikimedia Commons dependem de acesso à internet.

**Atenção aos direitos:** fotomicrografias atribuídas a Heinrich T. Frank, UFRGS (2018), possuem autorização descrita para uso **não comercial**. Fotografias externas possuem licenças próprias. O fato de o repositório estar público não libera reutilização comercial das imagens. Veja `DIREITOS.md` e `AUDITORIA.md`.

## Desenvolvimento e testes

O código do jogo e o catálogo jogável estão incorporados em `index.html`. Para abrir localmente, basta acessar esse arquivo no navegador.

As tabelas de origem, auditoria e testes automatizados estão incluídos no repositório. Requer Node.js para a verificação:

```bash
node tests/photos.test.cjs index.html
node tests/daily-and-clues.test.cjs index.html
node tests/single-image-mode.test.cjs index.html
```

## Publicação

Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, selecione **main** e a pasta **/(root)** e clique em **Save**. O arquivo `.nojekyll` evita o processamento Jekyll.
