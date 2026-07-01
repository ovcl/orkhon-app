const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const sharp = require('sharp');

// Inline .env.local loader
try {
    const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^#\s][^=]+)=(.*)/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        }
    });
} catch (e) {
    // Ignore error if file doesn't exist
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error("Missing Cloudinary credentials. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local");
    process.exit(1);
}

const uploadDir = path.join(__dirname, '../upload_panoramas');

function uploadToCloudinary(fileBuffer, publicId, fileName) {
    return new Promise((resolve, reject) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'panoramas';
        const strToSign = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
        let postData = '';
        const appendField = (name, value) => {
            postData += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
        };
        appendField('api_key', apiKey);
        appendField('timestamp', timestamp);
        appendField('signature', signature);
        appendField('folder', folder);
        appendField('overwrite', 'true');
        appendField('public_id', publicId);
        postData += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
        const headerEnd = Buffer.from(postData, 'utf8');
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
        const payloadLength = headerEnd.length + fileBuffer.length + footer.length;
        const options = {
            hostname: 'api.cloudinary.com',
            port: 443,
            path: `/v1_1/${cloudName}/image/upload`,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': payloadLength
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(JSON.parse(body));
                else reject(new Error(`Upload failed: ${res.statusCode} - ${body}`));
            });
        });
        req.on('error', reject);
        req.write(headerEnd);
        req.write(fileBuffer);
        req.write(footer);
        req.end();
    });
}

async function main() {
    const files = fs.readdirSync(uploadDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    console.log(`Панорама зургийн тоо: ${files.length}. Жижигрүүлж, Cloudinary руу хуулж эхэллээ...`);

    const results = {};

    for (const img of files) {
        const filePath = path.join(uploadDir, img);
        const siteId = path.parse(img).name;
        try {
            process.stdout.write(`Хуулж байна: ${img} ... `);
            // Panorama: max 4096px wide, keep 2:1 ratio, quality 85
            const optimizedBuffer = await sharp(filePath)
                .resize(4096, 2048, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();
            const result = await uploadToCloudinary(optimizedBuffer, `pano-${siteId}`, img);
            results[siteId] = result.secure_url;
            console.log(`Амжилттай! (${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        } catch(e) {
            console.error(`Алдаа: ${e.message}`);
        }
    }

    // Now update sites.js
    const sitesPath = path.join(__dirname, '../app/data/sites.js');
    let sitesContent = fs.readFileSync(sitesPath, 'utf8');

    for (const [siteId, url] of Object.entries(results)) {
        const idNum = parseInt(siteId);
        const idPattern = new RegExp(`"id":\\s*${idNum}\\b`);
        const idMatch = sitesContent.match(idPattern);
        if (!idMatch) {
            console.log(`ID ${siteId} олдсонгүй`);
            continue;
        }
        const idPos = sitesContent.indexOf(idMatch[0]);
        const afterId = sitesContent.substring(idPos);

        // Check if panoramaUrl already exists
        const existingPanorama = afterId.match(/"panoramaUrl":\s*"[^"]*",?\n/);
        if (existingPanorama) {
            const fullPos = idPos + afterId.indexOf(existingPanorama[0]);
            sitesContent = sitesContent.substring(0, fullPos) +
                `"panoramaUrl": "${url}",\n` +
                sitesContent.substring(fullPos + existingPanorama[0].length);
        } else {
            // Insert panoramaUrl before "images"
            const imagesPos = afterId.indexOf('"images"');
            if (imagesPos !== -1) {
                const insertPos = idPos + imagesPos;
                const indent = '        ';
                sitesContent = sitesContent.substring(0, insertPos) +
                    `"panoramaUrl": "${url}",\n${indent}` +
                    sitesContent.substring(insertPos);
            }
        }
        console.log(`✅ ID ${siteId}: panoramaUrl нэмэгдлээ`);
    }

    fs.writeFileSync(sitesPath, sitesContent, 'utf8');
    console.log(`\n========================================`);
    console.log(`АМЖИЛТТАЙ! ${Object.keys(results).length} панорама зураг хуулж, sites.js шинэчлэгдлээ.`);
    console.log(`========================================`);
}

main().catch(console.error);
