import { buildConfig } from 'payload/config';
import { S3UploadCollectionConfig } from '../dist/types';
import s3Upload from '../dist';

export default buildConfig({
  collections: [
    {
      slug: 'media',
      access: {
        create: () => true,
        read: () => true,
        update: () => true,
        delete: () => true,
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Dog', value: 'images/dogs' },
            { label: 'Car', value: 'images/cars' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          access: {
            create: () => false,
          },
          admin: {
            disabled: true,
          },
          hooks: {
            beforeChange: [() => undefined],
            afterRead: [
              ({ data: doc }) =>
                `https://payloadcms.com/${doc.type}/${doc.filename}`,
            ],
          },
        },
      ],
      upload: {
        staticURL: '/assets',
        staticDir: 'assets',
        disableLocalStorage: true,
        s3: {
          bucket: 'payload-s3-upload',
          prefix: ({ doc }) => doc.type,
        },
        adminThumbnail: ({ doc }) =>
          `https://cdn.payloadcms.com/${doc.type}/${doc.filename}`,
        imageSizes: [
          {
            name: 'small',
            width: 400,
            height: 400,
            position: 'centre',
          },
          {
            name: 'medium',
            width: 800,
            height: undefined,
            position: 'centre',
          },
        ],
      },
    } as S3UploadCollectionConfig,
  ],
  plugins: [s3Upload()],
});
