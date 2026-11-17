const fs = require('node:fs');
const path = require('node:path');
const { getGame } = require('./load-game.cjs');

const output = path.join(__dirname, '..', 'data', 'acervo.csv');
const headers = [
  'mineralId', 'mineral', 'imageId', 'src', 'urlArquivo', 'fonte', 'pagina', 'tipo',
  'escopo', 'autor', 'atribuicao', 'licencaDeclarada', 'urlLicenca',
  'iluminacao', 'evidenciaIluminacao', 'parPPL_XPL', 'mesmoCampo',
  'larguraCampo', 'larguraPx', 'alturaPx', 'fonteMetadados', 'dataConsulta'
];

const csvCell = value => '"' + String(value ?? '').replace(/[^\S\r\n]*\r?\n\s*/g, ' ').replaceAll('"', '""') + '"';

function exportPhotos() {
  const { MINERALS, getPhotoPair } = getGame(['MINERALS', 'getPhotoPair']);
  const rows = [headers];
  for (const mineral of MINERALS) {
    const pair = getPhotoPair(mineral);
    for (const image of mineral.images) {
      const counterpart = pair?.ppl.id === image.id ? pair.xpl.id : pair?.xpl.id === image.id ? pair.ppl.id : null;
      rows.push([
        mineral.id, mineral.name, image.id, image.src, image.url, image.source, image.page,
        image.imageType, image.verifiedForSpecies === false ? 'Grupo / ilustrativa' : 'Nominal',
        image.author, image.attribution, image.license, image.licenseUrl,
        image.lighting, image.lightingEvidence, counterpart,
        counterpart ? image.sameField === true ? 'sim' : image.sameField === false ? 'não' : 'sem confirmação' : '',
        image.fieldWidth, image.pixelWidth, image.pixelHeight, image.metadataSource, image.metadataChecked
      ]);
    }
  }
  return rows.map(row => row.map(csvCell).join(';')).join('\n') + '\n';
}

if (require.main === module) {
  const csv = exportPhotos();
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== csv) {
      console.error('Acervo desatualizado. Execute node scripts/export-photos.cjs');
      process.exitCode = 1;
    }
  } else fs.writeFileSync(output, csv);
}

module.exports = { exportPhotos };
