# Verificação em navegador

Execute a partir da raiz do repositório com Node.js e Google Chrome instalados. A suíte usa um perfil temporário do navegador e instâncias HTTP locais. O exemplo usa PowerShell e instala as dependências de teste em uma pasta temporária.

```powershell
$toolDir = Join-Path ([System.IO.Path]::GetTempPath()) 'petrodle-browser-deps'
npm install --prefix $toolDir --no-package-lock --no-audit --no-fund 'playwright-core@1.65.1' '@axe-core/playwright@4.14.0'
$env:PETRODLE_BROWSER_DEPS = $toolDir
node tests/browser/verify.cjs
```

Para usar o Microsoft Edge, defina `PETRODLE_CHROMIUM_CHANNEL` como `msedge`. Para salvar as capturas de tela, indique uma pasta em `PETRODLE_BROWSER_SCREENSHOTS`.

A suíte percorre os três modos no Diário e no Treino, verifica vitória, derrota, novo mineral, coleção, busca, dicas, catálogo, compartilhamento e a virada da data local. Abre também `index.html` pelo protocolo `file://` em uma tela de 360 px, com testes de seleção por toque e da coluna fixa do Clássico. Os testes simulam falha na imagem da ficha e no modo Imagem, conferem a recuperação e testam o foco ao fechar uma ampliação. A análise com axe complementa os testes de teclado e foco. Uma sessão manual com leitor de tela permite avaliar a ordem e a clareza dos anúncios.

## Comparação de interface

Com uma cópia executável do estado de referência, use a opção abaixo. Ela fixa a data do Diário, reproduz o mesmo palpite nos dois estados e captura a página inicial e os três modos em 1440 px e 360 px. Os números registrados incluem a posição do primeiro modo, se a coleção aparece acima da dificuldade e se o conteúdo cabe na largura da tela.

```powershell
$env:PETRODLE_BROWSER_COMPARE_ONLY = '1'
$env:PETRODLE_BROWSER_SCREENSHOTS = Join-Path ([System.IO.Path]::GetTempPath()) 'petrodle-capturas'
node tests/browser/verify.cjs C:\caminho\para\a\copia\anterior
Remove-Item Env:PETRODLE_BROWSER_COMPARE_ONLY
```

## Comparação de carregamento

O comando abaixo recupera a versão anterior à revisão em uma pasta temporária. Compara três aberturas em contextos novos do Chromium por versão, com cache HTTP desabilitado no servidor local, conteúdo textual em gzip, 150 ms de latência e 1,6 Mbit/s de download. São relatadas as medianas do número de requisições, dos bytes dos corpos das respostas, do tempo até a renderização dos modos e do tempo entre abrir o modo Imagem e ter as duas fotos prontas. O primeiro conteúdo desenhado pelo navegador é relatado separadamente, pois o fundo pode aparecer enquanto o jogo ainda está carregando.

```powershell
$baselineDir = Join-Path ([System.IO.Path]::GetTempPath()) ('petrodle-baseline-' + [guid]::NewGuid())
$baselineZip = "$baselineDir.zip"
git archive --format=zip --output=$baselineZip 77bdd56 -- index.html game.css crystal-world.svg thin-section-field.svg
Expand-Archive -LiteralPath $baselineZip -DestinationPath $baselineDir
node tests/browser/verify.cjs $baselineDir
```

Defina `PETRODLE_BROWSER_MEASURE_ONLY=1` para medir sem repetir os fluxos funcionais. Use `PETRODLE_BROWSER_MEASURE=1` sem uma pasta de referência para medir apenas o workspace atual e executar os fluxos.
