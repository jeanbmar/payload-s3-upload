import { Buffer } from 'node:buffer';
import { S3Client } from '@aws-sdk/client-s3';
import { CollectionConfig } from 'payload/types';
import { IncomingUploadType } from 'payload/dist/uploads/types';

export type S3UploadConfig = {
  client?: S3Client;
  bucket: string;
  prefix: string | Function;
  commandInput: any;
};

export type S3IncomingUploadType = {
  s3: S3UploadConfig;
} & IncomingUploadType;

export type S3UploadCollectionConfig = {
  upload: S3IncomingUploadType;
} & CollectionConfig;

export type File = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};
