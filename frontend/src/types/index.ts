// ──────────────────────────────────────────────────────
// Frontend shared types for CloudSnap
// ──────────────────────────────────────────────────────

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface Photo {
  photoId: string;
  displayName: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
  width?: number;
  height?: number;
  favorite: boolean;
  processingStatus: ProcessingStatus;
  collectionIds: string[];
  thumbnailUrl: string | null;
}

export interface Collection {
  collectionId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  photoId: string;
  key: string;
  expiresIn: number;
}

export interface ListPhotosResponse {
  photos: Photo[];
  nextToken?: string;
  count: number;
}

export interface ListCollectionsResponse {
  collections: Collection[];
  count: number;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresIn: number;
  filename: string;
}

export type SortBy = 'newest' | 'oldest' | 'name' | 'size';
export type ViewMode = 'grid' | 'compact';

export interface PhotoFilters {
  search: string;
  sortBy: SortBy;
  contentType?: string;
  favorite?: boolean;
  collectionId?: string;
}

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  photoId?: string;
  error?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  name?: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
