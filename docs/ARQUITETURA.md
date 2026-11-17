# Arquitetura do Petrodle

O GitHub Pages serve arquivos estáticos da raiz do repositório. O navegador abre `index.html` por HTTP ou diretamente do disco. Os scripts clássicos externos são carregados em ordem com `defer`, inclusive em `file://`. O acervo local consiste em imagens WebP independentes, baixadas quando a interface precisa delas. O catálogo continua consultável se um arquivo do Commons estiver indisponível.

| Arquivo | Responsabilidade |
| --- | --- |
| `data/catalog.js` | Catálogo versionado, metadados de imagem e procedência por atributo |
| `data/daily-versions.js` | Listas fixas de alvos e registro das publicações históricas verificadas |
| `src/rules.js` | Elegibilidade, comparação de palpites, seleção e pistas |
| `src/storage.js` | Validação, migração e gravação do progresso no navegador |
| `src/ui.js` e `game.css` | Interface, eventos e apresentação |
| `scripts/` | Auditoria, exportação do acervo e carregamento de regras em Node |

## Revisar um verbete

1. Localize o ID no catálogo. Preserve o ID ao corrigir a grafia, a procedência ou qualquer propriedade. Mantenha disponíveis os verbetes arquivados pelo calendário, incluindo fotos usadas por eles.
2. Use `sources` para registrar o documento, a página e a URL quando conhecidos. `provenanceProfile` aponta para um mapa de propriedades. As quatro posições de cada entrada correspondem, em ordem, ao estado (`present`, `variable`, `missing`, `inapplicable`), ao escopo (`species`, `group`, `range`), à origem (`guide` ou `editorial`) e ao índice em `sources` (ou `null`). `editorial` indica classificação, síntese ou correção do Petrodle. Uma referência de grupo serve como contexto e a revisão do valor por espécie pode continuar pendente.
3. Ao mexer em um perfil, confira quais verbetes o compartilham. Crie ou reaproveite um perfil que reflita o novo registro. Registre a justificativa nas notas do verbete. Campos categóricos simplificados, como `colorPPL` e `family`, não equivalem a uma propriedade medida da amostra.
4. Para imagens, confira a ficha do arquivo, autoria, licença, escopo e iluminação. Em imagens locais, o ID corresponde aos 20 primeiros caracteres do SHA-256 do arquivo. `sameField` fica `null` quando as fontes disponíveis não confirmam o enquadramento. PPL/XPL identifica condições de iluminação. Uma foto nominal do Commons registra a identificação declarada, sujeita a validação mineralógica independente.
5. Refaça os inventários e rode os testes. A auditoria por ID distingue pendências existentes de regressões. Revise o diff do relatório junto com as mudanças de conteúdo. Quando resolver uma pendência, mantenha a linha de base como referência histórica.

```sh
node scripts/export-photos.cjs
node scripts/audit.cjs --write
node scripts/audit.cjs --check
node --test
```

O [acervo](../data/acervo.csv) tem uma linha por uso da imagem no catálogo, com um ID comum quando o arquivo é reutilizado. Os arquivos [fotografias.csv](../data/fotografias.csv) e [fotos_pendentes.json](../data/fotos_pendentes.json) preservam a auditoria v0.8. Consulte [Direitos](../DIREITOS.md) e a [auditoria atual](AUDITORIA_DO_CATALOGO.md) ao incorporar material.

## Diário e progresso

Para as datas de 12 a 16 de novembro de 2026, `DAILY_HISTORY` registra o alvo calculado no último deployment bem-sucedido daquele dia civil em São Paulo, com base nos SHAs e horários retornados pela API de deploys do GitHub Pages. Os modos e dificuldades inexistentes na publicação do dia não possuem alvo histórico. O código da aplicação continua oferecendo apenas as modalidades atuais. A publicação na mesma data por mais de um commit pode ter produzido outras respostas ao longo do dia. Um progresso legado com alvo conhecido e elegível naquela modalidade e dificuldade conserva o próprio alvo e os palpites válidos.

Fora das publicações arquivadas, o diário usa listas congeladas com vigência por data. A lista `77bdd56` rege as datas anteriores a 17/11/2026. A versão `curadoria-2026-11` adota a [nova seleção](DIFICULDADES.md) a partir dessa data. Para mudar os alvos futuros, adicione uma versão completa com data de início e listas por modo e dificuldade. Mantenha as versões anteriores. O modo Treino usa os elegíveis atuais do catálogo. As chaves `petrodle:v6` permitem ler o progresso de versões anteriores no mesmo navegador e origem.

## Testar e publicar

- Abra `index.html` no navegador ou sirva o diretório raiz por HTTP. A cópia local continua usando a mesma data civil do navegador. O armazenamento via `file://` depende do navegador.
- Rode `node --test` e `node scripts/export-photos.cjs --check`, com Node.js 22 ou posterior. A [verificação em navegador](../tests/browser/README.md) inclui fluxos dos três modos, abertura local e medição sob limitação de rede.
- Revise os arquivos na raiz e pastas referenciadas antes de publicar pelo fluxo do GitHub Pages. Registre a revisão usada e as mudanças de conteúdo, particularmente quando alterarem a elegibilidade dos desafios futuros.

O guia [Uso em aula](USO_EM_AULA.md) contém o roteiro e o protocolo de avaliação com lâminas ou imagens inéditas.
