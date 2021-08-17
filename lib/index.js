const path = require('path');
const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const getIncomingFiles = require('./get-incoming-files');
const getFilesToDelete = require('./get-files-to-delete');
const getSafeFilename = require('./get-safe-filename');

module.exports = (s3Config) => {
    const client = new S3Client(s3Config);
    return (incomingConfig) => {
        const { collections: incomingCollections } = incomingConfig;
        const collections = incomingCollections.map((incomingCollection) => {
            if (!incomingCollection.upload || !incomingCollection.upload.s3) {
                return incomingCollection;
            }
            const incomingCollectionHooks = incomingCollection.hooks ?? {};
            let beforeOperationCollectionHooks = incomingCollectionHooks.beforeOperation ?? [];
            let beforeChangeCollectionHooks = incomingCollectionHooks.beforeChange ?? [];
            let afterDeleteCollectionHooks = incomingCollectionHooks.afterDelete ?? [];
            const { s3 } = incomingCollection.upload;
            // ensure safe filenames
            beforeOperationCollectionHooks = beforeOperationCollectionHooks.concat(async ({ args, operation }) => {
                // req is mutated
                if (operation === 'create') {
                    const { req, collection } = args;
                    const reqFile = req.files && req.files.file ? req.files.file : req.file;
                    reqFile.name = await getSafeFilename(req.payload, collection.config.slug, reqFile.name);
                }
                return args;
            });
            // manage new files
            beforeChangeCollectionHooks = beforeChangeCollectionHooks.concat(async (beforeChangeOptions) => {
                const files = getIncomingFiles(beforeChangeOptions);
                // eslint-disable-next-line no-restricted-syntax
                for (const file of files) {
                    const key = s3.prefix
                        ? path.posix.join(s3.prefix, file.filename)
                        : file.filename;
                    let putObjectCommandInput = {
                        Bucket: s3.bucket,
                        Key: key,
                        Body: file.buffer,
                    };
                    if (file.mimeType) {
                        putObjectCommandInput = {
                            ...putObjectCommandInput,
                            ContentType: file.mimeType,
                        };
                    }
                    if (s3.commandInput) {
                        const commandInputEntries = Object.entries(s3.commandInput)
                            .map(([property, value]) => [
                                property,
                                typeof value === 'function' ? value(beforeChangeOptions) : value,
                            ]);
                        putObjectCommandInput = {
                            ...putObjectCommandInput,
                            ...Object.fromEntries(commandInputEntries),
                        };
                    }
                    await client.send(new PutObjectCommand(putObjectCommandInput));
                }
            });
            // manage deleted files
            afterDeleteCollectionHooks = afterDeleteCollectionHooks.concat(async (afterDeleteOptions) => {
                const files = getFilesToDelete(afterDeleteOptions);
                // eslint-disable-next-line no-restricted-syntax
                for (const file of files) {
                    const key = s3.prefix
                        ? path.posix.join(s3.prefix, file.filename)
                        : file.filename;
                    await client.send(new DeleteObjectCommand({
                        Bucket: s3.bucket,
                        Key: key,
                    }));
                }
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
                    beforeOperation: beforeOperationCollectionHooks,
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
