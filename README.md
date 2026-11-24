# Petrodle

Jogo de identificação mineralógica desenvolvido para **revisar conhecimentos sobre minerais, suas propriedades e seus contextos geológicos**. As atividades propõem comparação de atributos, observação de fotomicrografias e interpretação de descrições ópticas.

**[Jogar](https://marquesbarros.github.io/petrodle/)** · **[Uso em aula](docs/USO_EM_AULA.md)** · **[Arquitetura](docs/ARQUITETURA.md)** · **[Referências](docs/REFERENCIAS.md)**

## O que foi desenvolvido

- **Três modos de identificação:** Clássico, Imagem e Descrição.
- **152 alvos jogáveis**, além dos verbetes de consulta.
- **Três dificuldades.** Fácil com 15 alvos centrados em formadores de rocha, Médio com 45 e Difícil com todo o catálogo jogável. [Critérios e listas](docs/DIFICULDADES.md)
- **Desafios diários e partidas de treino**, com progresso independente por modalidade e dificuldade.
- **Fichas mineralógicas, coleção de descobertas e compartilhamento de resultados.**
- **Rastreabilidade das imagens.** Há registro fotográfico nominal para 145 espécies, incluindo fotomicrografias e fotografias de amostras macroscópicas. Outras 7 têm imagens ilustrativas de grupo.

| Modo | Mecânica | Tentativas |
| --- | --- | --- |
| Clássico | Comparação de 11 propriedades químicas, cristalográficas e ópticas | Ilimitadas |
| Imagem | Identificação a partir de duas fotomicrografias | Até 10 |
| Descrição | Identificação por pistas textuais | Até 10 |

A cada três palpites, uma dica pode ser revelada. A terceira dica traz a fórmula química e fica disponível após o nono palpite. O catálogo e as fichas exibem os índices como subscritos e as cargas iônicas como sobrescritos. Partidas salvas com oito erros podem continuar até o novo limite de dez tentativas.

O modo Imagem exige duas fotomicrografias nominais distintas e prioriza as combinações PPL/XPL registradas. A interface informa a iluminação quando conhecida. As duas imagens podem mostrar campos diferentes.

| Dificuldade | Clássico | Imagem | Descrição |
| --- | ---: | ---: | ---: |
| Fácil | 15 | 12 | 13 |
| Médio | 45 | 34 | 40 |
| Difícil | 152 | 84 | 139 |

## Implementação

| Área | Solução |
| --- | --- |
| Aplicação | HTML, CSS e JavaScript |
| Lógica, interface e persistência | `src/` |
| Catálogo e calendário | `data/catalog.js` e `data/daily-versions.js` |
| Fotomicrografias locais | `assets/minerals/` |
| Estilos | `game.css` |
| Persistência | Armazenamento local do navegador |
| Hospedagem | GitHub Pages |
| Testes | Node.js 22 e GitHub Actions |
| Servidor | Sem backend e sem autenticação |

O jogo funciona diretamente no navegador, sem instalação, conta ou serviços de armazenamento remoto para salvar partidas. A publicação estática dispensa compilação.

## Verificação

Os testes automatizados verificam regras de identificação, seleção por dificuldade, desafios diários, pistas, fotografias, estados do jogo e elementos da interface.

O workflow [`tests.yml`](.github/workflows/tests.yml) roda a suíte com `node --test` e confere os inventários gerados. Os comandos de auditoria, manutenção e teste em navegador estão em [Arquitetura](docs/ARQUITETURA.md).

Para executar o jogo localmente, abra `index.html` em um navegador ou utilize um servidor estático.

## Conteúdo e referências

A principal fonte mineralógica é **Frank (2018), *Guia de Minerais Transparentes ao Microscópio Petrográfico* (UFRGS)**. Outras imagens têm origem no Wikimedia Commons.

Os dados foram organizados para estudo. A identificação depende do contexto petrográfico e pode exigir análises complementares.

As fotografias do guia Frank têm autorização de **uso não comercial**. A autoria, as licenças e as pendências das imagens estão registradas em [Referências](docs/REFERENCIAS.md), [Auditoria](AUDITORIA.md) e [Direitos](DIREITOS.md).

## Estado do projeto

O [registro fotográfico v0.8](AUDITORIA.md) é um marco documentado. O estado exato do código é identificado pelo [histórico de commits](https://github.com/marquesbarros/petrodle/commits/main).

O [acervo por imagem](data/acervo.csv) e a [auditoria do catálogo](docs/AUDITORIA_DO_CATALOGO.md) são gerados a partir do catálogo em uso. A licença do software segue em aberto.

O desenvolvimento teve apoio do **Codex (OpenAI)**; as versões dos modelos das sessões anteriores não estão registradas. A documentação foi revisada com **ChatGPT GPT-6** em 16/11/2026.

[Histórico e desenvolvimento assistido](docs/HISTORICO_E_DESENVOLVIMENTO.md) · [Documentação técnica](docs/ARQUITETURA.md)

Contato para sugestões e correções: [marquesbarros.geo@gmail.com](mailto:marquesbarros.geo@gmail.com).
