#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp'); // npm install sharp
const mappingData = require('./src/data/mapping.json');

const BATCH_SIZE = 50; // Process 50 images at a time
const OUTPUT_DIR = './public/bayc-images';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Track progress
let processed = 0;
let successful = 0;
let failed = 0;
const total = mappingData.length;

console.log(`🚀 Starting BAYC 64x64px thumbnail generation for ${total} images`);
console.log(`📁 Output directory: ${OUTPUT_DIR}`);

async function downloadImage(url, outputPath, retries = RETRY_ATTEMPTS) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(outputPath, () => {});
        
        if (retries > 0) {
          console.log(`⚠️  Retrying ${url} (${RETRY_ATTEMPTS - retries + 1}/${RETRY_ATTEMPTS})`);
          setTimeout(() => {
            downloadImage(url, outputPath, retries - 1)
              .then(resolve)
              .catch(reject);
          }, RETRY_DELAY);
          return;
        }
        
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {});
      
      if (retries > 0) {
        console.log(`⚠️  Retrying ${url} (${RETRY_ATTEMPTS - retries + 1}/${RETRY_ATTEMPTS})`);
        setTimeout(() => {
          downloadImage(url, outputPath, retries - 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
        return;
      }
      
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

async function generateThumbnail(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(64, 64, {
        kernel: sharp.kernel.lanczos3, // Smooth high-quality downsampling for BAYC art
        fit: 'cover'
      })
      .png({
        compressionLevel: 6, // Good compression without quality loss
        quality: 90 // High quality for smooth art (not palette optimized)
      })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`❌ Thumbnail generation failed for ${inputPath}:`, error.message);
    return false;
  }
}

async function processImage(item) {
  const tokenId = item.id;
  const imageUrl = item.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
  const tempPath = path.join(OUTPUT_DIR, `temp_${tokenId}.png`);
  const finalPath = path.join(OUTPUT_DIR, `${tokenId}.png`);
  
  // Skip if already exists
  if (fs.existsSync(finalPath)) {
    console.log(`⏭️  Skipping #${tokenId} (already exists)`);
    processed++;
    successful++;
    return true;
  }
  
  try {
    console.log(`📥 Downloading #${tokenId}...`);
    
    // Download original image
    await downloadImage(imageUrl, tempPath);
    
    // Generate 64x64 thumbnail
    const thumbnailSuccess = await generateThumbnail(tempPath, finalPath);
    
    // Clean up temp file
    fs.unlink(tempPath, () => {});
    
    if (thumbnailSuccess) {
      processed++;
      successful++;
      console.log(`✅ Generated thumbnail #${tokenId} (${successful}/${total})`);
      return true;
    } else {
      processed++;
      failed++;
      return false;
    }
    
  } catch (error) {
    processed++;
    failed++;
    console.error(`❌ Failed to process #${tokenId}:`, error.message);
    
    // Clean up any temp files
    if (fs.existsSync(tempPath)) {
      fs.unlink(tempPath, () => {});
    }
    
    return false;
  }
}

async function processBatch(batch) {
  const promises = batch.map(processImage);
  await Promise.all(promises);
  
  console.log(`\n📊 Progress: ${processed}/${total} (${Math.round(processed/total*100)}%)`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}\n`);
}

async function main() {
  console.log('🔍 Preparing batches...');
  
  // Create batches
  const batches = [];
  for (let i = 0; i < mappingData.length; i += BATCH_SIZE) {
    batches.push(mappingData.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Created ${batches.length} batches of ${BATCH_SIZE} images each`);
  
  const startTime = Date.now();
  
  // Process batches sequentially to avoid overwhelming IPFS
  for (let i = 0; i < batches.length; i++) {
    console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}...`);
    await processBatch(batches[i]);
    
    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n🎉 BAYC thumbnail generation complete!');
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log(`✅ Successful: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
  console.log(`❌ Failed: ${failed}/${total} (${Math.round(failed/total*100)}%)`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some images failed to download. You can re-run this script to retry failed images.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted. Current progress saved.');
  console.log(`📊 Progress: ${processed}/${total} (${Math.round(processed/total*100)}%)`);
  process.exit(0);
});

main().catch(console.error);
