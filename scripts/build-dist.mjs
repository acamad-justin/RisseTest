import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const buildDir = path.join(rootDir, 'public', 'build');
const manifestPath = path.join(buildDir, 'manifest.json');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(manifestPath)) {
  console.error('[build-dist] Error: public/build/manifest.json not found. Did vite build run?');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

let entryJs = '';
const cssFiles = new Set();

for (const key of Object.keys(manifest)) {
  const item = manifest[key];
  if (item.isEntry && item.file && item.file.endsWith('.js')) {
    entryJs = item.file;
  }
  if (item.file && item.file.endsWith('.css')) {
    cssFiles.add(item.file);
  }
  if (Array.isArray(item.css)) {
    item.css.forEach(c => cssFiles.add(c));
  }
}

// Ensure clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy public/build/assets to dist/assets
const buildAssetsDir = path.join(buildDir, 'assets');
const distAssetsDir = path.join(distDir, 'assets');
if (fs.existsSync(buildAssetsDir)) {
  fs.cpSync(buildAssetsDir, distAssetsDir, { recursive: true });
}

// Copy public/images to dist/images if exists
const publicImagesDir = path.join(rootDir, 'public', 'images');
const distImagesDir = path.join(distDir, 'images');
if (fs.existsSync(publicImagesDir)) {
  fs.cpSync(publicImagesDir, distImagesDir, { recursive: true });
}

// Copy public/favicon.ico to dist/favicon.ico if exists
const favicon = path.join(rootDir, 'public', 'favicon.ico');
if (fs.existsSync(favicon)) {
  fs.copyFileSync(favicon, path.join(distDir, 'favicon.ico'));
}

// Generate index.html
const cssTags = Array.from(cssFiles)
  .map(file => `    <link rel="stylesheet" href="/${file}">`)
  .join('\n');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Profile - Risse</title>

    <!-- Google Fonts: Plus Jakarta Sans & Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

${cssTags}
</head>
<body class="antialiased">
    <div id="app"></div>
    <script type="module" src="/${entryJs}"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf8');
console.log('[build-dist] ✓ Successfully generated dist/ with index.html and assets for Vercel deployment.');
