# Petrodle

Jogo de identificação mineralógica desenvolvido para **revisar e fixar conhecimentos sobre minerais, suas propriedades e seus contextos geológicos**. O aprendizado ocorre por comparação de atributos, análise de fotomicrografias e interpretação de descrições ópticas.

**[Jogar](https://marquesbarros.github.io/petrodle/)** · **[Arquitetura](docs/ARQUITETURA.md)** · **[Referências](docs/REFERENCIAS.md)**

## O que foi desenvolvido

- **Três modos de identificação:** Clássico, Imagem e Descrição.
- **152 espécies** no catálogo de referência.
- **Três dificuldades:** Fácil (15 minerais), Médio (45) e Difícil (espécies elegíveis da base).
- **Desafios diários e partidas de treino**, com progresso independente por modalidade e dificuldade.
- **Fichas mineralógicas, coleção de descobertas e compartilhamento de resultados.**
- **Rastreabilidade das imagens:** 145 espécies com fotomicrografias nominais registradas e 7 com imagens ilustrativas de grupo.

| Modo | Mecânica | Tentativas |
| --- | --- | --- |
| Clássico | Comparação de 11 propriedades químicas, cristalográficas e ópticas | Ilimitadas |
| Imagem | Identificação a partir de duas fotomicrografias | Até 8 |
| Descrição | Identificação por pistas textuais | Até 8 |

No modo Imagem, são exigidas duas fotografias nominais da espécie. Pares PPL/XPL conferidos têm prioridade; imagens de grupo não são usadas como respostas.

## Implementação

| Área | Solução |
| --- | --- |
| Aplicação | HTML, CSS e JavaScript |
| Lógica e catálogo | `index.html` |
| Estilos | `game.css` |
| Persistência | Armazenamento local do navegador |
| Hospedagem | GitHub Pages |
| Testes | Node.js 22 e GitHub Actions |
| Servidor | Sem backend e sem autenticação |

O jogo funciona diretamente no navegador, sem instalação, conta ou serviços de armazenamento remoto para salvar partidas. A estrutura reúne interface e lógica no cliente. O projeto não exige etapa de compilação.

## Verificação

Os testes automatizados verificam regras de identificação, seleção por dificuldade, desafios diários, pistas, fotografias, estados do jogo e elementos da interface.

O workflow [`tests.yml`](.github/workflows/tests.yml) executa a suíte na branch `main` e nas solicitações de alteração. Os comandos individuais estão em [Arquitetura](docs/ARQUITETURA.md).

Para executar o jogo localmente, abra `index.html` em um navegador ou utilize um servidor estático.

## Conteúdo e referências

A principal fonte mineralógica é **Frank (2018), *Guia de Minerais Transparentes ao Microscópio Petrográfico* (UFRGS)**. Outras imagens têm origem no Wikimedia Commons.

Os dados foram organizados para estudo. A identificação depende do contexto petrográfico e pode exigir análises complementares.

As fotografias do guia Frank têm autorização de **uso não comercial**. A autoria, as licenças e as pendências das imagens estão registradas em [Referências](docs/REFERENCIAS.md), [Auditoria](AUDITORIA.md) e [Direitos](DIREITOS.md).

## Estado do projeto

O [registro fotográfico v0.8](AUDITORIA.md) é um marco documentado. O estado exato do código é identificado pelo [histórico de commits](https://github.com/marquesbarros/petrodle/commits/main).

A estrutura atual concentra boa parte da lógica e dos dados em um único HTML. O repositório não contém um arquivo `LICENSE` para o software.

O desenvolvimento teve apoio do **Codex (OpenAI)**; as versões dos modelos das sessões anteriores não estão registradas. A documentação foi revisada com **ChatGPT GPT-6** em 16/11/2026.

[Histórico e desenvolvimento assistido](docs/HISTORICO_E_DESENVOLVIMENTO.md) · [Documentação técnica](docs/ARQUITETURA.md)

Contato para sugestões e correções: [marquesbarros.geo@gmail.com](mailto:marquesbarros.geo@gmail.com).
