const path = require('path');

module.exports = (data, oldFilename, newFilename) => {
    const oldBasename = path.basename(oldFilename, path.extname(oldFilename));
    const newBasename = path.basename(newFilename, path.extname(newFilename));
    data.filename = data.filename.replace(oldBasename, newBasename);
    if (data.sizes) {
        Object.values(data.sizes).forEach((resizedFileData) => {
            resizedFileData.filename = resizedFileData.filename.replace(oldBasename, newBasename);
        });
    }
};
