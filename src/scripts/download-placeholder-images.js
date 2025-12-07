// Download placeholder product images from free APIs
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../frontend/public/images');

// Use placeholder.com for free product images
const IMAGES = [
    { name: 'denim_jacket', url: 'https://via.placeholder.com/400x500/4A90E2/FFFFFF?text=Denim+Jacket' },
    { name: 'nike_sneakers', url: 'https://via.placeholder.com/400x500/E74C3C/FFFFFF?text=Nike+Sneakers' },
    { name: 'leather_jacket', url: 'https://via.placeholder.com/400x500/2C3E50/FFFFFF?text=Leather+Jacket' },
    { name: 'floral_dress', url: 'https://via.placeholder.com/400x500/FF69B4/FFFFFF?text=Floral+Dress' },
    { name: 'track_pants', url: 'https://via.placeholder.com/400x500/2ECC71/FFFFFF?text=Track+Pants' },
    { name: 'striped_shirt', url: 'https://via.placeholder.com/400x500/3498DB/FFFFFF?text=Striped+Shirt' },
    { name: 'sunglasses', url: 'https://via.placeholder.com/400x500/95A5A6/FFFFFF?text=Sunglasses' },
    { name: 'winter_coat', url: 'https://via.placeholder.com/400x500/34495E/FFFFFF?text=Winter+Coat' }
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

async function main() {
    console.log(' Downloading placeholder product images...\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const img of IMAGES) {
        const schools = ['mit', 'harvard', 'boston_university', 'northeastern', 'wellesley'];
        
        for (const school of schools) {
            const filename = `${school}_${img.name}.jpg`;
            const filepath = path.join(OUTPUT_DIR, filename);
            
            try {
                await downloadImage(img.url, filepath);
                console.log(`✓ ${filename}`);
            } catch (err) {
                console.error(`✗ Failed to download ${filename}`);
            }
        }
    }

    console.log('\n All placeholder images downloaded!');
    console.log(`📁 Location: ${OUTPUT_DIR}`);
}

main().catch(console.error);
