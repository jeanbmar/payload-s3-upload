import path from 'path';
import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { CollectionAfterDeleteHook } from 'payload/types';
import { FileData } from 'payload/dist/uploads/types';
import { S3UploadCollectionConfig } from './types';

const getFilesToDelete: CollectionAfterDeleteHook = (afterDeleteOptions) => {
  const { doc } = afterDeleteOptions;
  const files: string[] = [doc.filename];
  if (doc.mimeType?.includes('image') && doc.sizes != null) {
    Object.values<FileData>(doc.sizes).forEach((fileData) => {
      if (fileData.filename != null) files.push(fileData.filename);
    });
  }
  return files;
};

const buildDeleteHook = (
  s3Client: S3Client,
  collection: S3UploadCollectionConfig
) => {
  const { s3 } = collection.upload;
  const deleteHook: CollectionAfterDeleteHook = async (afterDeleteOptions) => {
    const filenames = getFilesToDelete(afterDeleteOptions);
    // eslint-disable-next-line no-restricted-syntax
    for (const filename of filenames) {
      let key = filename;
      if (s3.prefix) {
        key =
          s3.prefix instanceof Function
            ? path.posix.join(s3.prefix({ doc: afterDeleteOptions.doc }), key)
            : path.posix.join(s3.prefix, key);
      }
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3.bucket,
          Key: key,
        } as DeleteObjectCommandInput)
      );
    }
  };
  return deleteHook;
};

export default buildDeleteHook;
