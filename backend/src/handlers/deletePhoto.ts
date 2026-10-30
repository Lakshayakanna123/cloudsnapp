import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAuthContext } from '../utils/auth';
import { s3Client, config } from '../utils/clients';
import { handleError, successResponse } from '../utils/response';
import {
  assertPhotoOwnership,
  deletePhotoRecord,
} from '../repositories/photosRepository';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const photoId = event.pathParameters?.photoId;

    if (!photoId) {
      return handleError(Object.assign(new Error('Photo ID required'), { name: 'ValidationError' }));
    }

    // Verify ownership — this prevents deleting other users' photos
    const photo = await assertPhotoOwnership(auth.userId, photoId);

    // Delete original from S3 (use the stored key — never trust client-provided keys)
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.originalsbucket,
        Key: photo.originalKey,
      })
    );

    // Delete thumbnail from S3
    if (photo.thumbnailKey) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.thumbsBucket,
          Key: photo.thumbnailKey,
        })
      );
    }

    // Remove DynamoDB record last (idempotent — if S3 deletes succeed but DDB fails, retry is safe)
    await deletePhotoRecord(auth.userId, photoId);

    return successResponse({ photoId }, 'Photo deleted successfully');
  } catch (err) {
    return handleError(err);
  }
};
