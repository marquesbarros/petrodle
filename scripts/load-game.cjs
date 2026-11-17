const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const entry = path.join(__dirname, '..', 'index.html');

function readGame(file = entry) {
  const html = fs.readFileSync(file, 'utf8');
  const inline = html.match(/<script>\s*\(\(\)=>\{([\s\S]+?)\}\)\(\);<\/script>/);
  if (inline) {
    const core = inline[1].slice(0, inline[1].indexOf('const root ='));
    return { html: html + '\n' + inline[1], core };
  }
  const root = path.dirname(path.resolve(file));
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
    .map(([, src]) => [src, fs.readFileSync(path.join(root, src), 'utf8')]);
  if (!scripts.length) throw new Error('Scripts do Petrodle não encontrados');
  return {
    html: html + '\n' + scripts.map(([, code]) => code).join('\n'),
    core: scripts.filter(([src]) => src !== 'src/ui.js').map(([, code]) => code).join('\n')
  };
}

function getGame(names, file = entry) {
  for (const name of names) {
    if (!/^[a-z_$][\w$]*$/i.test(name)) throw new Error('Nome de símbolo inválido');
  }
  const { core } = readGame(file);
  return vm.runInNewContext(core + '\n;({' + names.join(',') + '})', {}, { timeout: 30000 });
}

module.exports = { readGame, getGame };
