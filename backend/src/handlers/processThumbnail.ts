import { S3Event, S3Handler } from 'aws-lambda';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { s3Client, config } from '../utils/clients';
import { updatePhotoStatus } from '../repositories/photosRepository';

/**
 * Thumbnail Processing Lambda
 * Triggered by S3 ObjectCreated events on the originals bucket.
 *
 * Security:
 * - Validates source bucket matches configured originals bucket
 * - Validates object key format before extracting userId/photoId
 * - Never logs image content or user data
 *
 * Idempotent:
 * - Re-processing the same photoId is safe; DynamoDB update is idempotent
 * - Sharp processes from scratch each time — no partial state issues
 */
export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const sourceBucket = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Security: Reject events from unexpected buckets
    if (sourceBucket !== config.originalsbucket) {
      console.warn(`[processThumbnail] Rejecting event from unexpected bucket: ${sourceBucket}`);
      continue;
    }

    // Validate key format: originals/{userId}/{photoId}/{filename}
    const keyPattern = /^originals\/([^/]+)\/([0-9a-f-]{36})\/(.+)$/;
    const match = objectKey.match(keyPattern);
    if (!match) {
      console.warn(`[processThumbnail] Unexpected object key format: ${objectKey}`);
      continue;
    }

    const [, userId, photoId] = match;
    const thumbnailKey = `thumbnails/${userId}/${photoId}.jpg`;

    try {
      console.log(`[processThumbnail] Processing photoId=${photoId} userId=${userId}`);

      // Download original from S3
      const getResult = await s3Client.send(
        new GetObjectCommand({
          Bucket: sourceBucket,
          Key: objectKey,
        })
      );

      if (!getResult.Body) {
        throw new Error('Empty response body from S3');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of getResult.Body as AsyncIterable<Buffer>) {
        chunks.push(Buffer.from(chunk));
      }
      const originalBuffer = Buffer.concat(chunks);

      if (originalBuffer.length === 0) {
        throw new Error('Empty file received from S3');
      }

      // Validate the image can be decoded before processing
      const metadata = await sharp(originalBuffer).metadata();
      const { width = 0, height = 0 } = metadata;

      console.log(`[processThumbnail] Source image ${width}x${height} format=${metadata.format}`);

      // Validate format (reject SVG, unknown, etc.)
      const allowedFormats = new Set(['jpeg', 'png', 'webp']);
      if (!metadata.format || !allowedFormats.has(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      // Resize: max 800px on the longest edge, preserve ratio, no enlargement
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize({
          width: 800,
          height: 800,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      // Upload thumbnail to the thumbnails bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.thumbsBucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            userId,
            photoId,
            sourceKey: objectKey,
          },
        })
      );

      // Update DynamoDB record with READY status and dimensions
      await updatePhotoStatus(userId, photoId, 'READY', {
        width,
        height,
        thumbnailKey,
      });

      console.log(`[processThumbnail] Successfully processed photoId=${photoId}`);
    } catch (err) {
      // Mark as FAILED in DynamoDB so the UI can show recovery state
      console.error(`[processThumbnail] FAILED photoId=${photoId}`, {
        error: err instanceof Error ? err.message : String(err),
      });

      try {
        await updatePhotoStatus(userId, photoId, 'FAILED');
      } catch (ddbErr) {
        console.error(`[processThumbnail] Failed to update FAILED status in DynamoDB`, ddbErr);
      }
    }
  }
};
