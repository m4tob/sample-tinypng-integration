const path = require('path');
const fs = require('fs');

module.exports = {
    files: loadFiles(),
    urls: [
        "https://tinypng.com/images/panda-happy.png"
    ]
};

function loadFiles() {
    const directoryPath = path.join(__dirname, '../testsuite');
    let files = [];

    let _files = fs.readdirSync(directoryPath);
    _files.forEach((file) => {
        let img_file = path.join(directoryPath, file);
        let data = fs.readFileSync(img_file, { encoding: 'base64' });
        files.push({
            file: img_file,
            name: file,
            data: data
        });
    });

    return files;
}
