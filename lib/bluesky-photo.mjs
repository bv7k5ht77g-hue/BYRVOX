import { z } from 'zod';
import { validBlueskyPost } from './editorial.mjs';

const locale = z.enum(['fr','en','es','ar','zh-CN','ru','ko']);
export const blueskyPhotoFields = {
  blueskyPost: z.string().refine(validBlueskyPost).optional(),
  blueskyCaption: z.record(locale,z.string().trim().min(1).max(1000))
    .refine(captions => Object.keys(captions).length > 0).optional(),
};

export const captionsHavePost = photo => !photo.blueskyCaption || Boolean(photo.blueskyPost);
