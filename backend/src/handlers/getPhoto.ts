import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthContext } from '../utils/auth';
import { config } from '../utils/clients';
import { handleError, successResponse } from '../utils/response';
import { assertPhotoOwnership } from '../repositories/photosRepository';
import { PhotoItem } from '../types';

function buildPhotoResponse(photo: PhotoItem, cloudfrontDomain: string) {
  return {
    photoId: photo.photoId,
    displayName: photo.displayName,
    originalFilename: photo.originalFilename,
    contentType: photo.contentType,
    sizeBytes: photo.sizeBytes,
    uploadedAt: photo.uploadedAt,
    updatedAt: photo.updatedAt,
    width: photo.width,
    height: photo.height,
    favorite: photo.favorite,
    processingStatus: photo.processingStatus,
    collectionIds: photo.collectionIds,
    thumbnailUrl: cloudfrontDomain
      ? `https://${cloudfrontDomain}/${photo.thumbnailKey}`
      : null,
  };
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const photoId = event.pathParameters?.photoId;

    if (!photoId) {
      return handleError(Object.assign(new Error('Photo ID required'), { name: 'ValidationError' }));
    }

    const photo = await assertPhotoOwnership(auth.userId, photoId);

    return successResponse(buildPhotoResponse(photo, config.cloudfrontDomain));
  } catch (err) {
    return handleError(err);
  }
};
