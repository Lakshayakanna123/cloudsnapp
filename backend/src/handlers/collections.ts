import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getAuthContext } from '../utils/auth';
import { handleError, successResponse } from '../utils/response';
import { createCollectionSchema, updateCollectionSchema, parseBody } from '../validators';
import {
  createCollectionRecord,
  listCollections,
  updateCollectionRecord,
  deleteCollectionRecord,
  getCollectionRecord,
} from '../repositories/photosRepository';
import { CollectionItem } from '../types';

// POST /collections
export const createCollection = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const { name } = parseBody(createCollectionSchema, event.body ?? null);

    const collectionId = uuidv4();
    const now = new Date().toISOString();

    const collection: CollectionItem = {
      PK: `USER#${auth.userId}`,
      SK: `COLLECTION#${collectionId}`,
      userId: auth.userId,
      collectionId,
      name,
      createdAt: now,
      updatedAt: now,
    };

    await createCollectionRecord(collection);

    return successResponse(collection, 'Collection created', 201);
  } catch (err) {
    return handleError(err);
  }
};

// GET /collections
export const getCollections = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const collections = await listCollections(auth.userId);
    return successResponse({ collections, count: collections.length });
  } catch (err) {
    return handleError(err);
  }
};

// PATCH /collections/{collectionId}
export const updateCollection = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const collectionId = event.pathParameters?.collectionId;
    if (!collectionId) {
      return handleError(Object.assign(new Error('Collection ID required'), { name: 'ValidationError' }));
    }

    await getCollectionRecord(auth.userId, collectionId); // ensure ownership
    const { name } = parseBody(updateCollectionSchema, event.body ?? null);
    const updated = await updateCollectionRecord(auth.userId, collectionId, name);

    return successResponse(updated);
  } catch (err) {
    return handleError(err);
  }
};

// DELETE /collections/{collectionId}
export const deleteCollection = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = getAuthContext(event);
    const collectionId = event.pathParameters?.collectionId;
    if (!collectionId) {
      return handleError(Object.assign(new Error('Collection ID required'), { name: 'ValidationError' }));
    }

    await getCollectionRecord(auth.userId, collectionId); // ensure ownership
    await deleteCollectionRecord(auth.userId, collectionId);

    return successResponse({ collectionId }, 'Collection deleted');
  } catch (err) {
    return handleError(err);
  }
};
