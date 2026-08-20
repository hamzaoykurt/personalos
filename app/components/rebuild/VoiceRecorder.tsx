/* eslint-disable jsx-a11y/media-has-caption -- recordings are private raw voice notes without authored caption tracks */
"use client";

import { Mic2, RefreshCcw, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type RecordingDraft = {
  blob: Blob;
  url: string;
  mimeType: string;
  durationSeconds: number;
};

const MAX_DURATION_SECONDS = 10 * 60;
const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function supportedMimeType() {
  return preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export default function VoiceRecorder({ onChange }: { onChange: (draft: RecordingDraft | null) => void }) {
  const [status, setStatus] = useState<"idle" | "requesting" | "recording" | "preview" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const draftRef = useRef<RecordingDraft | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const releaseMicrophone = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearDraft = () => {
    if (draft?.url) URL.revokeObjectURL(draft.url);
    draftRef.current = null;
    setDraft(null);
    onChange(null);
    setElapsed(0);
    setError("");
    setStatus("idle");
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const start = async () => {
    clearDraft();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Bu tarayıcı ses kaydını desteklemiyor.");
      setStatus("error");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      const mimeType = supportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128_000 }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        releaseMicrophone();
        if (!blob.size) {
          setError("Kayıt oluşturulamadı. Mikrofonu kontrol edip tekrar dene.");
          setStatus("error");
          return;
        }
        const nextDraft = { blob, url: URL.createObjectURL(blob), mimeType: blob.type, durationSeconds };
        draftRef.current = nextDraft;
        setDraft(nextDraft);
        onChange(nextDraft);
        setElapsed(durationSeconds);
        setStatus("preview");
      };
      recorder.onerror = () => {
        releaseMicrophone();
        setError("Kayıt sırasında bir sorun oluştu.");
        setStatus("error");
      };
      startedAtRef.current = Date.now();
      recorder.start(500);
      setStatus("recording");
    } catch (cause) {
      releaseMicrophone();
      const denied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setError(denied ? "Kayıt için mikrofon izni vermen gerekiyor." : "Mikrofona ulaşılamadı. Başka bir uygulama kullanıyor olabilir.");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (status !== "recording") return;
    const timer = window.setInterval(() => {
      const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      setElapsed(seconds);
      if (seconds >= MAX_DURATION_SECONDS && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseMicrophone();
    if (draftRef.current?.url) URL.revokeObjectURL(draftRef.current.url);
  }, []);

  return <section className={`os-voice-recorder is-${status}`} aria-label="Ses kaydı">
    <div className="os-recorder-display">
      <span className="os-record-light" aria-hidden="true" />
      <div>
        <small>{status === "recording" ? "KAYITTA" : status === "preview" ? "DİNLE" : "SES KAYDI"}</small>
        <strong>{formatDuration(elapsed)}</strong>
      </div>
      <div className="os-waveform" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
    </div>

    {status === "preview" && draft ? <audio ref={audioRef} controls preload="metadata" src={draft.url}>Tarayıcın ses oynatmayı desteklemiyor.</audio> : <p aria-live="polite">{status === "recording" ? "Konuş. Bitirdiğinde durdur." : status === "requesting" ? "Mikrofon hazırlanıyor…" : "Kayıt yalnızca sen başlattığında açılır."}</p>}
    {error && <p className="os-recorder-error" role="alert">{error}</p>}

    <div className="os-recorder-actions">
      {status === "recording" ? <button type="button" className="os-record-stop" onClick={stop}><Square />Kaydı durdur</button> : status === "preview" ? <><button type="button" className="os-record-primary" onClick={() => audioRef.current?.play()}><Volume2 />Dinle</button><button type="button" className="os-record-again" onClick={start}><RefreshCcw />Yeniden</button></> : <button type="button" className="os-record-primary" onClick={start} disabled={status === "requesting"}><Mic2 />{status === "requesting" ? "Hazırlanıyor" : "Kayda başla"}</button>}
    </div>
  </section>;
}
