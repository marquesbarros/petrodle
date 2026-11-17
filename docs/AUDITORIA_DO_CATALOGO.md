# Auditoria do catálogo

Relatório gerado por `node scripts/audit.cjs --write`. `node scripts/audit.cjs --check` compara problemas por identificador com a [linha de base](../data/audit-baseline.json) e verifica se o relatório está atualizado. `node scripts/audit.cjs --reference` repete a análise com o catálogo e as regras do commit de referência, quando disponível no histórico local.

## Cobertura por modo e dificuldade

| Modo | Dificuldade | Alvos | Alvos com todas as pistas iguais | Menções ao nome ou sinônimo | Alvos com par PPL/XPL |
| --- | --- | ---: | ---: | ---: | ---: |
| Clássico | Fácil | 15 | 0 | 0 | — |
| Clássico | Médio | 45 | 0 | 0 | — |
| Clássico | Difícil | 152 | 2 | 0 | — |
| Imagem | Fácil | 12 | 0 | 0 | 10 |
| Imagem | Médio | 34 | 0 | 0 | 25 |
| Imagem | Difícil | 84 | 0 | 0 | 58 |
| Descrição | Fácil | 13 | 0 | 0 | — |
| Descrição | Médio | 40 | 0 | 0 | — |
| Descrição | Difícil | 139 | 34 | 0 | — |

A coluna de pistas iguais compara as dicas disponíveis antes do fim da partida. Inclui também a pista inicial do Descrição, as duas fotos do Imagem e os campos de comparação do Clássico. A busca por nomes verifica a denominação completa ou sinônimos com pelo menos três caracteres, aceitando variações de acento e de hífen. Menções ao grupo são registradas à parte.

### Lacunas e imagens dos alvos elegíveis

| Modo | Dificuldade | Alvos com lacuna | Alvos com imagem reutilizada | Alvos com imagem local ausente | Alvos com imagem externa | Alvos com imagem externa indisponível |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Clássico | Fácil | 2 | 2 | 0 | 3 | — |
| Clássico | Médio | 6 | 9 | 0 | 11 | — |
| Clássico | Difícil | 28 | 53 | 0 | 61 | — |
| Imagem | Fácil | 2 | 0 | 0 | 0 | — |
| Imagem | Médio | 5 | 0 | 0 | 0 | — |
| Imagem | Difícil | 15 | 0 | 0 | 0 | — |
| Descrição | Fácil | 0 | 2 | 0 | 3 | — |
| Descrição | Médio | 1 | 8 | 0 | 10 | — |
| Descrição | Difícil | 15 | 50 | 0 | 58 | — |

As colunas contam verbetes elegíveis com pelo menos uma ocorrência no catálogo. O reuso inclui figuras de grupo documentadas. A disponibilidade externa é medida apenas com `--network`.

### Alvos elegíveis

<details><summary>Clássico · Fácil</summary>

Albita, Augita, Calcita, Diopsídio, Dolomita, Enstatita, Epidoto, Forsterita, Gipso, Hematita, Magnetita, Microclínio, Muscovita, Ortoclásio, Quartzo.

</details>

<details><summary>Clássico · Médio</summary>

Actinolita, Albita, Almandina, Andalusita, Anidrita, Anortita, Antigorita, Aragonita, Augita, Barita, Calcita, Caulinita, Cianita, Clinocloro, Clinozoisita, Cordierita, Diopsídio, Dolomita, Enstatita, Epidoto, Estaurolita, Flogopita, Fluorapatita, Forsterita, Gipso, Goethita, Hematita, Ilmenita, Magnésio-hornblenda, Magnetita, Microclínio, Muscovita, Nefelina, Ortoclásio, Pirita, Quartzo, Rutilo, Sanidina, Siderita, Sillimanita, Talco, Titanita, Tremolita, Zircão, Zoisita.

</details>

<details><summary>Clássico · Difícil</summary>

Actinolita, Aegirina, Akermanita, Albita, Allanita-(Ce), Almandina, Analcima, Anatásio, Andalusita, Andradita, Anidrita, Annita, Anortita, Anortoclásio, Antigorita, Antofilita, Aragonita, Arfvedsonita, Augita, Azurita, Barita, Berilo, Brookita, Brucita, Calcita, Calcopirita, Cancrinita, Cassiterita, Caulinita, Celadonita, Chabazita-Ca, Chabazita-Na, Chamosita, Chondrodita, Cianita, Clinocloro, Clinozoisita, Cloritóide, Cordierita, Coríndon, Crisotilo, Cristobalita, Cromita, Cummingtonita, Cuprita, Dickita, Diopsídio, Dolomita, Dravita, Dumortierita, Eastonita, Elbaíta, Enstatita, Epidoto, Escolecita, Espessartita, Espinélio, Espodumênio, Estaurolita, Estilbita-Ca, Estilbita-Na, Eudialita, Fayalita, Ferro-hornblenda, Flogopita, Fluorapatita, Fluorapofilita-(K), Fluorita, Forsterita, Galena, Gehlenita, Gipso, Glaucofano, Glauconita, Goethita, Grossulária, Grunerita, Hauynita, Hedenbergita, Hematita, Heulandita-Ca, Heulandita-K, Heulandita-Na, Hidroxiapatita, Hidroxiapofilita-(K), Ilmenita, Jadeita, Kaersutita, Kornerupina, Laumontita, Lawsonita, Leucita, Lizardita, Magnésio-hornblenda, Magnesita, Magnetita, Malaquita, Marialita, Meionita, Microclínio, Molibdenita, Monazita-(Ce), Monazita-(La), Monazita-(Nd), Mordenita, Muscovita, Nacrita, Nefelina, Noseana, Omfacita, Ortoclásio, Pargasita, Pentlandita, Periclásio, Perovskita, Piemontita, Pigeonita, Pirita, Pirofilita, Piropo, Pirrotita, Polilitionita, Prehnita, Pumpellyita-(Fe2+), Pumpellyita-(Fe3+), Pumpellyita-(Mg), Quartzo, Rhodochrosita, Rhodonita, Riebeckita, Rinkita-(Ce), Rutilo, Safirina, Sanidina, Schorlita, Siderita, Siderofilita, Sillimanita, Sodalita, Stilpnomelano, Talco, Titanita, Topázio, Tremolita, Tridimita, Trilitionita, Uvarovita, Vermiculita, Vesuvianita, Wollastonita, Zircão, Zoisita.

</details>

<details><summary>Imagem · Fácil</summary>

Augita, Calcita, Diopsídio, Enstatita, Epidoto, Gipso, Hematita, Magnetita, Microclínio, Muscovita, Ortoclásio, Quartzo.

</details>

<details><summary>Imagem · Médio</summary>

Actinolita, Andalusita, Anidrita, Aragonita, Augita, Barita, Calcita, Cianita, Clinozoisita, Cordierita, Diopsídio, Enstatita, Epidoto, Estaurolita, Flogopita, Gipso, Goethita, Hematita, Ilmenita, Magnetita, Microclínio, Muscovita, Nefelina, Ortoclásio, Pirita, Quartzo, Rutilo, Sanidina, Siderita, Sillimanita, Talco, Titanita, Tremolita, Zircão.

</details>

<details><summary>Imagem · Difícil</summary>

Actinolita, Aegirina, Analcima, Andalusita, Anidrita, Anortoclásio, Antofilita, Aragonita, Arfvedsonita, Augita, Azurita, Barita, Berilo, Brookita, Brucita, Calcita, Calcopirita, Cassiterita, Celadonita, Chondrodita, Cianita, Clinozoisita, Cloritóide, Cordierita, Coríndon, Cuprita, Diopsídio, Dumortierita, Enstatita, Epidoto, Escolecita, Espinélio, Estaurolita, Eudialita, Flogopita, Fluorita, Galena, Gipso, Glaucofano, Glauconita, Goethita, Grunerita, Hauynita, Hedenbergita, Hematita, Ilmenita, Kornerupina, Laumontita, Lawsonita, Leucita, Magnesita, Magnetita, Microclínio, Molibdenita, Mordenita, Muscovita, Nefelina, Noseana, Ortoclásio, Perovskita, Piemontita, Pigeonita, Pirita, Pirofilita, Prehnita, Quartzo, Rhodochrosita, Rhodonita, Riebeckita, Rutilo, Safirina, Sanidina, Siderita, Sillimanita, Sodalita, Stilpnomelano, Talco, Titanita, Topázio, Tremolita, Vermiculita, Vesuvianita, Wollastonita, Zircão.

</details>

<details><summary>Descrição · Fácil</summary>

Albita, Augita, Calcita, Diopsídio, Dolomita, Enstatita, Epidoto, Forsterita, Gipso, Microclínio, Muscovita, Ortoclásio, Quartzo.

</details>

<details><summary>Descrição · Médio</summary>

Actinolita, Albita, Almandina, Andalusita, Anidrita, Anortita, Antigorita, Aragonita, Augita, Barita, Calcita, Cianita, Clinocloro, Clinozoisita, Cordierita, Diopsídio, Dolomita, Enstatita, Epidoto, Estaurolita, Flogopita, Fluorapatita, Forsterita, Gipso, Goethita, Magnésio-hornblenda, Microclínio, Muscovita, Nefelina, Ortoclásio, Quartzo, Rutilo, Sanidina, Siderita, Sillimanita, Talco, Titanita, Tremolita, Zircão, Zoisita.

</details>

<details><summary>Descrição · Difícil</summary>

Actinolita, Aegirina, Akermanita, Albita, Allanita-(Ce), Almandina, Analcima, Anatásio, Andalusita, Andradita, Anidrita, Annita, Anortita, Anortoclásio, Antigorita, Antofilita, Aragonita, Arfvedsonita, Augita, Barita, Berilo, Brookita, Brucita, Calcita, Cancrinita, Cassiterita, Celadonita, Chabazita-Ca, Chabazita-Na, Chamosita, Chondrodita, Cianita, Clinocloro, Clinozoisita, Cloritóide, Cordierita, Coríndon, Crisotilo, Cristobalita, Cromita, Cummingtonita, Diopsídio, Dolomita, Dravita, Dumortierita, Eastonita, Elbaíta, Enstatita, Epidoto, Escolecita, Espessartita, Espinélio, Espodumênio, Estaurolita, Estilbita-Ca, Estilbita-Na, Eudialita, Fayalita, Ferro-hornblenda, Flogopita, Fluorapatita, Fluorapofilita-(K), Fluorita, Forsterita, Gehlenita, Gipso, Glaucofano, Glauconita, Goethita, Grossulária, Grunerita, Hauynita, Hedenbergita, Heulandita-Ca, Heulandita-K, Heulandita-Na, Hidroxiapatita, Hidroxiapofilita-(K), Jadeita, Kaersutita, Kornerupina, Laumontita, Lawsonita, Leucita, Lizardita, Magnésio-hornblenda, Magnesita, Marialita, Meionita, Microclínio, Monazita-(Ce), Monazita-(La), Monazita-(Nd), Mordenita, Muscovita, Nefelina, Noseana, Omfacita, Ortoclásio, Pargasita, Pentlandita, Periclásio, Perovskita, Piemontita, Pigeonita, Pirofilita, Piropo, Pirrotita, Polilitionita, Prehnita, Pumpellyita-(Fe2+), Pumpellyita-(Fe3+), Pumpellyita-(Mg), Quartzo, Rhodochrosita, Rhodonita, Riebeckita, Rinkita-(Ce), Rutilo, Safirina, Sanidina, Schorlita, Siderita, Siderofilita, Sillimanita, Sodalita, Stilpnomelano, Talco, Titanita, Topázio, Tremolita, Tridimita, Trilitionita, Uvarovita, Vermiculita, Vesuvianita, Wollastonita, Zircão, Zoisita.

</details>

## Conjuntos indistinguíveis

### Descrição · Difícil

A revisão de referência `77bdd56` tinha 34 alvos do nível Difícil distribuídos em 15 conjuntos. O catálogo desta auditoria tem 34 alvos em 15 conjuntos no mesmo nível.

| Alternativas no Difícil | Verbete compartilhado no guia | Evidência a rever |
| --- | --- | --- |
| Annita, Eastonita, Siderofilita | Biotita, p. 35 | A clivagem basal e o pleocroísmo sustentam a hipótese de biotita. Para separar estas espécies, compare a composição da mica, especialmente a proporção Fe²⁺/Mg e a distribuição de Al nos sítios tetraédricos e octaédricos. |
| Chabazita-Ca, Chabazita-Na | Chabazita, p. 52 | Hábito e contexto de ocorrência orientam a hipótese de chabazita. O sufixo depende do cátion extrarreticular mais abundante em proporção atômica. Meça a composição do grão para comparar Ca, Na e K. |
| Chamosita, Clinocloro | Clorita, p. 58 | Cor, clivagem e cores anômalas em XPL podem indicar clorita. Compare a ocupação octaédrica por Fe²⁺ e Mg para distinguir chamosita de clinocloro. |
| Dravita, Elbaíta, Schorlita | Turmalina (Grupo), p. 199 | O reconhecimento óptico pode sustentar uma hipótese de turmalina. Separe estas espécies pela composição e pela ocupação dos sítios, incluindo Mg, Fe, Al e Li. A cor sozinha é insuficiente. |
| Estilbita-Ca, Estilbita-Na | Estilbita, p. 87 | A associação e o hábito sustentam a hipótese de estilbita. Determine a abundância atômica de Ca e Na entre os cátions extrarreticulares. O teor de água das fórmulas representativas não distingue as espécies. |
| Fayalita, Forsterita | Olivina, p. 146 | O relevo e a birrefringência ajudam a reconhecer olivina e podem sugerir composição. Para determinar a posição na série forsterita–fayalita, analise Mg e Fe do grão e calcule a proporção molar. |
| Ferro-hornblenda, Magnésio-hornblenda | Hornblenda Verde, p. 116 | Pleocroísmo e clivagem podem indicar anfibólio cálcico. A classificação da hornblenda requer a composição e a distribuição de cátions pelos sítios cristalográficos, incluindo Fe²⁺ e Mg. |
| Fluorapatita, Hidroxiapatita | Apatita, p. 20 | A distinção exige estimar a ocupação do sítio aniônico por F e OH. Um resultado sem detecção de F, isoladamente, não demonstra predominância de OH. |
| Fluorapofilita-(K), Hidroxiapofilita-(K) | Apofilita, p. 22 | Compare a ocupação por F e OH no sítio aniônico da apofilita potássica. F e OH podem coexistir numa amostra. O hábito compartilhado não informa qual predomina. |
| Heulandita-Ca, Heulandita-Na | Heulandita, p. 113 | As pistas sustentam a hipótese de heulandita. Compare os cátions extrarreticulares em proporção atômica para atribuir o sufixo. O número de moléculas de água nas fórmulas de referência não determina a espécie. |
| Marialita, Meionita | Escapolita, p. 78 | As observações sustentam uma hipótese de escapolita. A composição ao longo da série pode ser estimada opticamente com medidas adequadas. Para separar estes extremos, verifique Na/Ca e as contribuições de Cl e carbonato. |
| Monazita-(Ce), Monazita-(La), Monazita-(Nd) | Monazita, p. 135 | Meça a composição da zona analisada e determine qual terra rara predomina no sítio A. A presença de Ce, La ou Nd isoladamente não define o sufixo. |
| Pentlandita, Pirrotita | Opacos, p. 150 | A opacidade em luz transmitida é compartilhada. Examine a fase individual em seção polida e, se necessário, quantifique Ni e a proporção metal/enxofre. Ni no agregado pode pertencer a uma fase vizinha. |
| Polilitionita, Trilitionita | Lepidolita, p. 124 | As pistas de lepidolita não separam essas micas. Compare Li e Al octaédricos e Si e Al tetraédricos. As fórmulas dos extremos fluorados não excluem substituição F/OH em composições naturais. |
| Pumpellyita-(Fe2+), Pumpellyita-(Fe3+), Pumpellyita-(Mg) | Pumpellyita, p. 169 | A paragênese é compatível com pumpellyita. A distinção requer composição e ocupação dos sítios, incluindo Mg e o estado de oxidação do Fe. Uma medida de Fe total não separa as duas espécies ferríferas. |

A coluna de evidência indica o que precisaria ser documentado para separar as respostas. A [revisão científica](REVISAO_CIENTIFICA.md) registra as fontes e a justificativa. Os casos podem ser discutidos como hipóteses de grupo. A escolha da regra de aceitação continua pendente.

### Clássico · Difícil

- Dickita, Nacrita. Dickita e Nacrita têm a mesma fórmula global. Para testar o empilhamento das camadas e separar os polimorfos, use um difratograma de raios X apropriado.. [Manual de difração do USGS](https://pubs.usgs.gov/of/2001/of01-041/htmldocs/clays/kaogr.htm)

## Nomes e grupos nas pistas

- **Clássico · Fácil** — nenhum nome completo detectado. 1 menções ao grupo.
- **Clássico · Médio** — nenhum nome completo detectado. 8 menções ao grupo.
- **Clássico · Difícil** — nenhum nome completo detectado. 54 menções ao grupo.
- **Imagem · Fácil** — nenhum nome completo detectado. 0 menções ao grupo.
- **Imagem · Médio** — nenhum nome completo detectado. 0 menções ao grupo.
- **Imagem · Difícil** — nenhum nome completo detectado. 0 menções ao grupo.
- **Descrição · Fácil** — nenhum nome completo detectado. 1 menções ao grupo.
- **Descrição · Médio** — nenhum nome completo detectado. 8 menções ao grupo.
- **Descrição · Difícil** — nenhum nome completo detectado. 49 menções ao grupo.

## Campos ausentes ou inaplicáveis nos alvos

| Campo | Ausentes | Variável ou ausente na fonte | Inaplicáveis |
| --- | --- | --- | --- |
| system | — | Analcima, Azurita, Calcopirita, Galena, Hematita, Ilmenita, Magnetita, Molibdenita, Pirita | — |
| silicateStructure | — | — | Anatásio, Anidrita, Aragonita, Azurita, Barita, Brookita, Brucita, Calcita, Calcopirita, Cassiterita, Coríndon, Cromita, Cuprita, Dolomita, Espinélio, Fluorapatita, Fluorita, Galena, Gipso, Goethita, Hematita, Hidroxiapatita, Ilmenita, Magnesita, Magnetita, Malaquita, Molibdenita, Monazita-(Ce), Monazita-(La), Monazita-(Nd), Pentlandita, Periclásio, Perovskita, Pirita, Pirrotita, Rhodochrosita, Rutilo, Siderita |
| cleavage | Anatásio, Azurita, Brookita, Calcopirita, Caulinita, Chabazita-Ca, Chabazita-Na, Chondrodita, Coríndon, Cromita, Cuprita, Dickita, Estaurolita, Galena, Hauynita, Hematita, Ilmenita, Magnetita, Malaquita, Marialita, Meionita, Molibdenita, Nacrita, Pentlandita, Pirita, Pirrotita, Rinkita-(Ce) | — | — |
| colorPPL | Azurita, Calcopirita, Caulinita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pirita | — | Cromita, Pentlandita, Pirrotita |
| relief | Azurita, Calcopirita, Caulinita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pirita | — | Cromita, Pentlandita, Pirrotita |
| pleochroism | Azurita, Calcopirita, Caulinita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pirita | — | Cromita, Pentlandita, Pirrotita |
| twinning | Azurita, Calcopirita, Caulinita, Cromita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pentlandita, Pirita, Pirrotita | — | — |
| birefringence | Azurita, Calcopirita, Caulinita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pirita | — | Cromita, Pentlandita, Pirrotita |
| associations | Azurita, Calcopirita, Caulinita, Cromita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pentlandita, Pirita, Pirrotita | — | — |
| habit | Azurita, Calcopirita, Caulinita, Cromita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pentlandita, Pirita, Pirrotita | — | — |
| ppl | Azurita, Calcopirita, Caulinita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pirita | — | — |
| xpl | Azurita, Calcopirita, Caulinita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pirita | — | — |
| cleavageDescription | Azurita, Calcopirita, Caulinita, Cromita, Cuprita, Dickita, Galena, Hematita, Ilmenita, Magnetita, Malaquita, Molibdenita, Nacrita, Pentlandita, Pirita, Pirrotita | — | — |

A estrutura silicática é inaplicável aos não silicatos. Para os verbetes derivados de Opacos, as propriedades ópticas que exigem transmissão são inaplicáveis. Nos demais campos, lacunas e classificações variáveis ou ausentes exigem revisão da referência.

## Imagens

- 279 origens únicas por hash do arquivo local ou URL externa, com 61 URLs externas.
- 0 origens locais ausentes ou inválidas.
- 22 origens repetidas. A ocorrência é identificada pelo nome do verbete e a posição da imagem na ficha.

### Reuso em mesmo verbete

Nenhuma ocorrência.

### Reuso em grupo

- Akermanita #2 (ilustrativa), Gehlenita #2 (ilustrativa), Melilita #1 (ilustrativa)
- Albita #2 (ilustrativa), Andesina #1 (ilustrativa), Anortita #2 (ilustrativa), Bitownita #1 (ilustrativa), Labradorita #1 (ilustrativa), Oligoclásio #1 (ilustrativa), Plagioclásios #1 (ilustrativa)
- Allanita #1 (ilustrativa), Allanita-(Ce) #2 (ilustrativa)
- Almandina #2 (ilustrativa), Andradita #2 (ilustrativa), Espessartita #2 (ilustrativa), Granada #1 (ilustrativa), Grossulária #2 (ilustrativa), Piropo #2 (ilustrativa), Uvarovita #2 (ilustrativa)
- Annita #2 (ilustrativa), Biotita #1 (ilustrativa), Eastonita #1 (ilustrativa), Siderofilita #1 (ilustrativa)
- Antigorita #2 (ilustrativa), Crisotilo #2 (ilustrativa), Lizardita #2 (ilustrativa), Serpentina #1 (ilustrativa)
- Apatita #1 (ilustrativa), Fluorapatita #2 (ilustrativa), Hidroxiapatita #2 (ilustrativa)
- Apofilita #1 (ilustrativa), Fluorapofilita-(K) #2 (ilustrativa), Hidroxiapofilita-(K) #2 (ilustrativa)
- Argilominerais #1 (ilustrativa), Caulinita #2 (ilustrativa), Dickita #2 (ilustrativa), Nacrita #2 (ilustrativa)
- Cancrinita #2 (ilustrativa), Cancrinita (Grupo) #1 (ilustrativa)
- Chabazita #1 (ilustrativa), Chabazita-Ca #2 (ilustrativa), Chabazita-Na #2 (ilustrativa)
- Chamosita #2 (ilustrativa), Clinocloro #2 (ilustrativa), Clorita #1 (ilustrativa)
- Dravita #2 (ilustrativa), Elbaíta #2 (ilustrativa), Schorlita #2 (ilustrativa), Turmalina (Grupo) #1 (ilustrativa)
- Escapolita #1 (ilustrativa), Marialita #2 (ilustrativa), Meionita #2 (ilustrativa)
- Estilbita #1 (ilustrativa), Estilbita-Ca #2 (ilustrativa), Estilbita-Na #1 (ilustrativa)
- Fayalita #2 (ilustrativa), Forsterita #2 (ilustrativa), Olivina #1 (ilustrativa)
- Ferro-hornblenda #2 (ilustrativa), Hornblenda Verde #1 (ilustrativa), Magnésio-hornblenda #2 (ilustrativa)
- Heulandita #1 (ilustrativa), Heulandita-Ca #2 (ilustrativa), Heulandita-K #1 (ilustrativa), Heulandita-Na #1 (ilustrativa)
- Hornblenda Marrom #1 (ilustrativa), Kaersutita #2 (ilustrativa), Pargasita #2 (ilustrativa)
- Lepidolita #1 (ilustrativa), Polilitionita #2 (ilustrativa), Trilitionita #2 (ilustrativa)
- Monazita #1 (ilustrativa), Monazita-(Ce) #2 (ilustrativa), Monazita-(La) #2 (ilustrativa), Monazita-(Nd) #1 (ilustrativa)
- Pumpellyita #1 (ilustrativa), Pumpellyita-(Fe2+) #2 (ilustrativa), Pumpellyita-(Fe3+) #1 (ilustrativa), Pumpellyita-(Mg) #1

### Reuso em entre verbetes

Nenhuma ocorrência.

### Disponibilidade remota

As URLs externas ficam com estado desconhecido neste relatório. Consulte a [sondagem registrada](AUDITORIA_REDE.md) ou execute `node scripts/audit.cjs --network` para uma nova consulta. HTTP 404/410 indica indisponibilidade na consulta. Bloqueios, limites, falhas de conexão e respostas de tipo inesperado são inconclusivos.
