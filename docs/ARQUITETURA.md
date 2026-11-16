# Arquitetura e infraestrutura do Petrodle

**Escopo:** descrição verificável da distribuição publicada na branch `main`, em 16/11/2026. A documentação descreve o código versionado, não garante o estado de caches, navegadores de terceiros ou serviços externos.

## Visão geral

O Petrodle é uma aplicação **web estática**, executada no navegador e publicada pelo **GitHub Pages**. A árvore pública consultada não possui `package.json`, backend, banco de dados remoto nem pipeline obrigatório de compilação. A ausência desses componentes na distribuição não prova a inexistência de ferramentas privadas utilizadas durante a criação.

| Camada | Tecnologia / responsabilidade |
| --- | --- |
| Interface | HTML5, CSS e JavaScript executado no navegador |
| Entrada principal | `index.html`: estrutura, catálogo incorporado e lógica de jogo |
| Estilo adicional | `game.css` |
| Imagens e elementos de apresentação | `crystal-world.svg`, `thin-section-field.svg` e fotomicrografias referenciadas pelo catálogo |
| Rastreabilidade visual | `data/fotografias.csv` e `data/fotos_pendentes.json` |
| Persistência de partidas | Armazenamento local do navegador; sem conta ou sincronização entre dispositivos |
| Hospedagem | GitHub Pages, branch `main`, diretório `/(root)` |
| Automação | GitHub Actions, workflow `.github/workflows/tests.yml` |
| Testes | Scripts `tests/*.test.cjs` executados com Node.js |

## Organização e fluxo

1. O navegador carrega `index.html`, `game.css` e os recursos gráficos necessários.
2. A modalidade (**Clássico**, **Imagem** ou **Descrição**) e a dificuldade determinam quais espécies e pistas são elegíveis.
3. O desafio diário e a modalidade de treino usam as regras de seleção e de comparação implementadas no cliente.
4. Palpites e progresso são mantidos localmente. Não há conta de usuário nem base remota de resultados.
5. As fichas mineralógicas e as fotomicrografias devem conservar as condições de atribuição e acesso de cada fonte. Recursos externos, como imagens do Wikimedia Commons, podem depender de rede.

O catálogo informado pelo [README](../README.md) contém 152 espécies. A auditoria [AUDITORIA.md](../AUDITORIA.md) registra 145 com fotomicrografias nominalmente identificadas e 7 com ilustrações de grupo. Essa classificação não equivale a uma validação mineralógica independente de todas as imagens.

## Executar localmente

Abra `index.html` em um navegador atual ou sirva os arquivos por um servidor HTTP estático. O projeto não requer uma instalação de pacotes npm para executar o jogo.

## Testar

O workflow do GitHub Actions fixa **Node.js 22** com `actions/setup-node@v4` e `actions/checkout@v4`. A árvore pública oferece:

```sh
node tests/photos.test.cjs index.html
node tests/daily-and-clues.test.cjs index.html
node tests/three-modes.test.cjs index.html
node tests/ppl-xpl.test.cjs index.html
node tests/difficulty.test.cjs index.html
node tests/landing-and-credits.test.cjs index.html
node tests/visual-theme.test.cjs
```

Os testes automatizados verificam comportamentos, regras e consistência estrutural. Eles **não** provam identificação mineralógica, segurança de direitos de terceiros ou disponibilidade de imagens hospedadas externamente.

## Dependências, licenciamento e limitações

- A execução normal depende de um navegador compatível e, para imagens externas, da disponibilidade da origem.
- O Node.js é ferramenta de desenvolvimento/testes, não backend do jogo.
- O repositório público examinado **não apresenta arquivo `LICENSE`**. A publicidade do código não equivale, por si, a concessão de licença de reutilização.
- O guia de Heinrich T. Frank contém condições de **uso não comercial** das imagens. As licenças de arquivos do Commons variam por item. Consulte [DIREITOS.md](../DIREITOS.md) e [AUDITORIA.md](../AUDITORIA.md).
- Referências científicas: [REFERENCIAS.md](REFERENCIAS.md). Linhagem de versões e desenvolvimento assistido: [HISTORICO_E_DESENVOLVIMENTO.md](HISTORICO_E_DESENVOLVIMENTO.md).
