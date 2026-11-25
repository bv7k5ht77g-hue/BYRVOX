export type ArticlePhoto = {
  url: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl?: string;
};

export const photoByteLimit = 8 * 1024 * 1024;
export const photoRoute = '/api/photos/';
export const photoNamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function uploadedPhotoName(url: string) {
  const name = url.startsWith(photoRoute) ? url.slice(photoRoute.length) : '';
  return photoNamePattern.test(name) ? name : null;
}

export const photoTypes = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;

export function photoFormat(bytes: Uint8Array): keyof typeof photoTypes | null {
  const length = bytes.byteLength;
  const at = (offset: number, signature: readonly number[]) => signature.every((byte, i) => bytes[offset + i] === byte);
  if (length >= 12 && at(0, [0xff, 0xd8, 0xff]) && at(length - 2, [0xff, 0xd9])) return 'jpg';
  if (length >= 45 && at(0, [137, 80, 78, 71, 13, 10, 26, 10]) && at(8, [0, 0, 0, 13, 73, 72, 68, 82])
    && at(length - 12, [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])) return 'png';
  if (length >= 20 && at(0, [82, 73, 70, 70]) && at(8, [87, 69, 66, 80, 86, 80, 56])
    && [32, 76, 88].includes(bytes[15]) && new DataView(bytes.buffer, bytes.byteOffset, length).getUint32(4, true) === length - 8) {
    return 'webp';
  }
  return null;
}
