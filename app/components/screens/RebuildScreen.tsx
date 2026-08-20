/* eslint-disable jsx-a11y/media-has-caption -- recordings are private raw voice notes without authored caption tracks */
"use client";

import { ArrowRight, Check, ChevronRight, Circle, Compass, Dumbbell, FlaskConical, Languages, Mic2, Orbit, Plus, RefreshCcw, Rocket, Sparkles, Star, Target, Telescope, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ActivityLog, CuriosityQuestion, PersonalOSState, Project, SpaceExperiment, VoiceRecording } from "@/lib/types";
import type { Section } from "@/lib/navigation";
import { cx, ProgressBar, ScreenHeader, SectionHead, todayIso, uid } from "./ScreenKit";
import VoiceRecorder, { type RecordingDraft } from "../rebuild/VoiceRecorder";

type RebuildArea = "overview" | "body" | "curiosity" | "creative" | "english" | "diction" | "social" | "career" | "space";

const areas: Array<{ id: RebuildArea; label: string; icon: typeof Rocket }> = [
  { id: "overview", label: "Bu hafta", icon: Rocket },
  { id: "body", label: "Beden", icon: Dumbbell },
  { id: "curiosity", label: "Merak", icon: Telescope },
  { id: "creative", label: "Yaratıcılık", icon: Sparkles },
  { id: "english", label: "İngilizce", icon: Languages },
  { id: "diction", label: "Diksiyon", icon: Mic2 },
  { id: "social", label: "Sosyal", icon: Compass },
  { id: "career", label: "Kariyer", icon: Target },
  { id: "space", label: "Uzay deneyi", icon: Orbit },
];

const targetByArea: Partial<Record<ActivityLog["area"], string>> = { body: "weekly-sport", english: "weekly-english", diction: "weekly-diction", social: "weekly-social", creative: "weekly-creative", career: "weekly-career" };
const areaIds = new Set<RebuildArea>(areas.map((item) => item.id));

function areaFromLocation(): RebuildArea {
  if (typeof window === "undefined") return "overview";
  const requested = new URLSearchParams(window.location.search).get("area") as RebuildArea | null;
  return requested && areaIds.has(requested) ? requested : "overview";
}

export default function RebuildScreen({ state, setState, go, initialArea = "overview" }: {
  state: PersonalOSState;
  setState: React.Dispatch<React.SetStateAction<PersonalOSState>>;
  go: (section: Section) => void;
  initialArea?: string;
}) {
  const [area, setAreaState] = useState<RebuildArea>(areaIds.has(initialArea as RebuildArea) ? initialArea as RebuildArea : "overview");
  useEffect(() => {
    const syncArea = () => setAreaState(areaFromLocation());
    syncArea();
    window.addEventListener("popstate", syncArea);
    return () => window.removeEventListener("popstate", syncArea);
  }, []);
  const setArea = (next: RebuildArea) => {
    setAreaState(next);
    const url = next === "overview" ? "/career" : `/career?area=${next}`;
    if (`${window.location.pathname}${window.location.search}` !== url) window.history.replaceState({}, "", url);
  };
  const logActivity = (log: Omit<ActivityLog, "id" | "date">, targetAmount = 1) => setState((current) => {
    const targetId = targetByArea[log.area];
    const targets = current.weeklyTargets.map((target) => target.id === targetId ? { ...target, current: Math.min(target.target, target.current + targetAmount) } : target);
    return {
      ...current,
      activityLogs: [{ ...log, id: uid("log"), date: todayIso() }, ...current.activityLogs],
      weeklyTargets: targets,
      weeklyPlans: current.weeklyPlans.map((plan, index) => index === 0 ? { ...plan, targets } : plan),
    };
  });

  return <div className="os-screen os-rebuild-screen">
    <ScreenHeader title="Rebuild" kicker="AY 1 / 6 · REACTIVATION" />
    <nav className="os-rebuild-nav" aria-label="Rebuild alanları">{areas.map((item) => { const Icon = item.icon; return <button className={area === item.id ? "is-active" : ""} key={item.id} onClick={() => setArea(item.id)}><Icon /><span>{item.label}</span></button>; })}</nav>
    {area === "overview" && <Overview state={state} setArea={setArea} />}
    {area === "body" && <BodyArea state={state} logActivity={logActivity} />}
    {area === "curiosity" && <CuriosityArea state={state} setState={setState} />}
    {area === "creative" && <CreativeArea state={state} setState={setState} go={go} logActivity={logActivity} />}
    {area === "english" && <EnglishArea state={state} logActivity={logActivity} />}
    {area === "diction" && <DictionArea state={state} setState={setState} logActivity={logActivity} />}
    {area === "social" && <SocialArea state={state} setState={setState} logActivity={logActivity} />}
    {area === "career" && <CareerArea state={state} logActivity={logActivity} />}
    {area === "space" && <SpaceArea state={state} setState={setState} />}
  </div>;
}

function Overview({ state, setArea }: { state: PersonalOSState; setArea: (area: RebuildArea) => void }) {
  const total = state.weeklyTargets.reduce((sum, target) => sum + Math.min(target.current / target.target, 1), 0);
  const score = Math.round((total / state.weeklyTargets.length) * 100);
  const nextTarget = state.weeklyTargets.find((target) => target.current < target.target) ?? state.weeklyTargets[0];
  const areaForTarget: Record<string, RebuildArea> = { "weekly-sport": "body", "weekly-english": "english", "weekly-diction": "diction", "weekly-curiosity": "curiosity", "weekly-creative": "creative", "weekly-social": "social", "weekly-solo": "social", "weekly-career": "career" };
  const months = [
    ["01", "Reactivate", "Ritmi geri kazan"], ["02", "Expand", "Alanı genişlet"], ["03", "Build", "Orbit Explorer"],
    ["04", "Publish", "Üretimi görünür kıl"], ["05", "Money", "İlk dış gelir"], ["06", "Review", "Kanıtlarla karar ver"],
  ];
  return <div className="os-rebuild-overview">
    <section className="os-inset-card os-rebuild-focus"><span>ŞİMDİ</span><div><h2>{nextTarget.label}</h2><p>{nextTarget.current}/{nextTarget.target} {nextTarget.unit}</p></div><button onClick={() => setArea(areaForTarget[nextTarget.id])}>Başla<ArrowRight /></button><i aria-hidden="true" /></section>
    <section className="os-inset-card os-weekly-system"><SectionHead label="HAFTALIK SİSTEM" title="Ritim" /><div>{state.weeklyTargets.map((target) => <button key={target.id} onClick={() => setArea(areaForTarget[target.id])}><span>{target.label}</span><ProgressBar value={(target.current / target.target) * 100} /><strong>{target.current}<small>/{target.target}</small></strong></button>)}</div><footer><span>Bu hafta</span><strong>{score}%</strong><small>Eksikler uyarı değil, yön gösterir.</small></footer></section>
    <section className="os-roadmap"><SectionHead label="6 AYLIK YOL" title="Yol haritası" /> <div>{months.map((month, index) => <article className={cx("os-inset-card", index === 0 && "is-current")} key={month[0]}><span>{month[0]}</span><strong>{month[1]}</strong><small>{month[2]}</small></article>)}</div></section>
    <section className="os-history-strip"><SectionHead label="GEÇMİŞ" title="Haftalar" /><div>{state.weeklyHistory.map((week) => <article className="os-inset-card" key={week.id}><span>{week.label}</span><strong>{week.score}%</strong><p>{week.summary}</p></article>)}</div></section>
  </div>;
}

function BodyArea({ state, logActivity }: { state: PersonalOSState; logActivity: (log: Omit<ActivityLog, "id" | "date">, amount?: number) => void }) {
  const [activity, setActivity] = useState("Tam vücut antrenmanı");
  const [duration, setDuration] = useState(45);
  const target = state.weeklyTargets.find((item) => item.id === "weekly-sport")!;
  return <div className="os-area-layout"><section className="os-inset-card os-area-hero"><Dumbbell /><span>HAFTALIK HEDEF</span><h2>{target.current}/{target.target} spor</h2><p>İlk altı hafta performans değil, devamlılık.</p><ProgressBar value={(target.current / target.target) * 100} /></section><section className="os-inset-card os-action-form"><SectionHead label="YENİ OTURUM" title="Antrenman kaydet" /><label><span>Aktivite</span><input value={activity} onChange={(event) => setActivity(event.target.value)} /></label><label><span>Süre</span><div className="os-choice-row">{[30,45,60].map((value) => <button className={duration === value ? "is-active" : ""} key={value} onClick={() => setDuration(value)}>{value} dk</button>)}</div></label><button className="os-solid-button" onClick={() => logActivity({ area: "body", title: activity, duration })}><Check />Kaydet</button></section><ActivityHistory state={state} area="body" /></div>;
}

function CuriosityArea({ state, setState }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>> }) {
  const [offset, setOffset] = useState(0);
  const questions = useMemo(() => Array.from({ length: Math.min(6, state.curiosityQuestions.length) }, (_, index) => state.curiosityQuestions[(offset + index) % state.curiosityQuestions.length]), [offset, state.curiosityQuestions]);
  const choose = (question: CuriosityQuestion) => setState((current) => {
    const targets = current.weeklyTargets.map((target) => target.id === "weekly-curiosity" ? { ...target, current: 1 } : target);
    return { ...current, curiosityMission: { id: uid("mission"), questionId: question.id, question: question.question, startedAt: todayIso(), stage: "explore" }, weeklyTargets: targets, weeklyPlans: current.weeklyPlans.map((plan, index) => index === 0 ? { ...plan, targets } : plan), recentQuestionIds: [question.id, ...current.recentQuestionIds.filter((id) => id !== question.id)].slice(0, 8) };
  });
  const order = ["explore", "understand", "create", "explain", "complete"] as const;
  const advance = () => setState((current) => current.curiosityMission ? { ...current, curiosityMission: { ...current.curiosityMission, stage: order[Math.min(order.indexOf(current.curiosityMission.stage) + 1, order.length - 1)] } } : current);
  const mission = state.curiosityMission;
  const nextCopy = mission?.stage === "explore" ? "20 dakika araştır" : mission?.stage === "understand" ? "Kendi cümlelerinle yaz" : mission?.stage === "create" ? "Küçük bir çıktı seç" : mission?.stage === "explain" ? "5 dakika sesli anlat" : "Misyon tamamlandı";
  return <div className="os-curiosity-layout"><section className="os-deck"><SectionHead label="CURIOSITY DECK" title="Bir soru seç" action="Başka sorular" onAction={() => setOffset((value) => value + 6)} /><div>{questions.map((question) => <button className="os-inset-card" key={question.id} onClick={() => choose(question)}><span>{question.category}</span><strong>{question.question}</strong><ArrowRight /></button>)}</div></section><section className="os-inset-card os-mission-panel">{mission ? <><span>AKTİF MERAK MİSYONU</span><h2>{mission.question}</h2><div className="os-mission-steps">{order.slice(0,4).map((stage,index) => <span className={cx(order.indexOf(mission.stage) >= index && "is-reached", mission.stage === stage && "is-active")} key={stage}><i>{index+1}</i>{["Araştır","Anla","Üret","Anlat"][index]}</span>)}</div><div className="os-next-action"><small>ŞİMDİ</small><strong>{nextCopy}</strong>{mission.stage === "create" && <div className="os-output-choices">{["Diyagram","Mini simülasyon","Poster","UI konsepti","Timeline","Kısa video"].map((item) => <button key={item} onClick={() => setState((current) => current.curiosityMission ? { ...current, curiosityMission: { ...current.curiosityMission, creationType: item } } : current)}>{item}</button>)}</div>}<button className="os-solid-button" onClick={advance} disabled={mission.stage === "complete"}>{mission.stage === "complete" ? <><Check />Tamamlandı</> : <>Adımı bitir<ArrowRight /></>}</button></div></> : <div className="os-mission-empty"><Telescope /><h2>Soldan bir soru seç</h2><p>Akış otomatik olarak araştırma, anlama, üretme ve anlatma adımlarına ayrılacak.</p></div>}</section></div>;
}

function CreativeArea({ state, setState, go, logActivity }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; go: (section: Section) => void; logActivity: (log: Omit<ActivityLog, "id" | "date">, amount?: number) => void }) {
  const [offset, setOffset] = useState(0);
  const idea = state.creativeIdeas[offset % state.creativeIdeas.length];
  const startProject = () => {
    const project: Project = { id: uid("project"), title: idea.title, category: "YARATICI / LAB", description: idea.description, status: "todo", priority: "medium", startDate: todayIso(), progress: 0, tags: ["yaratıcı deney"], nextAction: "İlk 20 dakikalık eskizi hazırla", subtasks: [{ id: uid("sub"), title: "Referansları seç", completed: false }, { id: uid("sub"), title: "İlk eskizi üret", completed: false }], activity: [{ id: uid("activity"), type: "created", label: "Creative Deck'ten oluşturuldu", at: new Date().toISOString() }] };
    setState((current) => ({ ...current, projects: [project, ...current.projects] })); go("projects");
  };
  return <div className="os-creative-layout"><section className="os-inset-card os-creative-stage"><span>CREATIVE DECK</span><Sparkles /><h2>{idea.title}</h2><p>{idea.description}</p><div><button onClick={() => setOffset((value) => value + 1)}><RefreshCcw />Yeni fikir</button><button className={idea.saved ? "is-active" : ""} onClick={() => setState((current) => ({ ...current, creativeIdeas: current.creativeIdeas.map((item) => item.id === idea.id ? { ...item, saved: !item.saved } : item) }))}><Star />{idea.saved ? "Kaydedildi" : "Kaydet"}</button></div><button className="os-solid-button" onClick={startProject}>Projeye başla<ArrowRight /></button></section><section className="os-inset-card os-session-quick"><SectionHead label="3+ SAAT / HAFTA" title="Yaratıcı oturum" /><p>Bir proje seç, süreyi kaydet ve çık.</p><div className="os-choice-row">{[30,60,90].map((duration) => <button key={duration} onClick={() => logActivity({ area: "creative", title: idea.title, duration }, duration / 60)}>{duration} dk</button>)}</div></section><ActivityHistory state={state} area="creative" /></div>;
}

function EnglishArea({ state, logActivity }: { state: PersonalOSState; logActivity: (log: Omit<ActivityLog, "id" | "date">, amount?: number) => void }) {
  const actions = [["10 dk konuş", "Titan'da yaşamak nasıl olurdu?", 10], ["15 dk izle", "İngilizce bir bilim videosu", 15], ["İngilizce araştır", "Merak sorunu İngilizce kaynaklarla ara", 20]] as const;
  return <PracticeArea icon={Languages} label="ENGLISH" title="İngilizceyi kullan" note="Ders değil; tüketim ve iletişim dili." actions={actions.map(([title, detail, duration]) => ({ title, detail, action: () => logActivity({ area: "english", title, duration }) }))} history={<ActivityHistory state={state} area="english" />} />;
}

function DictionArea({ state, setState, logActivity }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; logActivity: (log: Omit<ActivityLog, "id" | "date">, amount?: number) => void }) {
  const [topicIndex, setTopicIndex] = useState(0);
  const [score, setScore] = useState(3);
  const [tempo, setTempo] = useState(3);
  const [clarity, setClarity] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [fillerWords, setFillerWords] = useState(0);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const topics = ["Bu hafta öğrendiğin şeyi anlat", "Bir film, oyun veya ürünü yorumla", "Karmaşık bir şeyi basitçe açıkla", "Çocukluk anını anlat", "Katılmadığın bir fikri açıklamayı dene"];
  const saveRecording = async () => {
    if (!draft || saving) return;
    setSaving(true); setSaveError("");
    try {
      const formData = new FormData();
      formData.append("audio", draft.blob, `diksiyon.${draft.mimeType.includes("mp4") ? "mp4" : draft.mimeType.includes("ogg") ? "ogg" : "webm"}`);
      const response = await fetch("/api/recordings", { method: "POST", body: formData });
      const payload = await response.json() as ({ key: string; mimeType: string; size: number } | { error: string });
      if (!response.ok || !("key" in payload)) throw new Error("error" in payload ? payload.error : "Ses kaydedilemedi");
      const recording: VoiceRecording = { ...payload, durationSeconds: draft.durationSeconds };
      logActivity({ area: "diction", title: topics[topicIndex], duration: Math.max(1, Math.round(draft.durationSeconds / 60)), note: note.trim() || undefined, score, tempo, clarity, fillerWords, confidence, recording });
      setNote(""); setDraft(null); setRecorderKey((value) => value + 1);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Kayıt saklanamadı");
    } finally {
      setSaving(false);
    }
  };
  return <div className="os-diction-layout"><section className="os-inset-card os-area-hero os-diction-topic"><Mic2 /><span>2–3 KAYIT / HAFTA</span><h2>{topics[topicIndex]}</h2><p>5–10 dakika anlat. Mükemmellik değil, daha net ifade hedefleniyor.</p><button className="os-quiet-button" onClick={() => setTopicIndex((value) => (value + 1) % topics.length)}><RefreshCcw />Başka konu</button></section><VoiceRecorder key={recorderKey} onChange={setDraft} /><section className="os-inset-card os-action-form os-diction-review"><SectionHead label="KAYIT SONRASI" title="Kısa değerlendirme" /><ScoreField label="Genel" value={score} setValue={setScore} /><div className="os-diction-metrics"><ScoreField label="Tempo" value={tempo} setValue={setTempo} /><ScoreField label="Netlik" value={clarity} setValue={setClarity} /><ScoreField label="Özgüven" value={confidence} setValue={setConfidence} /></div><div className="os-diction-notes"><label><span>Dolgu kelimesi</span><input min="0" inputMode="numeric" type="number" value={fillerWords} onChange={(event) => setFillerWords(Math.max(0, Number(event.target.value)))} /></label><label><span>Kısa not</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bir sonraki kayıtta neyi değiştireceksin?" /></label></div>{saveError && <p className="os-form-error" role="alert">{saveError}</p>}<button className="os-solid-button" disabled={!draft || saving} onClick={saveRecording}><Check />{saving ? "Saklanıyor…" : "Kaydı sakla"}</button></section><DictionHistory state={state} setState={setState} /></div>;
}

function ScoreField({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return <label className="os-score-field"><span>{label}</span><div className="os-score-row">{[1,2,3,4,5].map((score) => <button type="button" aria-label={`${label}: ${score}`} className={value === score ? "is-active" : ""} key={score} onClick={() => setValue(score)}>{score}</button>)}</div></label>;
}

function DictionHistory({ state, setState }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>> }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const items = state.activityLogs.filter((log) => log.area === "diction").slice(0, 8);
  const remove = async (log: ActivityLog) => {
    if (deletingId) return;
    setDeletingId(log.id);
    try {
      if (log.recording?.key) {
        const response = await fetch(`/api/recordings?key=${encodeURIComponent(log.recording.key)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Kayıt silinemedi");
      }
      setState((current) => ({ ...current, activityLogs: current.activityLogs.filter((item) => item.id !== log.id) }));
    } finally {
      setDeletingId(null);
    }
  };
  return <section className="os-inset-card os-diction-history"><SectionHead label="SON KAYITLAR" title="Kayıt arşivi" /><div>{items.length ? items.map((log) => <article key={log.id}><header><span><strong>{log.title}</strong><small>{log.date} · {log.recording ? formatRecordingDuration(log.recording.durationSeconds) : `${log.duration ?? 0} dk`} · {log.score ?? 0}/5</small></span><button aria-label={`${log.title} kaydını sil`} disabled={deletingId === log.id} onClick={() => remove(log)}><Trash2 /></button></header>{log.recording && <audio controls preload="none" src={`/api/recordings?key=${encodeURIComponent(log.recording.key)}`}>Tarayıcın ses oynatmayı desteklemiyor.</audio>}{log.note && <p>{log.note}</p>}<footer><span>Tempo <b>{log.tempo ?? "–"}</b></span><span>Netlik <b>{log.clarity ?? "–"}</b></span><span>Özgüven <b>{log.confidence ?? "–"}</b></span><span>Dolgu <b>{log.fillerWords ?? "–"}</b></span></footer></article>) : <p>İlk ses kaydın burada görünecek.</p>}</div></section>;
}

function formatRecordingDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function SocialArea({ state, setState, logActivity }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>>; logActivity: (log: Omit<ActivityLog, "id" | "date">, amount?: number) => void }) {
  const [offset, setOffset] = useState(0); const ideas = ["Müzeye git", "Yeni bir semtte fotoğraf çek", "Bir saat kitapçı gez", "Farklı bir sahilde yürü", "Sergiye git", "Yeni bir kafeyi tek başına dene", "Halka açık etkinliğe katıl"];
  const visible = Array.from({ length: 4 }, (_, index) => ideas[(offset + index) % ideas.length]);
  const plan = (title: string) => setState((current) => ({ ...current, tasks: [{ id: uid("place"), title, category: "place", completed: false, priority: "medium", date: todayIso(6), placeType: "Solo keşif", subtasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current.tasks] }));
  return <div className="os-social-layout"><section className="os-deck"><SectionHead label="SOLO EXPLORATION" title="Bir sonraki küçük çıkış" action="Beni şaşırt" onAction={() => setOffset((value) => value + 3)} /><div>{visible.map((idea, index) => <button className="os-inset-card" key={idea} onClick={() => plan(idea)}><span>0{index+1}</span><strong>{idea}</strong><Plus /></button>)}</div></section><section className="os-inset-card os-social-path"><span>AY 1</span><h2>Sosyal zemini kur</h2>{["Küçük günlük etkileşim", "Haftalık solo çıkış", "Bir düzenli ortama gir"].map((item) => <button key={item} onClick={() => logActivity({ area: "social", title: item })}><Circle />{item}<ChevronRight /></button>)}<small>Hedef “arkadaş bul” değil; düzenli karşılaşma ihtimalini artırmak.</small></section><ActivityHistory state={state} area="social" /></div>;
}

function CareerArea({ state, logActivity }: { state: PersonalOSState; logActivity: (log: Omit<ActivityLog, "id" | "date">, amount?: number) => void }) {
  const steps = ["Deney seç", "Örnek iş oluştur", "Mini portföy yap", "Gerçek birine ulaş", "İlk dış gelir"];
  const completed = state.activityLogs.filter((log) => log.area === "career" && steps.includes(log.title)).map((log) => log.title);
  const services = ["Mobil UI prototipi", "Landing page redesign", "Küçük işletme arayüzü", "İnteraktif web deneyimi"];
  return <div className="os-career-layout"><section className="os-career-lines">{[["BASE","Mevcut gelir tabanı"],["INCOME EXPERIMENT","Satılabilir küçük hizmet"],["PERSONAL LAB","Kendi yaratıcı projelerin"]].map(([title,text]) => <article className="os-inset-card" key={title}><span>{title}</span><strong>{text}</strong></article>)}</section><section className="os-inset-card os-money-flow"><SectionHead label="PARA DENEYİ" title="İlk dış gelir" /><div>{steps.map((step,index) => <button className={completed.includes(step) ? "is-complete" : ""} key={step} onClick={() => !completed.includes(step) && logActivity({ area: "career", title: step, duration: 30 })}><span>{completed.includes(step) ? <Check /> : index+1}</span><strong>{step}</strong><ArrowRight /></button>)}</div></section><section className="os-inset-card os-service-deck"><SectionHead label="DENEY SEÇ" title="Neyi satmayı denersin?" /><div>{services.map((service) => <button key={service} onClick={() => logActivity({ area: "career", title: service, duration: 30 })}>{service}<Plus /></button>)}</div></section></div>;
}

function SpaceArea({ state, setState }: { state: PersonalOSState; setState: React.Dispatch<React.SetStateAction<PersonalOSState>> }) {
  const [selectedId, setSelectedId] = useState(state.spaceExperiments.find((item) => item.status === "active")?.id ?? state.spaceExperiments[0]?.id);
  const selected = state.spaceExperiments.find((item) => item.id === selectedId)!;
  const update = (id: string, updates: Partial<SpaceExperiment>) => setState((current) => ({ ...current, spaceExperiments: current.spaceExperiments.map((item) => item.id === id ? { ...item, ...updates } : item) }));
  return <div className="os-space-layout"><section className="os-space-list"><SectionHead label="3 AYLIK DENEY" title="Alanlar" />{state.spaceExperiments.map((experiment) => <button className={cx("os-inset-card", selectedId === experiment.id && "is-active")} key={experiment.id} onClick={() => setSelectedId(experiment.id)} disabled={experiment.status === "locked"}><span>{experiment.status === "active" ? "AKTİF" : experiment.status === "complete" ? "BİTTİ" : experiment.status === "locked" ? "SONRA" : "HAZIR"}</span><strong>{experiment.topic}</strong><ArrowRight /></button>)}</section><section className="os-inset-card os-space-detail"><Orbit /><span>{selected.topic}</span><div><small>ÖĞREN</small><h2>{selected.learn}</h2></div><div><small>DENEY</small><h2>{selected.experiment}</h2></div><label><span>Ne fark ettin?</span><textarea value={selected.reflection ?? ""} onChange={(event) => update(selected.id, { reflection: event.target.value })} placeholder="Fiziği anlamak mı, görselleştirmek mi daha çok hoşuna gitti?" /></label><button className="os-solid-button" onClick={() => update(selected.id, { status: selected.status === "complete" ? "active" : "complete" })}>{selected.status === "complete" ? "Yeniden aç" : "Deneyi tamamla"}<ArrowRight /></button></section></div>;
}

function PracticeArea({ icon: Icon, label, title, note, actions, history }: { icon: typeof Languages; label: string; title: string; note: string; actions: Array<{ title: string; detail: string; action: () => void }>; history: React.ReactNode }) {
  return <div className="os-practice-layout"><section className="os-inset-card os-area-hero"><Icon /><span>{label}</span><h2>{title}</h2><p>{note}</p></section><section className="os-practice-actions">{actions.map((item) => <button className="os-inset-card" key={item.title} onClick={item.action}><span><FlaskConical /></span><strong>{item.title}</strong><small>{item.detail}</small><ArrowRight /></button>)}</section>{history}</div>;
}

function ActivityHistory({ state, area }: { state: PersonalOSState; area: ActivityLog["area"] }) {
  const items = state.activityLogs.filter((log) => log.area === area).slice(0, 5);
  return <section className="os-inset-card os-activity-history"><SectionHead label="SON KAYITLAR" title="Geçmiş" /><div>{items.length ? items.map((log) => <article key={log.id}><Check /><span><strong>{log.title}</strong><small>{log.duration ? `${log.duration} dk` : "Tamamlandı"}</small></span><time>{log.date}</time></article>) : <p>İlk kayıt burada görünecek.</p>}</div></section>;
}
