# Petrodle v0.8.1

Jogo educativo de identificação mineralógica no navegador. Quatro modos de jogo: **Clássico**, **Silhueta**, **Pixel** e **Descrição**. Desafios diários e treinamento livre.

## Jogar

O site é estático e funciona com o arquivo `index.html`, sem backend ou instalação.

Endereço previsto após ativar GitHub Pages: https://marquesbarros.github.io/petrodle/

## Publicação

Em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, selecione **main** e a pasta **/(root)** e clique em **Save**. O arquivo `.nojekyll` evita o processamento Jekyll.

## Banco mineralógico e fotográfico

- 152 espécies jogáveis.
- 145 espécies com fotografia identificada nominalmente na fonte.
- 7 espécies apresentam imagens ilustrativas de grupo, sinalizadas no jogo.
- Algumas imagens externas do Wikimedia Commons dependem de acesso à internet.

**Atenção aos direitos:** fotomicrografias atribuídas a Heinrich T. Frank, UFRGS (2018), possuem autorização descrita para uso **não comercial**. Fotografias externas possuem licenças próprias. O fato de o repositório estar público não libera reutilização comercial das imagens. Veja `DIREITOS.md` e `AUDITORIA.md`.

## Desenvolvimento

O código do jogo e o catálogo jogável estão incorporados em `index.html`. Para abrir localmente, basta acessar esse arquivo no navegador.

As tabelas de origem, a auditoria e os testes automatizados fazem parte do pacote v0.8.1. Para executar os testes localmente:

```bash
node tests/photos.test.cjs index.html
node tests/daily-and-clues.test.cjs index.html
```

## Atualização 0.8.1

- Data local do navegador nos desafios diários, inclusive na virada do dia em páginas abertas.
- Correção do escape de nomes com caracteres especiais nas pistas.
- Catálogo, imagens e quatro modos preservados.
