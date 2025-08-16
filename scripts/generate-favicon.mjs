#!/usr/bin/env node
// Simple script to copy SVG as favicon fallback
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const svgPath = resolve(process.cwd(), 'app/icon.svg');
const publicDir = resolve(process.cwd(), 'public');
const faviconPath = resolve(publicDir, 'favicon.svg');

if (existsSync(svgPath) && existsSync(publicDir)) {
  try {
    // Copy SVG as favicon.svg (modern browsers support SVG favicons)
    copyFileSync(svgPath, faviconPath);
    console.log('✓ Copied icon.svg to public/favicon.svg');
    
    // Note: For full favicon support, you would need to:
    // 1. Install sharp or another image processing library
    // 2. Convert SVG to PNG in various sizes
    // 3. Generate .ico file from the PNGs
    // For now, we're using SVG which is supported by modern browsers
    
    console.log('\nFor full favicon support, consider:');
    console.log('- Installing sharp: npm install --save-dev sharp');
    console.log('- Generating PNG versions in multiple sizes');
    console.log('- Creating a proper .ico file');
  } catch (error) {
    console.error('Error copying favicon:', error.message);
  }
} else {
  console.warn('Icon or public directory not found');
}