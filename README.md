# Petrodle

Jogo de identificação mineralógica para **revisar e fixar conhecimentos sobre minerais**, suas propriedades e seus contextos geológicos. A identificação é feita por comparação de atributos, fotomicrografias ou descrições ópticas.

**[Jogar Petrodle](https://marquesbarros.github.io/petrodle/)**

## Como jogar

1. Selecione a dificuldade: **Fácil** (15 minerais), **Médio** (45) ou **Difícil** (todas as espécies elegíveis).
2. Escolha o modo de jogo.
3. Digite o nome de um mineral e confirme o palpite.
4. Use as pistas e comparações para chegar à resposta.
5. Ao terminar, consulte a ficha mineralógica.

Há desafios **diários** para cada combinação de modo e dificuldade. O modo **Treino** permite jogar outras partidas.

## Modos

| Modo | Como funciona | Tentativas |
| --- | --- | --- |
| **Clássico** | Compara 11 propriedades químicas, cristalográficas e ópticas a cada palpite. | Ilimitadas |
| **Imagem** | Apresenta duas fotomicrografias da espécie. | Até 8 |
| **Descrição** | Apresenta uma pista inicial e outras pistas opcionais. | Até 8 |

No modo Clássico, verde indica correspondência, amarelo indica correspondência parcial, vermelho indica diferença e cinza indica falta de dados. As setas ↑ e ↓ orientam a comparação de valores ordenáveis. Uma dica opcional é oferecida a cada três palpites.

No modo Imagem, são usadas apenas espécies com duas fotomicrografias nominais verificadas. Pares PPL/XPL conferidos têm prioridade, mas nem todas as imagens formam um par óptico. Por isso, as fotografias não recebem rótulos PPL/XPL automaticamente.

## Catálogo

A base reúne **152 espécies**, com informações sobre propriedades mineralógicas e imagens de referência. Dessas, **145** têm fotomicrografias nominais registradas e **7** utilizam imagens ilustrativas de grupo. Estas últimas não são sorteadas como resposta no modo Imagem.

O nome coletivo **biotita** pode ser usado como palpite, mas não é sorteado como espécie-resposta.

A identificação mineralógica depende do contexto petrográfico. As fichas são material de estudo, não substituem análises laboratoriais.

## Recursos

- Catálogo consultável conforme a dificuldade selecionada.
- Busca por nome, seleção por teclado e dicas opcionais.
- Coleção de espécies descobertas.
- Compartilhamento de resultados sem revelar a resposta.
- Progresso salvo no navegador, sem conta ou sincronização entre dispositivos.

## Infraestrutura

| Componente | Implementação |
| --- | --- |
| Aplicação | HTML, CSS e JavaScript; execução no navegador |
| Interface e lógica | `index.html` e `game.css` |
| Hospedagem | GitHub Pages, branch `main` |
| Dados locais | Armazenamento do navegador |
| Testes | Node.js 22 e GitHub Actions |
| Servidor | Não há backend no repositório publicado |

Para executar localmente, abra `index.html`. Para verificar os testes, use os comandos descritos em [Arquitetura](docs/ARQUITETURA.md).

## Referências e direitos de uso

O conteúdo mineralógico parte do *Guia de Minerais Transparentes ao Microscópio Petrográfico*, de **Heinrich T. Frank (UFRGS, 2018)**. O acervo de imagens também inclui registros do Wikimedia Commons.

As fotomicrografias do guia Frank têm autorização de **uso não comercial**. Para atribuições e condições de reutilização, consulte [Referências](docs/REFERENCIAS.md), [Auditoria de imagens](AUDITORIA.md) e [Direitos de imagem](DIREITOS.md).

## Versões e desenvolvimento

O documento de auditoria registra o marco **v0.8**. Para identificar o estado exato do código, use o histórico de commits.

O desenvolvimento contou com apoio do **Codex (OpenAI)**. As versões dos modelos usados nas sessões anteriores não estão documentadas. A revisão documental de 16/11/2026 utilizou **ChatGPT (GPT-6)**.

**Documentação:** [Arquitetura](docs/ARQUITETURA.md) · [Bibliografia](docs/REFERENCIAS.md) · [Histórico e assistentes de código](docs/HISTORICO_E_DESENVOLVIMENTO.md).

Para correções ou sugestões: [marquesbarros.geo@gmail.com](mailto:marquesbarros.geo@gmail.com).
