export async function boundedBytes(req: Pick<Request, 'headers' | 'body'>, limit: number) {
  if (Number(req.headers.get('content-length')) > limit) throw new RangeError('Document trop volumineux.');
  if (!req.body) throw Error('Corps requis.');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new RangeError('Document trop volumineux.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

export async function boundedJson(req: Request, limit = 100000): Promise<unknown> {
  return JSON.parse(new TextDecoder().decode(await boundedBytes(req, limit)));
}
