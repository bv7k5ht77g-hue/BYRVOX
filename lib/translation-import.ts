import {z} from 'zod';

const line = (max:number) => z.string().trim().min(1).max(max);
const text = z.object({title:line(600),summary:line(6500),body:line(100000)});
const photo = z.object({alt:line(300),caption:line(1000)});
const translation = text.extend({photoAlt:line(300).optional(),photoCaption:line(1000).optional()});
export const translationImportLimit = 2_000_000;
export const translationSubmission = z.object({
  source:text.extend({photo:photo.nullable()}),
  translations:z.object({en:translation,es:translation,ar:translation,'zh-CN':translation,ru:translation,ko:translation}),
}).superRefine((pack,ctx) => {
  for (const [locale,copy] of Object.entries(pack.translations)) {
    if (pack.source.photo && (!copy.photoAlt || !copy.photoCaption)) {
      ctx.addIssue({code:'custom',message:`Légende ou texte alternatif manquant pour ${locale}.`});
    }
  }
});
export type TranslationSubmission = z.infer<typeof translationSubmission>;

const paragraphs = (body:string) => body.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).join('\n');

export function translationsMatch(pack:TranslationSubmission, story:{
  title:string;summary:string;body:string;photo:{alt:string;caption?:string}|null;
}) {
  const source=pack.source;
  return source.title===story.title.trim() && source.summary===story.summary.trim()
    && paragraphs(source.body)===paragraphs(story.body)
    && (source.photo===null ? story.photo===null
      : source.photo.alt===story.photo?.alt.trim() && source.photo.caption===story.photo?.caption?.trim());
}
