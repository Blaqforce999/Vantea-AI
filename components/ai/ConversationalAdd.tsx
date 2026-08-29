'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowUp, CheckCircle2, ImagePlus, Loader2, MessageCircle, Mic, Plus, X } from 'lucide-react';

import { addItem } from '@/app/(app)/(with-nav)/collection/actions';
import { ManualEntryModal } from '@/components/ai/ManualEntryModal';
import { ParsePreview } from '@/components/ai/ParsePreview';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { compressImageFile, ImageTooLargeError } from '@/lib/image';
import { MILESTONE_DESCRIPTIONS, MILESTONE_LABELS } from '@/lib/constants';
import { formatMoney } from '@/lib/format';
import type { ParsedItem, ParseResult } from '@/lib/ai';

type ParseResponse =
  | { ok: true; data: { result: ParseResult } }
  | { ok: false; error: { code: string; message: string } };

// Minimal typing for the browser Web Speech API — not in the default TS lib,
// and deliberately narrow rather than `any` (eslint's no-explicit-any is an
// error in this project).
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * The redesigned conversational input bar — default/focused/typing/
 * ready-to-submit/image-attached/voice-recording/submitted/disabled states
 * from the Figma spec, on top of the same Understand → Show → Confirm →
 * Execute flow as before: parsing is read-only, the write only happens
 * after the user confirms via ParsePreview's ConfirmDialog, through the same
 * addItem action a manual form would call. See
 * .agents/rules/architecture.md "The AI Layer".
 */
export function ConversationalAdd() {
  const router = useRouter();
  const { showToast } = useToast();

  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const [preview, setPreview] = useState<ParsedItem | null>(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<{ name: string; value?: number; currency?: string } | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const busy = parsing || confirming;

  useEffect(() => {
    setVoiceSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  function clearImage() {
    setImageDataUrl(null);
    setImageFileName(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await compressImageFile(file);
      setImageDataUrl(dataUrl);
      setImageFileName(file.name);
    } catch (err) {
      setImageError(err instanceof ImageTooLargeError ? err.message : "Couldn't read that image.");
      clearImage();
    }
  }

  function startRecording() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ');
      setText(transcript);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || busy) return;

    setParsing(true);
    setError(null);
    setReply(null);
    setJustAdded(null);

    // A network failure here (not just an { ok: false } response) must still
    // release `parsing` — otherwise the input stays permanently disabled
    // after one dropped request, looking like it silently stopped accepting
    // input.
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as ParseResponse;

      // A non-match (a greeting, or text too ambiguous to extract from) is
      // NOT an error — the local parser replies conversationally instead of
      // opening a save-preview for nothing. Only a genuine request failure
      // (bad input, rate limit, a real bug) lands in the `!json.ok` branch.
      if (!json.ok) {
        setError(json.error.message);
        showToast({ title: 'Could not read that', description: json.error.message, variant: 'error' });
        return;
      }

      if (json.data.result.type === 'reply') {
        setReply(json.data.result.message);
        setText('');
        window.setTimeout(() => setReply(null), 8000);
        return;
      }

      setPreview(json.data.result.item);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      showToast({ title: 'Could not save. Check your connection', variant: 'error' });
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm(edited: ParsedItem, editedImageUrl: string | null) {
    setConfirming(true);
    // A stale error/reply from a previous attempt must not linger next to a
    // fresh success (or vice versa) — each new attempt starts from a clean
    // slate rather than layering its result on top of the last one's.
    setError(null);
    setReply(null);

    try {
      const result = await addItem({ ...edited, imageUrl: editedImageUrl ?? undefined });

      if (!result.ok) {
        setError(result.error.message);
        showToast({ title: 'Could not save. Check your connection', description: result.error.message, variant: 'error' });
        setPreview(null);
        return;
      }

      setJustAdded({ name: edited.name, value: edited.value, currency: edited.currency });
      showToast({ title: `${edited.name} added to your things`, variant: 'success' });
      for (const milestone of result.data.newMilestones) {
        showToast({
          title: `${MILESTONE_LABELS[milestone.type]}!`,
          description: MILESTONE_DESCRIPTIONS[milestone.type],
          variant: 'milestone',
        });
      }

      setPreview(null);
      setText('');
      clearImage();
      router.refresh();
      window.setTimeout(() => setJustAdded(null), 6000);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      showToast({ title: 'Could not save. Check your connection', variant: 'error' });
      setPreview(null);
    } finally {
      setConfirming(false);
    }
  }

  const hasContent = text.trim().length > 0;
  const hasImage = imageFileName !== null;

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {recording ? (
          <div className="flex items-center gap-12 rounded-full border border-error bg-surface px-16 py-8">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-error" />
            <span className="flex-1 truncate text-body-regular text-error">{text || 'Recording…'}</span>
            <span className="flex items-center gap-2" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-14 w-2 animate-pulse rounded-full bg-error"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={stopRecording}
              aria-label="Stop recording"
              className="rounded-full p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-8 rounded-full border bg-surface py-4 pl-16 pr-4 transition-colors',
              // The ring only decorates the "focused and empty" invitation-to-type
              // moment — once there's real content (or an image is attached),
              // it reverts to a plain border even while still focused.
              focused && !hasContent && !hasImage ? 'border-primary ring-2 ring-primary' : 'border-outline-variant',
              busy && 'opacity-60',
            )}
          >
            {hasImage && !busy && (
              <div className="flex shrink-0 items-center gap-6 rounded-full bg-surface-container-low px-10 py-4 text-caption text-on-surface-variant">
                <ImagePlus size={14} aria-hidden="true" />
                <span className="max-w-[120px] truncate">{imageFileName}</span>
                <button type="button" onClick={clearImage} aria-label="Remove image" className="hover:text-warm-ink">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}

            {busy ? (
              <span className="min-w-0 flex-1 truncate text-body-regular italic text-on-surface-variant">
                Processing your last entry…
              </span>
            ) : (
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="I bought a new laptop for 3.5 million…"
                className="min-w-0 flex-1 bg-transparent text-body-regular text-warm-ink placeholder:text-on-surface-variant outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              />
            )}

            {/* Icon set follows a focus × content matrix, not content alone:
                unfocused+empty shows attach+mic+arrow(disabled); focused+empty
                drops to just attach; focused+typing drops to just clear; only
                once unfocused again (or an image is already attached) does the
                arrow stand alone. An attached image always takes over this
                slot entirely — attach/mic/clear all step aside for the chip. */}
            {!busy && !hasImage && !focused && !hasContent && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach an image"
                  className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ImagePlus size={18} aria-hidden="true" />
                </button>
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label="Add by voice"
                    className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Mic size={18} aria-hidden="true" />
                  </button>
                )}
              </>
            )}

            {!busy && !hasImage && focused && !hasContent && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach an image"
                className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ImagePlus size={18} aria-hidden="true" />
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {!busy && !hasImage && focused && hasContent && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setText('')}
                aria-label="Clear"
                className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}

            <button
              type="submit"
              disabled={busy || !hasContent}
              aria-label="Add this"
              className={cn(
                'flex h-32 w-32 shrink-0 items-center justify-center rounded-full transition-colors',
                // Visually hidden (not unmounted) in the focused/empty and
                // focused/typing cells, so pressing Enter still submits the
                // form even while the button itself isn't shown.
                !busy && !hasImage && focused && 'hidden',
                busy
                  ? 'bg-surface-container-high text-on-surface-variant'
                  : hasContent
                    ? 'bg-achievement text-on-achievement hover:opacity-90'
                    : 'bg-surface-container-high text-outline',
              )}
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUp size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </form>

      {imageError && <p className="text-caption text-error">{imageError}</p>}
      {error && <p className="text-caption text-error">{error}</p>}

      {reply && (
        <div className="flex items-center gap-12 rounded-xl bg-surface-container-low px-16 py-12 text-warm-ink">
          <MessageCircle size={20} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
          <p className="text-body-small">{reply}</p>
        </div>
      )}

      {justAdded && (
        <div className="flex items-center gap-12 rounded-full border border-tertiary bg-tertiary-container px-16 py-12 text-on-tertiary-container">
          <CheckCircle2 size={20} className="shrink-0" aria-hidden="true" />
          <p className="text-body-small font-medium">
            Got it! Added {justAdded.name}
            {justAdded.value !== undefined && justAdded.currency
              ? ` · ${formatMoney(justAdded.value, justAdded.currency)}`
              : ''}
          </p>
        </div>
      )}

      {preview && (
        <ParsePreview
          preview={preview}
          imageUrl={imageDataUrl}
          pending={confirming}
          onConfirm={handleConfirm}
          onCancel={() => setPreview(null)}
        />
      )}

      <button
        type="button"
        onClick={() => setManualEntryOpen(true)}
        className="flex items-center justify-center gap-6 self-center text-body-small text-on-surface-variant hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Plus size={16} aria-hidden="true" />
        Add Manually
      </button>
      <ManualEntryModal open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} />
    </div>
  );
}
