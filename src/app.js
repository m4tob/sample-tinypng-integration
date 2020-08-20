const path = require('path');
const fs = require('fs');
const https = require('https');
const tinify = require("tinify");

const config = require('./config');
const testsuite = require('./testsuite');

tinify.key = config.API_KEY;

const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, 0744); }

run();

async function run() {
    await tinify.validate();
    console.log(`Total usage this month: ${tinify.compressionCount}/500\n`);

    await tinyImgFromUrl();
    await tinyImgFromFile();
    await tinyImgFromBase64();
    // resizeImg();
    // preserveMetadata

    await tinify.validate();
    console.log(`\nTotal usage this month: ${tinify.compressionCount}/500`);
}

async function tinyImgFromUrl() {
    // Execute TinyPNG from URL
    const outputUrl = path.join(outputDir, 'url');
    if (!fs.existsSync(outputUrl)) { fs.mkdirSync(outputUrl, 0744); }

    for (let i = 0; i < testsuite.urls.length; i++) {
        let url = testsuite.urls[i];
        let name = url.substring(url.lastIndexOf('/') + 1);

        let input = path.join(outputUrl, 'in');
        if (!fs.existsSync(input)) { fs.mkdirSync(input, 0744); }
        input = path.join(input, name);

        let output = path.join(outputUrl, 'out');
        if (!fs.existsSync(output)) { fs.mkdirSync(output, 0744); }
        output = path.join(output, name);

        downloadImg(url, input);

        console.log(`Optimizing from URL: ${url}`)
        await tinify.fromUrl(url)
            .toFile(output)
            .then(() => logResult(input, output))
            .catch((error) => console.error(error));
    }
}

async function tinyImgFromFile() {
    // Execute TinyPNG from files
    const outputFile = path.join(outputDir, 'file');
    if (!fs.existsSync(outputFile)) { fs.mkdirSync(outputFile, 0744); }

    for (let i = 0; i < testsuite.files.length; i++) {
        let file = testsuite.files[i].file;
        let file_name = testsuite.files[i].name;
        let output = path.join(outputFile, file_name);

        console.log(`Optimizing from file: ${file_name}`)
        await tinify.fromFile(file)
            .toFile(output)
            .then(() => logResult(file, output))
            .catch((error) => console.error(error));
    }
}

async function tinyImgFromBase64() {
    // Execute TinyPNG from Base 64 data
    const outputBase64 = path.join(outputDir, 'base64');
    if (!fs.existsSync(outputBase64)) { fs.mkdirSync(outputBase64, 0744); }

    for (let i = 0; i < testsuite.files.length; i++) {
        let file = testsuite.files[i].file;
        let file_name = testsuite.files[i].name;
        let data = testsuite.files[i].data;
        let output = path.join(outputBase64, file_name);

        console.log(`Optimizing from Base64: ${file_name}`)
        await tinify.fromBuffer(Buffer.from(data, 'base64'))
            .toFile(output)
            .then(() => logResult(file, output))
            .catch((error) => console.error(error));
    }
}

// Log the compression result
function logResult(input, output) {
    let size_in = fs.statSync(input).size / 1024; // KB
    if (size_in > 10240) { size_in /= 1024; }// > 10KB - Convert to MB
    let size_in_formatted = size_in.toFixed(2) + ((size_in > 10240) ? 'MB' : 'KB');

    let size_out = fs.statSync(output).size / 1024; // KB
    if (size_out > 10240) { size_out /= 1024; }// > 10KB - Convert to MB
    let size_out_formatted = size_out.toFixed(2) + ((size_out > 10240) ? 'MB' : 'KB');

    let optimization_rate = 100 - ((size_out * 100) / size_in);
    let optimization_rate_formatted = `${optimization_rate.toFixed(2)}%`;

    console.log(`\tUnoptimized size: ${size_in_formatted}`);
    console.log(`\tOptimized size: ${size_out_formatted}`);
    console.log(`\tOptimization Rate: ${optimization_rate_formatted}`);
}

async function downloadImg(url, output) {
    let file = fs.createWriteStream(output);
    await https.get(url, (res) => res.pipe(file));
}

function resizeImg(source) {
    const resized = source.resize({
        method: "fit", // [ scale, fit, cover, thumb ]
        width: 150,
        height: 100
    });
    return resized;
}

function preserveMetadata(source) {
    const preserved = source.preserve("copyright", "creation"/*, "location" (JPEG only) */);
    return preserved;
}
