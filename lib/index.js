const path = require('path');
const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

module.exports = (s3Config) => {
    const client = new S3Client(s3Config);
    return (incomingConfig) => {
        const { collections: incomingCollections } = incomingConfig;
        const collections = incomingCollections.map((incomingCollection) => {
            if (!incomingCollection.upload || !incomingCollection.upload.s3) {
                return incomingCollection;
            }
            const incomingCollectionHooks = incomingCollection.hooks ?? {};
            let beforeChangeCollectionHooks = incomingCollectionHooks.beforeChange ?? [];
            let afterDeleteCollectionHooks = incomingCollectionHooks.afterDelete ?? [];
            const { s3 } = incomingCollection.upload;
            beforeChangeCollectionHooks = beforeChangeCollectionHooks.concat(async (beforeChangeOptions) => {
                const { data, req } = beforeChangeOptions;
                const key = s3.prefix
                    ? path.posix.join(s3.prefix, data.filename)
                    : data.filename;
                let putObjectCommandInput = {
                    Bucket: s3.bucket,
                    Key: key,
                    Body: req.files.file.data,
                };
                if (req.files.file.mimetype) {
                    putObjectCommandInput = {
                        ...putObjectCommandInput,
                        ContentType: req.files.file.mimetype,
                    }
                }
                if (s3.commandInput) {
                    const commandInputEntries = Object.entries(s3.commandInput)
                        .map(([key, value]) => [
                            key,
                            typeof value === 'function' ? value(beforeChangeOptions) : value,
                        ]);
                    putObjectCommandInput = {
                        ...putObjectCommandInput,
                        ...Object.fromEntries(commandInputEntries),
                    };
                }
                await client.send(new PutObjectCommand(putObjectCommandInput));
                return data;
            });
            afterDeleteCollectionHooks = afterDeleteCollectionHooks.concat(async function({ doc }) {
                const key = s3.prefix
                    ? path.posix.join(s3.prefix, doc.filename)
                    : doc.filename;
                await client.send(new DeleteObjectCommand({
                    Bucket: s3.bucket,
                    Key: key,
                }));
                return doc;
            });
            // remove s3 key to satisfy type checking
            const { s3: remove, ...clonedUpload } = incomingCollection.upload;
            return {
                ...incomingCollection,
                upload: {
                    ...clonedUpload,
                },
                hooks: {
                    ...incomingCollectionHooks,
                    beforeChange: beforeChangeCollectionHooks,
                    afterDelete: afterDeleteCollectionHooks,
                },
            };
        });
        return {
            ...incomingConfig,
            collections,
        };
    };
};
