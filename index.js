'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    region: process.env.AWS_REGION
});
const bucketName = process.env.BUCKET;

const dist = process.env.DIST;

(async () => {
    const getContentType = fileNameWithExt => {
        const tempArray = fileNameWithExt.split(/[.]/gi);
        const fileExtenstion = tempArray[tempArray.length - 1];
        let type = '';
        switch (fileExtenstion) {
            case 'css':
                type = 'text/css';
                break;
            case 'js':
                type = 'text/js';
                break;
            case 'map':
                type = 'application/octet-stream';
                break;
            case 'xml':
                type = 'text/xml';
                break;
            case 'jpeg':
            case 'jpg':
                type = 'image/jpeg';
                break;
            case 'ico':
                type = 'image/x-icon';
                break;
            case 'png':
                type = 'image/png';
                break;
            case 'json':
                type = 'application/json';
                break;
            case 'html':
                type = 'text/html';
                break;
            case 'woff2':
                type = 'application/font-woff2';
                break;
            case 'ttf':
                type = 'application/x-font-ttf';
                break;
            case 'svg':
                type = 'image/svg+xml';
                break;
            case 'txt':
                type = 'text/plain';
                break;
            default:
                type = '';
                break;
        }
        return type;
    };

    // Recursively read and upload files in a given directory.
    const readDir = async dir => {
        const fileNames = fs.readdirSync(dir, 'utf8');
        fileNames.forEach(async fileName => {
            const isDir = fs.lstatSync(`${dir}/${fileName}`).isDirectory();
            if (isDir) {
                readDir(`${dir}/${fileName}`);
            } else {
                const srcFile = `${dir}/${fileName}`;
                const buffer = fs.readFileSync(srcFile);

                const contentType = getContentType(fileName);
                // CloudFront needs to know file content-length
                // to determine compression.
                const contentLength = buffer.byteLength;
                const maxAge = fileName === 'index.html' ? 0 : 604800;

                const dstDir = `${dir.slice(dist.length)}`;
                // Remove / prefix.
                const key = `${dstDir}/${fileName}`.slice(1);

                try {
                    await s3
                        .upload({
                            ACL: 'public-read',
                            ContentType: contentType,
                            ContentLength: contentLength,
                            CacheControl: `public, max-age=${maxAge}`,
                            Bucket: bucketName,
                            Key: key,
                            Body: buffer
                        })
                        .promise();
                    console.log(`${key} uploaded successfully`);
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    await readDir(dist);
})();
