import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { getAuthContext } from '../utils/auth';
import { s3Client, config } from '../utils/clients';
import { handleError, successResponse } from '../utils/response';
import { uploadUrlSchema, parseBody } from '../validators';
import { createPhotoRecord } from '../repositories/photosRepository';
import { PhotoItem } from '../types';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const body = parseBody(uploadUrlSchema, event.body ?? null);

    const photoId = uuidv4();
    // Sanitize the filename: strip path info, keep extension
    const safeFilename = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `originals/${auth.userId}/${photoId}/${safeFilename}`;

    // Generate a short-lived pre-signed PUT URL
    const command = new PutObjectCommand({
      Bucket: config.originalsbucket,
      Key: objectKey,
      ContentType: body.contentType,
      ContentLength: body.fileSize,
      Metadata: {
        userId: auth.userId,
        photoId,
        originalFilename: safeFilename,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: config.uploadUrlExpirySeconds,
    });

    // Create a pending metadata record immediately
    const now = new Date().toISOString();
    const photo: PhotoItem = {
      PK: `USER#${auth.userId}`,
      SK: `PHOTO#${photoId}`,
      userId: auth.userId,
      photoId,
      originalKey: objectKey,
      thumbnailKey: `thumbnails/${auth.userId}/${photoId}.jpg`,
      originalFilename: safeFilename,
      displayName: body.filename.replace(/\.[^/.]+$/, ''), // strip extension
      contentType: body.contentType,
      sizeBytes: body.fileSize,
      uploadedAt: now,
      updatedAt: now,
      favorite: false,
      processingStatus: 'PENDING',
      collectionIds: [],
    };

    await createPhotoRecord(photo);

    return successResponse({
      uploadUrl,
      photoId,
      key: objectKey,
      expiresIn: config.uploadUrlExpirySeconds,
    });
  } catch (err) {
    return handleError(err);
  }
};
