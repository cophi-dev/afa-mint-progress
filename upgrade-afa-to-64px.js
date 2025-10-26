#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // npm install sharp

const INPUT_DIR = './public/images';
const BATCH_SIZE = 100; // Process 100 images at a time
const BACKUP_DIR = './public/images-32px-backup'; // Optional backup

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
}

// Track progress
let processed = 0;
let successful = 0;
let failed = 0;
let skipped = 0;

console.log('🚀 Starting AFA thumbnail upgrade: 32px → 64px');
console.log(`📁 Input directory: ${INPUT_DIR}`);
console.log(`💾 Backup directory: ${BACKUP_DIR}`);

async function upgradeImage(filePath) {
  const fileName = path.basename(filePath);
  const tokenId = path.parse(fileName).name;
  const backupPath = path.join(BACKUP_DIR, fileName);
  const tempPath = path.join(INPUT_DIR, `temp_${fileName}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${fileName} (file not found)`);
      skipped++;
      return;
    }
    
    // Get current image info
    const metadata = await sharp(filePath).metadata();
    
    // Skip if already 64px
    if (metadata.width >= 64 && metadata.height >= 64) {
      console.log(`⏭️  Skipping #${tokenId} (already 64px or larger)`);
      skipped++;
      return;
    }
    
    console.log(`🔄 Upgrading #${tokenId} (${metadata.width}x${metadata.height} → 64x64)...`);
    
    // Create backup of original
    fs.copyFileSync(filePath, backupPath);
    
    // Upscale to 64x64 using nearest-neighbor (preserves pixel art style)
    await sharp(filePath)
      .resize(64, 64, {
        kernel: sharp.kernel.nearest, // Maintains crisp pixel art look
        fit: 'fill' // Ensure exactly 64x64
      })
      .png({
        compressionLevel: 6, // Good compression without quality loss
        palette: true // Optimize for pixel art
      })
      .toFile(tempPath);
    
    // Replace original with upgraded version
    fs.renameSync(tempPath, filePath);
    
    successful++;
    console.log(`✅ Upgraded #${tokenId} to 64x64px (${successful} completed)`);
    
  } catch (error) {
    failed++;
    console.error(`❌ Failed to upgrade #${tokenId}:`, error.message);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    // Restore from backup if upgrade failed
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, filePath);
        console.log(`🔄 Restored original #${tokenId} from backup`);
      } catch (restoreError) {
        console.error(`❌ Failed to restore #${tokenId}:`, restoreError.message);
      }
    }
  }
  
  processed++;
}

async function processBatch(batch) {
  const promises = batch.map(upgradeImage);
  await Promise.all(promises);
  
  const total = batch.length * Math.ceil(10000 / BATCH_SIZE); // Rough estimate
  console.log(`\n📊 Progress: ${processed} processed`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}\n`);
}

async function main() {
  console.log('🔍 Scanning for AFA images...');
  
  // Get all PNG files in the images directory
  const allFiles = fs.readdirSync(INPUT_DIR)
    .filter(file => file.endsWith('.png') && /^\d+\.png$/.test(file)) // Only numbered files like 0.png, 1.png, etc.
    .map(file => path.join(INPUT_DIR, file))
    .sort((a, b) => {
      // Sort by token ID number
      const aNum = parseInt(path.parse(a).name);
      const bNum = parseInt(path.parse(b).name);
      return aNum - bNum;
    });
  
  if (allFiles.length === 0) {
    console.log('❌ No AFA images found in', INPUT_DIR);
    process.exit(1);
  }
  
  console.log(`📦 Found ${allFiles.length} AFA images to process`);
  
  // Create batches
  const batches = [];
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    batches.push(allFiles.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Created ${batches.length} batches of ${BATCH_SIZE} images each`);
  
  const startTime = Date.now();
  
  // Process batches
  for (let i = 0; i < batches.length; i++) {
    console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}...`);
    await processBatch(batches[i]);
    
    // Small delay between batches to prevent system overload
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n🎉 AFA thumbnail upgrade complete!');
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log(`✅ Successful upgrades: ${successful}`);
  console.log(`⏭️  Skipped (already 64px+): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (successful > 0) {
    const avgSize = fs.statSync(allFiles[0]).size;
    const estimatedTotal = Math.round((successful * avgSize) / 1024 / 1024);
    console.log(`💾 Estimated new total size: ~${estimatedTotal}MB`);
    console.log(`💾 Backups saved in: ${BACKUP_DIR}`);
  }
  
  if (failed === 0) {
    console.log('\n🚀 All AFA thumbnails are now 64x64px - perfect for all zoom levels!');
    console.log('🔧 Next step: Update BAYC generation script to also create 64px thumbnails');
  } else {
    console.log(`\n⚠️  ${failed} images failed to upgrade. Check the error messages above.`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Process interrupted. Progress saved, backups preserved.');
  console.log(`📊 Progress: ${processed} processed, ${successful} successful, ${failed} failed`);
  process.exit(0);
});

main().catch(console.error);
