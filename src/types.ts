import { Buffer } from 'node:buffer';
import { CollectionConfig } from 'payload/types';
import { IncomingUploadType } from 'payload/dist/uploads/types';

export type S3PathFactory = ((args: {
  doc: Partial<{
    id: string;
    filename: string;
    mimeType: string;
    filesize: number;
    width: number;
    height: number;
    [key: string]: any
  }>
}) => string);

export type S3UploadConfig = {
  bucket: string | S3PathFactory;
  prefix?: string | S3PathFactory;
  commandInput?: any;
};

export type S3IncomingUploadType = {
  s3: S3UploadConfig;
} & IncomingUploadType;

export type S3UploadCollectionConfig = {
  upload: S3IncomingUploadType;
} & CollectionConfig;

export type File = {
  filename: string;
  mimeType?: string;
  buffer: Buffer;
};
