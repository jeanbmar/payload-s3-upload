module.exports = (afterDeleteOptions) => {
    const { doc } = afterDeleteOptions;
    let files = [{
        filename: doc.filename,
    }];
    if (doc.sizes) {
        Object.values(doc.sizes).forEach((fileData) => {
            files = files.concat({
                filename: fileData.filename,
            });
        });
    }
    return files;
};
