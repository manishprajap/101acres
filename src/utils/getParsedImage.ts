export const getParsedImage = (imageStr?: string): string => {
  const BASE_URL = "https://101acres.com";

  if (!imageStr) return "/default-image.jpg";

  try {
    const parsed = JSON.parse(imageStr);
    const img = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!img) return "/default-image.jpg";
    if (img.startsWith("http")) return img;

    const cleanPath = img.startsWith("/uploads/")
      ? img
      : `/uploads/${img.replace(/^\/+/, "")}`;

    return `${BASE_URL}${cleanPath}`;
  } catch {
    // Fallback if not JSON
    if (imageStr.startsWith("http")) return imageStr;

    const cleanPath = imageStr.startsWith("/uploads/")
      ? imageStr
      : `/uploads/${imageStr.replace(/^\/+/, "")}`;

    return `${BASE_URL}${cleanPath}`;
  }
};
