# Upload files to S3 in Payload CMS

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
      commandInput: {
        // optionally, use here any valid PutObjectCommandInput property
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/putobjectcommandinput.html
        ACL: 'public-read',  
      },
    },
    adminThumbnail: ({ doc }) =>
      `https://my-bucket.s3.eu-west-3.amazonaws.com/images/xyz/${doc.filename}`,
  },
};

export default Media;
```
