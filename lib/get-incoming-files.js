module.exports = (beforeChangeOptions) => {
    const { data, req } = beforeChangeOptions;
    const reqFile = req.files && req.files.file ? req.files.file : req.file;
    let files = [{
        filename: data.filename,
        mimeType: data.mimeType,
        buffer: reqFile.data,
    }];
    if (data.sizes) {
        Object.entries(data.sizes).forEach(([key, resizedFileData]) => {
            files = files.concat({
                filename: resizedFileData.filename,
                mimeType: data.mimeType,
                buffer: req.payloadUploadSizes[key],
            });
        });
    }
    return files;
};
