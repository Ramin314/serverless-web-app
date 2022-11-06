import { S3 } from 'aws-sdk';

export async function handler(event) {
  try {
    const s3 = new S3({
      region: process.env.REGION,
    });

    const { userId } = event.queryStringParameters;
    const date = new Date().toISOString().replace(/[-.:TZ]/g, '');
    const random = parseInt(Math.random() * 1_000_000);
    const key = `${process.env.BASE_DIRECTORY}/${userId}-${date}-${random}`;

    const presignedPost = s3.createPresignedPost({
      Bucket: process.env.BUCKET_NAME,
      Fields: {
        key: key,
        acl: 'public-read',
      },
      Conditions: [
        ['content-length-range', 0, parseInt(process.env.MAXIMUM_FILE_SIZE)],
        ['starts-with', '$Content-Type', process.env.FILE_TYPES],
      ],
      Expires: parseInt(process.env.EXPIRATION_TIME),
    });

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...presignedPost,
        key,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: JSON.stringify(error),
      }),
    };
  }
}
