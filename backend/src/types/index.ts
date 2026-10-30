// Backend shared types for CloudSnap

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface PhotoItem {
  PK: string;            // USER#{userId}
  SK: string;            // PHOTO#{photoId}
  userId: string;
  photoId: string;
  originalKey: string;
  thumbnailKey: string;
  originalFilename: string;
  displayName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;    // ISO 8601
  updatedAt: string;
  width?: number;
  height?: number;
  favorite: boolean;
  processingStatus: ProcessingStatus;
  collectionIds: string[];
}

export interface CollectionItem {
  PK: string;            // USER#{userId}
  SK: string;            // COLLECTION#{collectionId}
  userId: string;
  collectionId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  nextToken?: string;
  count: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  username: string;
}

export interface UploadUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  photoId: string;
  key: string;
  expiresIn: number;
}

export interface ConfirmUploadRequest {
  photoId: string;
}

export interface ListPhotosQuery {
  limit?: number;
  nextToken?: string;
  sortBy?: 'newest' | 'oldest' | 'name' | 'size';
  search?: string;
  contentType?: string;
  favorite?: boolean;
  collectionId?: string;
}

export interface UpdatePhotoRequest {
  displayName?: string;
  favorite?: boolean;
  collectionIds?: string[];
}

export interface CreateCollectionRequest {
  name: string;
}

export interface UpdateCollectionRequest {
  name: string;
}
