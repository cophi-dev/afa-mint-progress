#!/usr/bin/env node
/**
 * Generates WebP thumbnails alongside existing PNGs in public/images and public/bayc-images.
 * Run: node scripts/generate-webp.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd(), 'public');

const dirs = ['images', 'bayc-images'];

const convertDir = async (dirName) => {
  const dir = path.join(ROOT, dirName);
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.png'));
  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const pngPath = path.join(dir, file);
    const webpPath = path.join(dir, file.replace(/\.png$/, '.webp'));
    const pngStat = await fs.stat(pngPath);
    const webpStat = await fs.stat(webpPath).catch(() => null);

    if (webpStat && webpStat.mtimeMs >= pngStat.mtimeMs) {
      skipped += 1;
      continue;
    }

    await sharp(pngPath)
      .webp({ quality: 80, effort: 4 })
      .toFile(webpPath);
    converted += 1;

    if (converted % 500 === 0) {
      process.stdout.write(`  ${dirName}: ${converted} converted…\n`);
    }
  }

  return { converted, skipped, total: files.length };
};

const main = async () => {
  for (const dir of dirs) {
    process.stdout.write(`Converting ${dir}…\n`);
    const result = await convertDir(dir);
    process.stdout.write(
      `  done — ${result.converted} converted, ${result.skipped} up-to-date (${result.total} pngs)\n`
    );
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
