// Cloudinary image upload utility
// Uses the Cloudinary Upload API directly (no SDK needed for Deno)

const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload a Base64 image to Cloudinary
 * @param base64Image - The Base64 encoded image (with or without data URI prefix)
 * @param folder - Optional folder name in Cloudinary
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  base64Image: string,
  folder: string = "campuscloset"
): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary not configured, returning original image");
    return base64Image;
  }

  // Ensure proper data URI format
  let imageData = base64Image;
  if (!base64Image.startsWith("data:")) {
    // Assume it's a raw base64 string, add data URI prefix
    imageData = `data:image/jpeg;base64,${base64Image}`;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create signature for authenticated upload
  const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary upload failed:", errorText);
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const result: CloudinaryUploadResult = await response.json();
    console.log(` Uploaded to Cloudinary: ${result.public_id}`);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Return original base64 as fallback
    return base64Image;
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param images - Array of Base64 encoded images
 * @param folder - Optional folder name
 * @returns Array of Cloudinary URLs
 */
export async function uploadMultipleToCloudinary(
  images: string[],
  folder: string = "campuscloset"
): Promise<string[]> {
  const uploadPromises = images.map(img => uploadToCloudinary(img, folder));
  return await Promise.all(uploadPromises);
}

/**
 * Get an optimized Cloudinary URL with transformations
 * @param url - The Cloudinary URL
 * @param width - Desired width
 * @param height - Desired height
 * @returns Transformed URL for optimized delivery
 */
export function getOptimizedUrl(
  url: string,
  width: number = 400,
  height: number = 400
): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }
  
  // Insert transformation parameters before the upload path
  const transformations = `c_fill,w_${width},h_${height},q_auto,f_auto`;
  return url.replace("/upload/", `/upload/${transformations}/`);
}
