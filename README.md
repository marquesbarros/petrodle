# Petrodle

**Petrodle** é um jogo de identificação mineralógica. Em cada partida, o objetivo é descobrir um mineral secreto por comparação de propriedades, observação de fotomicrografias ou interpretação de descrições ópticas.

**[Jogar Petrodle](https://marquesbarros.github.io/petrodle/)**

## Como jogar

1. **Escolha um modo:** Clássico, Imagem ou Descrição.
2. **Observe a tabela, a fotografia ou a pista inicial**, conforme a modalidade escolhida.
3. **Busque o nome de um mineral**, selecione uma sugestão e confirme o palpite.
4. **Use o retorno para deduzir a resposta.** No Clássico, compare as propriedades; em Imagem e Descrição, refine suas hipóteses a cada tentativa.
5. **Consulte a ficha mineralógica** ao fim da partida. As informações e fotografias do verbete permitem revisar a identificação.

Cada modalidade tem um desafio diário próprio. Se quiser continuar jogando, selecione **Treino**, que permite iniciar novas partidas sem esperar o próximo dia.

## Modos de jogo

| Modo | Objetivo | Tentativas |
|---|---|---|
| **Clássico** | Descobrir o mineral comparando 11 atributos químicos, cristalográficos e ópticos. | Ilimitadas |
| **Imagem** | Identificar o mineral comparando duas fotomicrografias, PPL e XPL. | Até 8 |
| **Descrição** | Identificar o mineral a partir da pista inicial e das pistas opcionais. | Até 8 |

No **modo Imagem**, o jogador vê duas fotomicrografias lado a lado: **PPL** (luz polarizada plana, nicóis descruzados) e **XPL** (polarizadores cruzados, nicóis cruzados). Os pares foram selecionados a partir das fotografias existentes do Guia Frank, respeitando a identificação de cada condição de iluminação. O sorteio dessa modalidade utiliza somente minerais com ambas as imagens verificadas. Fotos avulsas ou sequências apenas em PPL continuam no catálogo, mas não são rotuladas incorretamente como pares nem sorteadas nessa modalidade. A disponibilidade de pares não altera o conjunto de respostas dos modos Clássico e Descrição.

**Cobertura fotográfica PPL/XPL:** 58 espécies elegíveis, após a incorporação de oito pares adicionais conferidos nas legendas do Guia Frank: anidrita, cloritóide, eudialita, glauconita, goethita, prehnita, rhodochrosita e titanita. Algumas fichas possuem somente fotos ND, somente fotos NC, fotografias não identificadas até o nível de espécie ou nenhuma fotomicrografia; elas permanecem fora do sorteio até que sejam incorporadas duas imagens com condições de iluminação verificadas.


No **Clássico**, cada palpite produz uma linha na tabela. As indicações significam:

| Indicação | Significado |
|---|---|
| Verde ✓ | A propriedade coincide com a do mineral secreto. |
| Amarelo ≈ | Há uma correspondência parcial. |
| Vermelho × | A propriedade é diferente. |
| Cinza — | Não há dados suficientes para comparar. |
| ↑ / ↓ | O valor procurado é, respectivamente, maior ou menor, para atributos ordenáveis. |

A cada **3 palpites**, o jogo disponibiliza uma dica opcional. O jogador decide se quer revelá-la. Um nome já utilizado não pode consumir outra tentativa. No modo Descrição, a primeira pista aparece antes do primeiro palpite.

## Busca e controles

Digite um nome no campo de busca. Selecione um resultado e pressione **Tentar** para registrar o palpite.

| Ação | Controle |
|---|---|
| Percorrer as sugestões | **↑** / **↓** |
| Confirmar o nome digitado ou a sugestão destacada | **Enter** |
| Fechar a lista de sugestões | **Esc** |
| Consultar minerais | Botão **Catálogo** |
| Ver as instruções dentro do jogo | Botão **Como jogar** |
| Alternar entre desafio diário e treino | Botões **Diário** / **Treino** |

As espécies minerais disponíveis como resposta podem ser utilizadas como palpites. **Biotita** também é aceita como palpite petrográfico, embora seja um nome coletivo: ela não é sorteada como resposta, e sua fotomicrografia é tratada como referência de grupo. As demais referências taxonômicas do catálogo continuam disponíveis apenas para consulta.

## Progresso e coleção

O progresso de cada modo e as descobertas ficam **salvos localmente no navegador**, sem conta e sem sincronização entre dispositivos. Ao retornar ao mesmo desafio diário, os palpites anteriores são recuperados. Apagar os dados do site ou trocar de navegador pode eliminar o progresso.

Após acertar, a espécie entra na coleção de minerais descobertos. O botão **Compartilhar resultado** copia um resumo da partida sem revelar o nome da resposta.

## Conteúdo mineralógico

O catálogo publicado contém **152 espécies**, das quais **145 têm fotomicrografia identificada nominalmente no guia** e **7 contam com imagens ilustrativas de grupo**. Fotografias genéricas de grupo não são utilizadas como resposta do modo Imagem. Imagens externas provenientes do Wikimedia Commons podem exigir conexão à internet.

A identificação petrográfica depende de contexto, composição e condições de observação. As propriedades mostradas são **referências didáticas**, não um procedimento diagnóstico exaustivo. A distinção entre mineral incolor e colorido diz respeito à luz polarizada plana (**PPL**); não equivale às cores de interferência observadas sob nicóis cruzados (**XPL**).

## Fontes e direitos de uso

As fotomicrografias atribuídas a **Heinrich T. Frank, UFRGS (2018)** têm autorização documentada para **uso não comercial**. Outras fotografias mantêm atribuições e licenças próprias. O código público não implica licença livre sobre todo o acervo de imagens.

Para consultar a rastreabilidade e os limites de reutilização, veja [AUDITORIA.md](AUDITORIA.md) e [DIREITOS.md](DIREITOS.md).

## Executar e testar

O Petrodle é um site estático, sem backend e sem etapa obrigatória de compilação. A interface, os dados e a lógica do jogo estão em `index.html`; os estilos adicionais estão em `game.css`. Abra `index.html` em um navegador ou publique o conteúdo via servidor estático.

Os testes usam **Node.js**, sem instalar dependências do projeto:

```bash
node tests/photos.test.cjs index.html
node tests/daily-and-clues.test.cjs index.html
node tests/three-modes.test.cjs index.html
node tests/ppl-xpl.test.cjs index.html
node tests/visual-theme.test.cjs
```

O GitHub Actions executa essas verificações a cada alteração na branch principal. A publicação é realizada no **GitHub Pages** a partir de `main`, diretório `/(root)`.
