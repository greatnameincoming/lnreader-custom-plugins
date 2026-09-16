import list from './sources.json' with { type: 'json' };
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const folder = dirname(fileURLToPath(import.meta.url));

export const generateAll = function () {
  return list.map(source => generator(source));
};

const generator = function generator(source) {
  const template = readFileSync(join(folder, 'template.ts'), {
    encoding: 'utf-8',
  });

  const pluginScript = `
${template}
const plugin = new XenForoFictionPlugin(${JSON.stringify(source)});
export default plugin;
  `.trim();

  return {
    lang: 'English',
    filename: source.sourceName,
    pluginScript,
  };
};
