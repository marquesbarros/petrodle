# Disponibilidade das imagens externas

Em 16/11/2026, a sondagem de rede consultou as 61 URLs de imagem do catálogo. O script seguiu os redirecionamentos com requisições HTTP HEAD, até quatro em paralelo, e verificou o tipo de conteúdo da resposta.

| Resultado da consulta | URLs |
| --- | ---: |
| Disponível, HTTP 200 e tipo de conteúdo de imagem | 35 |
| Inconclusivo, HTTP 429 | 26 |
| Indisponível, HTTP 404 ou 410 | 0 |

O HTTP 429 indica que o servidor limitou as requisições. A disponibilidade das 26 imagens permanece por conferir. A sondagem informa o que o servidor respondeu naquele momento. Licença, identificação do espécime e carregamento em cada navegador exigem verificações próprias.

Para repetir a consulta, execute `node scripts/audit.cjs --network`. A verificação de regressão executada localmente usa o catálogo e os arquivos do repositório.

## Metadados e atribuição

Em 16/11/2026, as 61 fichas do Commons também foram consultadas por título em lotes de até 20, usando `imageinfo` com `extmetadata` e `size`. A consulta registrou autoria, atribuição quando declarada, licença exibida pela API e dimensões do arquivo original. Ela retornou autoria e licença para os 30 arquivos cujo catálogo pedia conferência de pelo menos um desses campos. A API pode listar uma só opção quando o arquivo tem mais de uma licença. [Documentação de Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo)

- A conferência nas páginas de Almandina, Anatásio e Caolinita recuperou os créditos ausentes do campo estruturado de autoria. [Almandina](https://commons.wikimedia.org/wiki/File:Almandine.jpeg) · [Anatásio](https://commons.wikimedia.org/wiki/File:Anat%C3%A1sio.jpeg) · [Caolinita](https://commons.wikimedia.org/wiki/File:Kaolinite.jpg)
- A página de Pumpellyita-(Mg) especifica Leon Hupperichs, CC BY-SA 3.0 e campo de 4 mm. Para Rinkita-(Ce), a página credita Modris Baum e declara CC0. [Pumpellyita-(Mg)](https://commons.wikimedia.org/wiki/File:Pumpellyite-(Mg)-94433.jpg) · [Rinkita-(Ce)](https://commons.wikimedia.org/wiki/File:Rinkite-(Ce),_Fluorapatite,_Fluorite-574772.jpg)
- A autoria da imagem de Espodumênio é presumida pelo próprio Commons. A página de Lizardita lista CC BY-SA 3.0, a variante alemã e a GFDL como opções. [Espodumênio](https://commons.wikimedia.org/wiki/File:Spodumene.jpg) · [Lizardita](https://commons.wikimedia.org/wiki/File:Lizardit.jpg)
