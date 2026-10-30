import { apiClient } from '../lib/api';
import {
  Photo,
  UploadUrlResponse,
  ListPhotosResponse,
  ListCollectionsResponse,
  DownloadUrlResponse,
  PhotoFilters,
  Collection,
} from '../types';

// ─── Photos ────────────────────────────────────────────

export const photosService = {
  async getUploadUrl(params: {
    filename: string;
    contentType: string;
    fileSize: number;
  }): Promise<UploadUrlResponse> {
    const res = await apiClient.post<{ success: true; data: UploadUrlResponse }>(
      '/photos/upload-url',
      params
    );
    return res.data.data;
  },

  async confirmUpload(photoId: string): Promise<{ photoId: string; processingStatus: string }> {
    const res = await apiClient.post(`/photos/${photoId}/confirm`, { photoId });
    return res.data.data;
  },

  async listPhotos(params: Partial<PhotoFilters> & { limit?: number; nextToken?: string }): Promise<ListPhotosResponse> {
    const res = await apiClient.get<{ success: true; data: ListPhotosResponse }>('/photos', {
      params: {
        limit: params.limit ?? 24,
        ...(params.nextToken && { nextToken: params.nextToken }),
        ...(params.search && { search: params.search }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.contentType && { contentType: params.contentType }),
        ...(params.favorite !== undefined && { favorite: String(params.favorite) }),
        ...(params.collectionId && { collectionId: params.collectionId }),
      },
    });
    return res.data.data;
  },

  async getPhoto(photoId: string): Promise<Photo> {
    const res = await apiClient.get<{ success: true; data: Photo }>(`/photos/${photoId}`);
    return res.data.data;
  },

  async getDownloadUrl(photoId: string): Promise<DownloadUrlResponse> {
    const res = await apiClient.post<{ success: true; data: DownloadUrlResponse }>(
      `/photos/${photoId}/download-url`
    );
    return res.data.data;
  },

  async updatePhoto(
    photoId: string,
    updates: { displayName?: string; favorite?: boolean; collectionIds?: string[] }
  ): Promise<Photo> {
    const res = await apiClient.patch<{ success: true; data: Photo }>(
      `/photos/${photoId}`,
      updates
    );
    return res.data.data;
  },

  async deletePhoto(photoId: string): Promise<void> {
    await apiClient.delete(`/photos/${photoId}`);
  },

  /**
   * Upload a file directly to S3 using a pre-signed PUT URL.
   * The Authorization header is explicitly excluded — S3 pre-signed URLs
   * don't need it and including it causes signature mismatch errors.
   */
  async uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
      onProgress?.(100);
    });
  },
};

// ─── Collections ───────────────────────────────────────

export const collectionsService = {
  async list(): Promise<ListCollectionsResponse> {
    const res = await apiClient.get<{ success: true; data: ListCollectionsResponse }>('/collections');
    return res.data.data;
  },

  async create(name: string): Promise<Collection> {
    const res = await apiClient.post<{ success: true; data: Collection }>('/collections', { name });
    return res.data.data;
  },

  async update(collectionId: string, name: string): Promise<Collection> {
    const res = await apiClient.patch<{ success: true; data: Collection }>(
      `/collections/${collectionId}`,
      { name }
    );
    return res.data.data;
  },

  async delete(collectionId: string): Promise<void> {
    await apiClient.delete(`/collections/${collectionId}`);
  },
};
