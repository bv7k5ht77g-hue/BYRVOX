import { cookies } from 'next/headers';
import { isPublicLocale, preferredLocale, type PublicLocale } from './i18n';
type Params = Record<string, string | string[] | undefined>;
export async function resolvePublicLocale(input: Params | Promise<Params> = {}): Promise<PublicLocale> {
 const value=(await input).lang;
 const query=Array.isArray(value)?value[0]:value;
 if (isPublicLocale(query)) return query;
 const stored=(await cookies()).get('byrvox-language')?.value;
 return preferredLocale(query,stored);
}
