import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { docClient, config } from '../utils/clients';
import { PhotoItem, CollectionItem, ProcessingStatus, PaginatedResult } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/response';

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function createPhotoRecord(photo: PhotoItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: config.photosTable,
      Item: photo,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );
}

export async function getPhotoRecord(
  userId: string,
  photoId: string
): Promise<PhotoItem> {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.photosTable,
      Key: {
        PK: `USER#${userId}`,
        SK: `PHOTO#${photoId}`,
      },
    })
  );
  if (!result.Item) throw new NotFoundError(`Photo ${photoId} not found`);
  return result.Item as PhotoItem;
}

export async function assertPhotoOwnership(
  userId: string,
  photoId: string
): Promise<PhotoItem> {
  const photo = await getPhotoRecord(userId, photoId);
  if (photo.userId !== userId) throw new ForbiddenError('Access denied');
  return photo;
}

export async function updatePhotoStatus(
  userId: string,
  photoId: string,
  processingStatus: ProcessingStatus,
  extra: Partial<Pick<PhotoItem, 'width' | 'height' | 'thumbnailKey' | 'sizeBytes'>> = {}
): Promise<void> {
  const now = new Date().toISOString();
  const updateExpressions: string[] = ['#status = :status', '#updatedAt = :updatedAt'];
  const names: Record<string, string> = {
    '#status': 'processingStatus',
    '#updatedAt': 'updatedAt',
  };
  const values: Record<string, unknown> = {
    ':status': processingStatus,
    ':updatedAt': now,
  };

  if (extra.width !== undefined) { updateExpressions.push('#w = :w'); names['#w'] = 'width'; values[':w'] = extra.width; }
  if (extra.height !== undefined) { updateExpressions.push('#h = :h'); names['#h'] = 'height'; values[':h'] = extra.height; }
  if (extra.thumbnailKey) { updateExpressions.push('#tk = :tk'); names['#tk'] = 'thumbnailKey'; values[':tk'] = extra.thumbnailKey; }
  if (extra.sizeBytes !== undefined) { updateExpressions.push('#sb = :sb'); names['#sb'] = 'sizeBytes'; values[':sb'] = extra.sizeBytes; }

  await docClient.send(
    new UpdateCommand({
      TableName: config.photosTable,
      Key: { PK: `USER#${userId}`, SK: `PHOTO#${photoId}` },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

export async function updatePhotoMetadata(
  userId: string,
  photoId: string,
  updates: Partial<Pick<PhotoItem, 'displayName' | 'favorite' | 'collectionIds'>>
): Promise<PhotoItem> {
  const now = new Date().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
  const values: Record<string, unknown> = { ':updatedAt': now };

  if (updates.displayName !== undefined) {
    updateExpressions.push('#dn = :dn');
    names['#dn'] = 'displayName';
    values[':dn'] = updates.displayName;
  }
  if (updates.favorite !== undefined) {
    updateExpressions.push('#fav = :fav');
    names['#fav'] = 'favorite';
    values[':fav'] = updates.favorite;
  }
  if (updates.collectionIds !== undefined) {
    updateExpressions.push('#ci = :ci');
    names['#ci'] = 'collectionIds';
    values[':ci'] = updates.collectionIds;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: config.photosTable,
      Key: { PK: `USER#${userId}`, SK: `PHOTO#${photoId}` },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as PhotoItem;
}

export async function deletePhotoRecord(
  userId: string,
  photoId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: config.photosTable,
      Key: { PK: `USER#${userId}`, SK: `PHOTO#${photoId}` },
    })
  );
}

export interface ListPhotosOptions {
  limit: number;
  nextToken?: string;
  sortBy: 'newest' | 'oldest' | 'name' | 'size';
  search?: string;
  contentType?: string;
  favorite?: boolean;
  collectionId?: string;
}

export async function listPhotos(
  userId: string,
  options: ListPhotosOptions
): Promise<PaginatedResult<PhotoItem>> {
  const { limit, nextToken, search, contentType, favorite, collectionId } = options;

  const queryInput: QueryCommandInput = {
    TableName: config.photosTable,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':prefix': 'PHOTO#',
    },
    Limit: Math.min(limit * 3, 300), // over-fetch to allow client-side filtering
    ScanIndexForward: options.sortBy === 'oldest',
    ...(nextToken && {
      ExclusiveStartKey: JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')),
    }),
  };

  const result = await docClient.send(new QueryCommand(queryInput));
  let items = (result.Items || []) as PhotoItem[];

  // Apply filters (DynamoDB doesn't support arbitrary FilterExpressions efficiently without GSIs)
  if (search) {
    const lower = search.toLowerCase();
    items = items.filter(
      (p) =>
        p.displayName.toLowerCase().includes(lower) ||
        p.originalFilename.toLowerCase().includes(lower)
    );
  }
  if (contentType) {
    items = items.filter((p) => p.contentType === contentType);
  }
  if (favorite !== undefined) {
    items = items.filter((p) => p.favorite === favorite);
  }
  if (collectionId) {
    items = items.filter((p) => p.collectionIds.includes(collectionId));
  }

  // Client-side sort for name and size (requires GSI for large datasets)
  if (options.sortBy === 'name') {
    items.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else if (options.sortBy === 'size') {
    items.sort((a, b) => b.sizeBytes - a.sizeBytes);
  }

  const page = items.slice(0, limit);
  const lastKey = result.LastEvaluatedKey;
  const encodedToken = lastKey
    ? Buffer.from(JSON.stringify(lastKey)).toString('base64')
    : undefined;

  return { items: page, nextToken: encodedToken, count: page.length };
}

// ─── Collections ─────────────────────────────────────────────────────────────

export async function createCollectionRecord(collection: CollectionItem): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: config.collectionsTable,
      Item: collection,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );
}

export async function getCollectionRecord(
  userId: string,
  collectionId: string
): Promise<CollectionItem> {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.collectionsTable,
      Key: {
        PK: `USER#${userId}`,
        SK: `COLLECTION#${collectionId}`,
      },
    })
  );
  if (!result.Item) throw new NotFoundError(`Collection ${collectionId} not found`);
  return result.Item as CollectionItem;
}

export async function listCollections(userId: string): Promise<CollectionItem[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: config.collectionsTable,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':prefix': 'COLLECTION#',
      },
    })
  );
  return (result.Items || []) as CollectionItem[];
}

export async function updateCollectionRecord(
  userId: string,
  collectionId: string,
  name: string
): Promise<CollectionItem> {
  const now = new Date().toISOString();
  const result = await docClient.send(
    new UpdateCommand({
      TableName: config.collectionsTable,
      Key: {
        PK: `USER#${userId}`,
        SK: `COLLECTION#${collectionId}`,
      },
      UpdateExpression: 'SET #name = :name, #updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: { ':name': name, ':updatedAt': now },
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes as CollectionItem;
}

export async function deleteCollectionRecord(
  userId: string,
  collectionId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: config.collectionsTable,
      Key: {
        PK: `USER#${userId}`,
        SK: `COLLECTION#${collectionId}`,
      },
    })
  );
}
