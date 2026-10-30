import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAuthContext } from '../utils/auth';
import { s3Client, config } from '../utils/clients';
import { handleError, successResponse } from '../utils/response';
import { assertPhotoOwnership } from '../repositories/photosRepository';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const photoId = event.pathParameters?.photoId;

    if (!photoId) {
      return handleError(new (class extends Error { name = 'ValidationError'; })(
        'Photo ID is required'
      ));
    }

    const photo = await assertPhotoOwnership(auth.userId, photoId);

    // Generate a time-limited download URL for the original image
    const command = new GetObjectCommand({
      Bucket: config.originalsbucket,
      Key: photo.originalKey,
      ResponseContentDisposition: `attachment; filename="${photo.originalFilename}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: config.downloadUrlExpirySeconds,
    });

    return successResponse({
      downloadUrl,
      expiresIn: config.downloadUrlExpirySeconds,
      filename: photo.originalFilename,
    });
  } catch (err) {
    return handleError(err);
  }
};
