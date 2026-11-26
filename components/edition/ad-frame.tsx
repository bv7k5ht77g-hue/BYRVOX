import { adScriptDocument, validAdFrameUrl } from '../../lib/ad-frame.mjs';
import './ad-frame.css';

export function AdFrame({ url, name, script = false }: { url: string; name: string; script?: boolean }) {
  const srcDoc = script ? adScriptDocument(url) : undefined;
  if (script ? !srcDoc : !validAdFrameUrl(url)) return null;
  return <iframe className="by-ad-frame" title={name} src={script ? undefined : url} srcDoc={srcDoc} loading="lazy"
    sandbox="allow-scripts allow-popups" referrerPolicy="no-referrer" />;
}
