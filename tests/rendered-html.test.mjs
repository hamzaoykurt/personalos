import assert from "node:assert/strict";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Personal OS command center", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Personal OS/);
  assert.match(html, />Bugün\.</);
  assert.match(html, /Hızlı yakala/);
  assert.match(html, />Devam et</);
  assert.match(html, /Bu hafta/);
  assert.match(html, /Görevler/);
  assert.match(html, /Her yerde ara/);
  assert.doesNotMatch(html, /Bugün ne önemli\?|Aklındakini burada bırak/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships product-specific metadata and social preview", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /Hayat, Proje &amp; Bilgi Sistemi/);
  assert.match(html, /og\.png/);
  assert.match(html, /summary_large_image/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /apple-touch-icon\.png/);
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
});

test("ships an installable Personal OS manifest and offline shell", async () => {
  const response = await render("/manifest.webmanifest");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/manifest\+json/i);
  const manifest = await response.json();
  assert.equal(manifest.short_name, "Personal OS");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));

  const { readFile, stat } = await import("node:fs/promises");
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(serviceWorker, /personal-os-v4/);
  assert.match(serviceWorker, /\/api\/state/);
  assert.ok((await stat(new URL("../public/icons/icon-192.png", import.meta.url))).size > 1000);
  assert.ok((await stat(new URL("../public/icons/icon-512.png", import.meta.url))).size > 1000);
});

test("server-renders every primary Personal OS section", async () => {
  const expectations = {
    "/projects": /ÜRETİM MERKEZİ/,
    "/tasks": /GÜNLÜK OPERASYON/,
    "/calendar": /ORTAK AJANDA/,
    "/career": /REACTIVATION/,
    "/work": /İŞ ALANI/,
    "/notes": /BİLGİ ARŞİVİ/,
    "/archive": /TAMAMLANANLAR/,
    "/settings": /Kayıt durumu/,
  };
  for (const [path, expectation] of Object.entries(expectations)) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expectation, path);
  }
});

test("opens the diction recorder directly from its deep link", async () => {
  const response = await render("/career?area=diction");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kayda başla/);
  assert.match(html, /Kayıt arşivi/);
});

test("starter preview directory is removed", async () => {
  const { access } = await import("node:fs/promises");
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
  await assert.rejects(access(new URL("app/_sites-preview/preview.css", templateRoot)));
});
