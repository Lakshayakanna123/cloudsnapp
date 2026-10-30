import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';

// DynamoDB
const dynamoDBClient = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// S3
export const s3Client = new S3Client({ region });

// Config
export const config = {
  region,
  originalsbucket: process.env.ORIGINALS_BUCKET || '',
  thumbsBucket: process.env.THUMBS_BUCKET || '',
  photosTable: process.env.PHOTOS_TABLE || '',
  collectionsTable: process.env.COLLECTIONS_TABLE || '',
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '52428800', 10), // 50 MB
  uploadUrlExpirySeconds: 300, // 5 minutes
  downloadUrlExpirySeconds: 300,
  allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

export type AllowedContentType = typeof config.allowedContentTypes[number];

// Validate required config at module load (fails fast in Lambda cold start)
export function validateConfig(): void {
  const required = [
    'ORIGINALS_BUCKET',
    'THUMBS_BUCKET',
    'PHOTOS_TABLE',
    'COLLECTIONS_TABLE',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
