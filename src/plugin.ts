import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import buildUploadHook from './buildUploadHook';
import buildDeleteHook from './buildDeleteHook';
import { S3UploadCollectionConfig } from './types';

const pluginPayloadS3Upload = (s3Client: S3Client | S3ClientConfig) => {
  const client =
    s3Client instanceof S3Client ? s3Client : new S3Client(s3Client);
  return (payloadConfig) => {
    const uploadCollections = payloadConfig.collections.filter(
      (collection) => collection.upload?.s3 != null
    );
    uploadCollections.forEach((collection: S3UploadCollectionConfig) => {
      if (collection.hooks == null) collection.hooks = {};
      if (collection.hooks.beforeChange == null)
        collection.hooks.beforeChange = [];
      if (collection.hooks.afterDelete == null)
        collection.hooks.afterDelete = [];
      collection.hooks.beforeChange.push(buildUploadHook(client, collection));
      collection.hooks.afterDelete.push(buildDeleteHook(client, collection));
      // comply with payload strict checking
      delete collection.upload.s3;
    });
    return payloadConfig;
  };
};

export default pluginPayloadS3Upload;
