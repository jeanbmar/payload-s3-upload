// forked from src/uploads/getSafeFilename.ts
const sanitize = require('sanitize-filename');
const fileExists = require('./file-exists');

const incrementName = (name) => {
    const extension = name.split('.').pop();
    const baseFilename = sanitize(name.substr(0, name.lastIndexOf('.')) || name);
    let incrementedName = baseFilename;
    const regex = /(.*)-(\d)$/;
    const found = baseFilename.match(regex);
    if (found === null) {
        incrementedName += '-1';
    } else {
        const matchedName = found[1];
        const matchedNumber = found[2];
        const incremented = Number(matchedNumber) + 1;
        incrementedName = `${matchedName}-${incremented}`;
    }
    return `${incrementedName}.${extension}`;
};

module.exports = async (payload, slug, desiredFilename) => {
    let modifiedFilename = desiredFilename;

    // eslint-disable-next-line no-await-in-loop
    while (await fileExists(payload, slug, modifiedFilename)) {
        modifiedFilename = incrementName(modifiedFilename);
    }
    return modifiedFilename;
};
