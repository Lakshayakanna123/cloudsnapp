import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { getAuthContext } from '../utils/auth';
import { s3Client, config } from '../utils/clients';
import { handleError, successResponse, NotFoundError, ValidationError } from '../utils/response';
import { confirmUploadSchema, parseBody } from '../validators';
import {
  assertPhotoOwnership,
  updatePhotoStatus,
} from '../repositories/photosRepository';

const ALLOWED_CONTENT_TYPES = new Set(config.allowedContentTypes);

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const { photoId } = parseBody(confirmUploadSchema, event.body ?? null);

    // Verify ownership and get the pending record
    const photo = await assertPhotoOwnership(auth.userId, photoId);

    if (photo.processingStatus !== 'PENDING') {
      throw new ValidationError(
        `Photo is already in ${photo.processingStatus} state`
      );
    }

    // Verify the object actually exists in S3
    let headResult;
    try {
      headResult = await s3Client.send(
        new HeadObjectCommand({
          Bucket: config.originalsbucket,
          Key: photo.originalKey,
        })
      );
    } catch {
      throw new NotFoundError(
        'Upload not found in storage. The upload may have failed or the URL expired.'
      );
    }

    // Validate content type from S3 object metadata
    const actualContentType = headResult.ContentType || '';
    if (!ALLOWED_CONTENT_TYPES.has(actualContentType as never)) {
      throw new ValidationError(
        `Unsupported content type detected: ${actualContentType}`
      );
    }

    // Validate file size matches expectations
    const actualSize = headResult.ContentLength || 0;
    if (actualSize > config.maxFileSizeBytes) {
      throw new ValidationError(
        `File size ${actualSize} exceeds maximum allowed size`
      );
    }

    // Update status to PROCESSING (thumbnail Lambda will set READY)
    await updatePhotoStatus(auth.userId, photoId, 'PROCESSING', {
      sizeBytes: actualSize,
    });

    return successResponse({
      photoId,
      processingStatus: 'PROCESSING',
      message: 'Upload confirmed. Thumbnail processing started.',
    });
  } catch (err) {
    return handleError(err);
  }
};
