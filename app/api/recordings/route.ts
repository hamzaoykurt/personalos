import { env } from "cloudflare:workers";

const MAX_RECORDING_BYTES = 16 * 1024 * 1024;
const recordingKeyPattern = /^voice\/[0-9a-f-]{36}\.(webm|mp4|ogg)$/;
const mimeExtensions: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/ogg": "ogg",
};

function recordingKey(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  return recordingKeyPattern.test(key) ? key : null;
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    if (!env.AUDIO) return errorResponse("Ses depolama alanı kullanılamıyor", 503);
    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File)) return errorResponse("Ses dosyası bulunamadı", 400);
    if (!audio.size || audio.size > MAX_RECORDING_BYTES) return errorResponse("Kayıt en fazla 16 MB olabilir", 413);

    const normalizedType = audio.type.toLowerCase();
    const extension = mimeExtensions[normalizedType.split(";")[0]];
    if (!extension) return errorResponse("Bu ses formatı desteklenmiyor", 415);

    const key = `voice/${crypto.randomUUID()}.${extension}`;
    await env.AUDIO.put(key, audio.stream(), {
      httpMetadata: { contentType: normalizedType },
      customMetadata: { createdAt: new Date().toISOString() },
    });

    return Response.json({ key, mimeType: normalizedType, size: audio.size }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Ses kaydedilemedi", 500);
  }
}

export async function GET(request: Request) {
  try {
    if (!env.AUDIO) return errorResponse("Ses depolama alanı kullanılamıyor", 503);
    const key = recordingKey(request);
    if (!key) return errorResponse("Geçersiz kayıt", 400);
    const object = await env.AUDIO.get(key);
    if (!object) return errorResponse("Kayıt bulunamadı", 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=3600");
    headers.set("content-length", String(object.size));
    return new Response(object.body, { headers });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Ses açılamadı", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!env.AUDIO) return errorResponse("Ses depolama alanı kullanılamıyor", 503);
    const key = recordingKey(request);
    if (!key) return errorResponse("Geçersiz kayıt", 400);
    await env.AUDIO.delete(key);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Kayıt silinemedi", 500);
  }
}
