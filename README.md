 # Upload files to S3 in Payload CMS

This plugin ensures safe filenames with Payload CMS database.  
Resized images are properly supported.

## Why should I use this module?

Payload team supports an official cloud storage plugin, different from this one.

However, this plugin keeps things small and focused. You don't need to install Azure dependencies if you are using AWS.

Also, this plugin allows configuring collection logic on the collection itself.

Payload implementation requires to define collection-specific stuff from plugins inside the global payload configuration file, which is bad design imho!

## Install

`npm install payload-s3-upload --legacy-peer-deps`

Payload requires `legacy-peer-deps` because of conflicts on React and GraphQL dependencies (see Payload [docs](https://payloadcms.com/docs/getting-started/installation)).

## Get Started

### Enable plugin in Payload CMS config

```js
import { S3Client } from '@aws-sdk/client-s3';
import { buildConfig } from 'payload/config';
import s3Upload from 'payload-s3-upload';

export default buildConfig({
  // ...
  plugins: [
    s3Upload(new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_KEY,
        secretAccessKey: process.env.AWS_SECRET,
      },
    })),
  ],
});
```

### Configure your upload collections 

```js
import { S3UploadCollectionConfig } from 'payload-s3-upload';

const Media: S3UploadCollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/assets',
    staticDir: 'assets',
    disableLocalStorage: true,
    s3: {
      bucket: 'my-bucket',
      prefix: 'images/xyz', // files will be stored in bucket folder images/xyz
      // prefix: ({ doc }) => `assets/${doc.type}`, // dynamic prefixes are possible too
      commandInput: {
        // optionally, use here any valid PutObjectCommandInput property
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/putobjectcommandinput.html
        ACL: 'public-read',  
      },
    },
    adminThumbnail: ({ doc }) =>
      `https://my-bucket.s3.eu-west-3.amazonaws.com/images/xyz/${doc.filename}`,
  },
  // create a field to access uploaded files in s3 from payload api
  fields: [
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
        afterRead: [
          ({ data: doc }) =>
            `https://my-bucket.s3.eu-west-3.amazonaws.com/images/${doc.type}/${doc.filename}`,
        ],
      },
    },
  ],
};

export default Media;
```

### Recipe for handling different sizes

This plugin automatically uploads image variants in S3.

However, in order to retrieve correct URLs for the different sizes in the API, additional hooks should be implemented.

```js
import { S3UploadCollectionConfig } from 'payload-s3-upload';

const Media: S3UploadCollectionConfig = {
  slug: 'media',
  upload: {
    // ...
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'center'
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        crop: 'center'
      },
      {
        name: 'tablet',
        width: 1024,
        height: null,
        crop: 'center'
      }
    ],
    adminThumbnail: 'thumbnail',
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        // add a url property on the main image
        doc.url = `${myBucketUrl}/${doc.filename}`

        // add a url property on each imageSize
        Object.keys(doc.sizes)
          .forEach(k => doc.sizes[k].url = `${myBucketUrl}/${doc.sizes[k].filename}`)
      }
    ]
  },
  fields: []
};

export default Media;
```

## Working Example

Please refer to test files.
