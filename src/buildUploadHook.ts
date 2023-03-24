import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { CollectionBeforeChangeHook } from 'payload/types';
import { FileData } from 'payload/dist/uploads/types';
import { S3UploadCollectionConfig, File } from './types';

const getFilesToUpload: CollectionBeforeChangeHook = ({
  data,
  req,
}): File[] => {
  const reqFile = req.files?.file ?? req.file ?? null;
  if (reqFile == null) return [];
  const files: File[] = [
    {
      filename: data.filename,
      mimeType: data.mimeType,
      buffer: reqFile.data,
    },
  ];
  if (data.sizes != null) {
    Object.entries<FileData>(data.sizes).forEach(([key, sizeData]) => {
      files.push({
        filename: sizeData.filename,
        mimeType: data.mimeType,
        buffer: req.payloadUploadSizes[key],
      });
    });
  }
  return files;
};

const buildUploadHook = (
  s3Client: S3Client,
  collection: S3UploadCollectionConfig
): CollectionBeforeChangeHook => {
  const { s3 } = collection.upload;
  const uploadHook: CollectionBeforeChangeHook = async (
    beforeChangeOptions
  ) => {
    const files = getFilesToUpload(beforeChangeOptions);
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      let key = file.filename;
      if (s3.prefix) {
        key =
          s3.prefix instanceof Function
            ? path.posix.join(s3.prefix({ doc: beforeChangeOptions.data }), key)
            : path.posix.join(s3.prefix, key);
      }
      let putObjectCommandInput: PutObjectCommandInput = {
        Bucket: s3.bucket,
        Key: key,
        Body: file.buffer,
      };
      if (file.mimeType) {
        putObjectCommandInput.ContentType = file.mimeType;
      }
      if (s3.commandInput) {
        const commandInputEntries = Object.entries(s3.commandInput).map(
          ([property, value]) => [
            property,
            typeof value === 'function' ? value(beforeChangeOptions) : value,
          ]
        );
        putObjectCommandInput = {
          ...putObjectCommandInput,
          ...Object.fromEntries(commandInputEntries),
        };
      }
      await s3Client.send(new PutObjectCommand(putObjectCommandInput));
    }
  };
  return uploadHook;
};

export default buildUploadHook;
