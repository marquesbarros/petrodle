# Arquitetura do Petrodle

Aplicação web estática, executada no navegador e hospedada no GitHub Pages.

## Infraestrutura

| Componente | Implementação |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| Entrada principal | `index.html` (interface, dados e lógica) |
| Estilos | `game.css` |
| Elementos gráficos | `crystal-world.svg` e `thin-section-field.svg` |
| Catálogo de fotografias | `data/fotografias.csv` |
| Fotografias pendentes | `data/fotos_pendentes.json` |
| Persistência | Armazenamento local do navegador |
| Hospedagem | GitHub Pages, `main`, diretório `/(root)` |
| Testes e integração contínua | Node.js 22 e GitHub Actions |

Não há backend, banco de dados remoto, autenticação nem etapa obrigatória de compilação na distribuição publicada.

## Funcionamento

1. O navegador carrega a interface e o catálogo.
2. O modo e a dificuldade definem os minerais elegíveis.
3. O jogo compara os palpites com propriedades, descrições ou imagens da espécie selecionada.
4. As partidas e as descobertas são salvas localmente.

O jogo oferece os modos Clássico, Imagem e Descrição, com desafios diários e de treino. Fotografias externas podem exigir conexão com a internet.

## Execução e testes

Para jogar localmente, abra `index.html`.

O workflow `.github/workflows/tests.yml` executa os seguintes testes com Node.js 22:

```sh
node tests/photos.test.cjs index.html
node tests/daily-and-clues.test.cjs index.html
node tests/three-modes.test.cjs index.html
node tests/ppl-xpl.test.cjs index.html
node tests/difficulty.test.cjs index.html
node tests/landing-and-credits.test.cjs index.html
node tests/visual-theme.test.cjs
```

Os testes cobrem regras e integridade do jogo, mas não validam a identificação mineralógica de cada fotografia.

## Dados e licenças

O projeto utiliza fotografias do guia Frank (UFRGS, 2018) sob autorização de **uso não comercial** e imagens do Wikimedia Commons com licenças individuais. O repositório não apresenta um arquivo `LICENSE` para o código.

Consulte [Referências](REFERENCIAS.md), [Auditoria](../AUDITORIA.md), [Direitos de imagem](../DIREITOS.md) e [Histórico](HISTORICO_E_DESENVOLVIMENTO.md).
