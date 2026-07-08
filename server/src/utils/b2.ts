import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.B2_REGION || 'us-west-004',
  endpoint: process.env.B2_ENDPOINT || `https://s3.${process.env.B2_REGION || 'us-west-004'}.backblazeb2.com`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.B2_BUCKET_NAME || 'zetatube';

export async function uploadToB2(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
    ACL: 'public-read',
  });
  await s3.send(command);
  return `https://${BUCKET}.s3.${process.env.B2_REGION || 'us-west-004'}.backblazeb2.com/${filename}`;
}

export async function deleteFromB2(filename: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: filename,
    Body: Buffer.alloc(0),
  });
  await s3.send(command);
}