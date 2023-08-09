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
  const reqFile = req.files?.file ?? null;
  if (reqFile == null) return [];
  const files: File[] = [
    {
      filename: data.filename,
      mimeType: data.mimeType,
      buffer: reqFile.data,
    },
  ];
  if (data.mimeType?.includes('image') && data.sizes != null) {
    Object.entries<FileData>(data.sizes).forEach(([key, sizeData]) => {
      const buffer = req.payloadUploadSizes[key];
      const { filename } = sizeData;

      if (buffer != null || filename != null) {
        files.push({
          buffer,
          filename,
          mimeType: data.mimeType,
        });
      }
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
    const doc = !!beforeChangeOptions.originalDoc ? Object.assign(structuredClone(beforeChangeOptions.originalDoc), beforeChangeOptions.data) : beforeChangeOptions.data;
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      let key = file.filename;
      const bucket = s3.bucket instanceof Function
        ? s3.bucket({ doc })
        : s3.bucket;
      if (s3.prefix) {
        key =
          s3.prefix instanceof Function
            ? path.posix.join(s3.prefix({ doc }), key)
            : path.posix.join(s3.prefix, key);
      }
      let putObjectCommandInput: PutObjectCommandInput = {
        Bucket: bucket,
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
