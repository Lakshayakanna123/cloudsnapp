import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthContext } from '../utils/auth';
import { config } from '../utils/clients';
import { handleError, successResponse } from '../utils/response';
import { listPhotosSchema, parseQueryParams } from '../validators';
import { listPhotos } from '../repositories/photosRepository';
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
    // Serve thumbnails through CloudFront (never expose S3 URLs directly)
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
    const query = parseQueryParams(
      listPhotosSchema,
      (event.queryStringParameters as Record<string, string>) ?? {}
    );

    const result = await listPhotos(auth.userId, {
      limit: query.limit,
      nextToken: query.nextToken,
      sortBy: query.sortBy,
      search: query.search,
      contentType: query.contentType,
      favorite: query.favorite,
      collectionId: query.collectionId,
    });

    return successResponse({
      photos: result.items.map((p) => buildPhotoResponse(p, config.cloudfrontDomain)),
      nextToken: result.nextToken,
      count: result.count,
    });
  } catch (err) {
    return handleError(err);
  }
};
