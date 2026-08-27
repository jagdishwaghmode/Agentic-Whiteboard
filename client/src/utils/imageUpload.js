/**
 * Image upload utilities — modular for future Firebase Storage / Cloudinary integration.
 */

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateImageFile = (file) => {
  if (!file) {
    throw new Error('No file selected');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: PNG, JPG, JPEG, WEBP');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB');
  }

  return true;
};

export const readImageAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    validateImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        mimeType: file.type,
        id: `image_${Date.now()}`,
        dataURL: reader.result,
        created: Date.now(),
        lastRetrieved: Date.now(),
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
