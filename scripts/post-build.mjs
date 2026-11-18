import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
// Angular 22 application builder may emit into dist/browser; use whichever holds index.html.
const out = existsSync(join(dist, 'index.html')) ? dist : join(dist, 'browser');
copyFileSync(join(out, 'index.html'), join(out, '404.html'));
writeFileSync(join(out, '.nojekyll'), '');
console.log(`post-build: wrote 404.html and .nojekyll in ${out}`);
