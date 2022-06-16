# Upload files to S3 in Payload CMS

This plugin ensures safe filenames with Payload CMS database.  
Resized images are properly supported.

## Install

`npm install payload-s3-upload`

## Get Started

### Enable plugin in Payload CMS config

```js
import { buildConfig } from 'payload/config';
import s3Upload from 'payload-s3-upload';

export default buildConfig({
  // ...
  plugins: [
    s3Upload({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_KEY,
        secretAccessKey: process.env.AWS_SECRET,
      },
    }),
  ],
});
```

### Configure your upload collections 

```js
const Media = {
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

#### Working with image sizes

If you want to configure image sizes, the plugin will automatically upload your variants on the S3 bucket too. However, in order for your API endpoint to return the correct URL for these sizes, you'll have to configure the hook on the collection level.

Here's an example :

```js

const myBucketUrl = 'https://my-bucket.s3.eu-west-3.amazonaws.com/images/xyz'

const Media = {
  slug: 'media',
  upload: {
    // some properties omitted, see previous example
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
    ]
    // use any imageSize name
    adminThumbnail: 'thumbnail'
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
