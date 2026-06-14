import sharp from 'sharp';

export async function compressImage(buffer: Buffer, options?: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}): Promise<Buffer> {
  try {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 80,
    } = options || {};

    const compressed = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return compressed;
  } catch (error) {
    console.error('[ImageCompression] Error compressing image:', error);
    // Retorna o buffer original se houver erro
    return buffer;
  }
}

export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch (error) {
    console.error('[ImageCompression] Error getting image dimensions:', error);
    return null;
  }
}
