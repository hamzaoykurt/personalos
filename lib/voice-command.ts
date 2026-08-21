export type VoiceDestination = "task" | "purchase" | "place" | "note" | "project" | "work" | "research";

export type ParsedVoiceCommand = {
  title: string;
  destination: VoiceDestination;
  subtasks?: string[];
  mergeIntoExisting?: boolean;
};

const destinationPatterns: Array<{ destination: VoiceDestination; pattern: RegExp }> = [
  { destination: "purchase", pattern: /^(?:alınacak(?:lar)?|alışveriş(?: listesi)?|satın al(?:ınacak)?)/iu },
  { destination: "place", pattern: /^(?:gezilecek(?:ler)?|gidilecek(?:ler)?|rota)/iu },
  { destination: "research", pattern: /^(?:araştırma|araştırılacak|merak)/iu },
  { destination: "project", pattern: /^(?:proje)/iu },
  { destination: "work", pattern: /^(?:iş|iş notu)/iu },
  { destination: "note", pattern: /^(?:not|not et)/iu },
  { destination: "task", pattern: /^(?:görev(?:ler)?|yapılacak(?:lar)?)/iu },
];

function clean(value: string) {
  return value
    .replace(/^[\s:–—-]+|[\s.!?;:–—-]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutCommandTail(value: string) {
  return clean(value.replace(/\s+(?:olarak\s+)?(?:ekle|oluştur|kaydet|yaz)$/iu, ""));
}

function splitList(value: string) {
  return value
    .split(/\s*(?:,|\bve\b|\bsonra\b)\s*/iu)
    .map(withoutCommandTail)
    .filter((item) => item.length > 1);
}

function splitProject(value: string) {
  const marker = value.match(/\balt\s+görev(?:ler(?:i)?)?\b/iu);
  if (!marker || marker.index === undefined) return { title: withoutCommandTail(value), subtasks: [] as string[] };
  const title = withoutCommandTail(value.slice(0, marker.index).replace(/[,;:]\s*$/u, ""));
  const subtaskText = value.slice(marker.index + marker[0].length).replace(/^[\s:–—-]+/u, "");
  return { title, subtasks: splitList(subtaskText) };
}

export function inferVoiceDestination(value: string): VoiceDestination {
  const text = value.toLocaleLowerCase("tr-TR");
  if (/(satın|alınacak|sipariş|fiyat|alışveriş)/u.test(text)) return "purchase";
  if (/(gez|git|müze|kafe|sergi|sahil|rota|semt)/u.test(text)) return "place";
  if (/(araştır|öğren|neden|nasıl|merak|\?)/u.test(text)) return "research";
  if (/(proje|uygulama|site|ürün)/u.test(text)) return "project";
  if (/(müşteri|teslim|toplantı|iş|rapor|mail)/u.test(text)) return "work";
  if (/(not|fikir|düşünce)/u.test(text)) return "note";
  return "task";
}

export function parseVoiceCommands(value: string): ParsedVoiceCommand[] {
  const chunks = value
    .replace(/\r/g, "\n")
    .split(/\n+|;|(?<=[.!?])\s+/u)
    .map(clean)
    .filter((item) => item.length > 1);
  const parsed: ParsedVoiceCommand[] = [];
  let latestProject = -1;

  chunks.forEach((chunk) => {
    const existingProject = chunk.match(/^(.+?)\s+projesine\s+(?:alt\s+görev(?:\s+olarak)?\s+)?(.+?)(?:\s+(?:ekle|kaydet))?$/iu);
    if (existingProject) {
      parsed.push({ title: clean(existingProject[1]), destination: "project", subtasks: splitList(existingProject[2]), mergeIntoExisting: true });
      latestProject = parsed.length - 1;
      return;
    }

    const namedProject = chunk.match(/^(.+?)\s+diye\s+(?:bir\s+)?proje(?:\s+(?:oluştur|ekle|kaydet))?(.*)$/iu);
    if (namedProject) {
      const project = splitProject(`${namedProject[1]} ${namedProject[2]}`);
      parsed.push({ title: project.title, destination: "project", subtasks: project.subtasks });
      latestProject = parsed.length - 1;
      return;
    }

    const subtaskOnly = chunk.match(/^alt\s+görev(?:ler(?:i)?)?\s*[:–—-]?\s*(.+)$/iu);
    if (subtaskOnly && latestProject >= 0) {
      const current = parsed[latestProject];
      parsed[latestProject] = { ...current, subtasks: [...(current.subtasks ?? []), ...splitList(subtaskOnly[1])] };
      return;
    }

    const meta = destinationPatterns.find((item) => item.pattern.test(chunk));
    if (meta) {
      const prefix = chunk.match(meta.pattern)?.[0] ?? "";
      const body = clean(chunk.slice(prefix.length).replace(/^(?:olarak\s+)?(?:ekle|oluştur|kaydet|yaz)?\s*[:–—-]?\s*/iu, ""));
      if (!body) return;
      if (meta.destination === "project") {
        const project = splitProject(body);
        parsed.push({ title: project.title, destination: "project", subtasks: project.subtasks });
        latestProject = parsed.length - 1;
        return;
      }
      const plural = /(?:ler|lar|alışveriş|alınacaklar|gezilecekler)/iu.test(prefix);
      const items = plural ? splitList(body) : [withoutCommandTail(body)];
      items.filter(Boolean).forEach((title) => parsed.push({ title, destination: meta.destination }));
      latestProject = -1;
      return;
    }

    parsed.push({ title: withoutCommandTail(chunk), destination: inferVoiceDestination(chunk) });
    latestProject = parsed.at(-1)?.destination === "project" ? parsed.length - 1 : -1;
  });

  return parsed.filter((item) => item.title.length > 1).slice(0, 24);
}
