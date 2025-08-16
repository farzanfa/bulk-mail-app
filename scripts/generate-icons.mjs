// Simple build-time icon generation using favicons (from SVG -> PNG/ICO)
import favicons from 'favicons';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const svgPath = resolve(process.cwd(), 'app/icon.svg');
const publicDir = resolve(process.cwd(), 'public');

// Check if SVG file exists
if (!existsSync(svgPath)) {
  console.warn('Icon generation skipped: SVG file not found at', svgPath);
  process.exit(0);
}

try { 
  mkdirSync(publicDir, { recursive: true }); 
} catch {}

try {
  const svg = readFileSync(svgPath, 'utf8');
  
  // Validate SVG content
  if (!svg.trim() || !svg.includes('<svg')) {
    throw new Error('Invalid SVG content');
  }
  
  const configuration = {
    path: '/',
    appName: 'MailWeaver',
    appShortName: 'MailWeaver',
    appDescription: 'Modern bulk mailing platform',
    theme_color: '#ffe01b',
    background: '#ffffff',
    icons: {
      android: true,
      appleIcon: true,
      appleStartup: false,
      favicons: true,
      windows: false,
      yandex: false
    }
  };
  
  const { images, files } = await favicons(svg, configuration);
  
  for (const img of images) {
    writeFileSync(resolve(publicDir, img.name), img.contents);
  }
  for (const f of files) {
    writeFileSync(resolve(publicDir, f.name), f.contents);
  }
  
  console.log('Generated icons in /public');
} catch (e) {
  console.warn('Icon generation skipped:', e.message || e);
  // Don't fail the build, just warn
  process.exit(0);
}




