/**
 * Ejuma Cloudinary Upload Utility
 * Handles image uploads for profile photos, ID cards, and portfolio items.
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ejuma_uploads';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * For production, consider using signed uploads via a backend function.
 */
export const uploadToCloudinary = async (file: File | Blob): Promise<CloudinaryResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[Ejuma-Cloudinary] Upload Error:', error);
    throw error;
  }
};

/**
 * Helper to upload multiple files in parallel
 */
export const uploadMultipleToCloudinary = async (files: (File | Blob)[]): Promise<CloudinaryResponse[]> => {
  const uploadPromises = files.map(file => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
};
