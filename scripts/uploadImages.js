const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

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

const uploadDir = path.join(__dirname, '../upload_images');

function uploadToCloudinary(filePath, publicId) {
    return new Promise((resolve, reject) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'images';
        const strToSign = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

        const fileData = fs.readFileSync(filePath);
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
        
        postData += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
        
        const headerEnd = Buffer.from(postData, 'utf8');
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
        
        const payloadLength = headerEnd.length + fileData.length + footer.length;
        
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
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`Upload failed with status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        
        req.write(headerEnd);
        req.write(fileData);
        req.write(footer);
        req.end();
    });
}

async function main() {
    const files = fs.readdirSync(uploadDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    console.log(`Олдсон зургийн тоо: ${files.length}. Cloudinary руу хуулж эхэллээ...`);
    
    // Group files by site id
    const siteImages = {};
    files.forEach(f => {
       const match = f.match(/^(\d+)(?:-\d+)?\./i);
       if (match) {
           const siteId = parseInt(match[1]);
           if (!siteImages[siteId]) siteImages[siteId] = [];
           siteImages[siteId].push(f);
       }
    });

    const uploadedUrls = {};
    let totalUploaded = 0;
    
    for (const [siteId, imageFiles] of Object.entries(siteImages)) {
        uploadedUrls[siteId] = [];
        // Sort: 1.jpg comes before 1-1.jpg
        imageFiles.sort((a,b) => a.length - b.length || a.localeCompare(b));
        
        for (const img of imageFiles) {
            const filePath = path.join(uploadDir, img);
            const publicId = path.parse(img).name;
            try {
                process.stdout.write(`Хуулж байна: ${img}... `);
                const result = await uploadToCloudinary(filePath, publicId);
                uploadedUrls[siteId].push(result.secure_url);
                console.log(`Амжилттай!`);
                totalUploaded++;
            } catch(e) {
                console.error(`Алдаа гарлаа:`, e.message);
            }
        }
    }

    fs.writeFileSync(path.join(__dirname, 'upload_results.json'), JSON.stringify(uploadedUrls, null, 2));
    console.log(`\n========================================`);
    console.log(`АМЖИЛТТАЙ! Нийт ${totalUploaded} зургийг хуулж дууслаа.`);
    console.log(`Үр дүнг 'scripts/upload_results.json' файлд хадгаллаа.`);
    console.log(`========================================`);
}

main().catch(console.error);
