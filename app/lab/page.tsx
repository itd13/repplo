'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_LENGTH = 20;
const MAX_LENGTH = 500;
const NEAR_MAX = MAX_LENGTH - 20; // 480
const DAILY_FREE_LIMIT = 5;

const TONES = ['Balanced', 'Casual', 'Professional', 'Friendly'] as const;
type Tone = (typeof TONES)[number];

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function PasteButton({ onPaste }: { onPaste: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [pasting, setPasting] = useState(false);

  useEffect(() => {
    setSupported(!!navigator.clipboard?.readText);
  }, []);

  if (!supported) return null;

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      onPaste(text);
      setPasting(true);
      setTimeout(() => setPasting(false), 600);
    } catch {
      // permission denied or empty clipboard — silently ignore
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handlePaste}
      animate={pasting ? { scale: [1, 0.88, 1] } : { scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      <ClipboardIcon />
      Paste
    </motion.button>
  );
}

function ToneSelector({ value, onChange }: { value: Tone; onChange: (t: Tone) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-0.5"
      >
        Tone: {value} <span className="ml-0.5 text-[10px]">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-10 min-w-[120px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm overflow-hidden"
          >
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => { onChange(tone); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  tone === value
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {tone}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      className="shrink-0 text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </motion.button>
  );
}

function ReplyCard({ text, index, toneLabel }: { text: string; index: number; toneLabel?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4"
    >
      {toneLabel && (
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{toneLabel}</span>
      )}
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{text}</p>
      <div className="flex justify-end">
        <CopyButton text={text} />
      </div>
    </motion.div>
  );
}

export default function LabPage() {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<Tone>('Balanced');
  const [replies, setReplies] = useState<string[]>([]);
  const [toneLabels, setToneLabels] = useState<string[] | null>(null);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notAMessage, setNotAMessage] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [repliesLeft, setRepliesLeft] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { repliesLeft: number; limitReached: boolean } | null) => {
        if (!data) return;
        setRepliesLeft(data.repliesLeft);
        if (data.limitReached) setDailyLimitReached(true);
      })
      .catch(() => {});
  }, []);

  const trimmed = message.trim();
  const charCount = trimmed.length;
  const rawCount = message.length;
  const meetsMinimum = charCount >= MIN_LENGTH;
  const nearMax = rawCount >= NEAR_MAX;
  const showCounter = rawCount > 0 && (!meetsMinimum || nearMax);

  const counterColor = nearMax
    ? 'text-red-500 dark:text-red-400'
    : 'text-green-600 dark:text-green-400';

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length > MAX_LENGTH) return;
    setMessage(val);
    if (notAMessage) setNotAMessage(false);
    if (dailyLimitReached) setDailyLimitReached(false);
  }

  async function handleGenerate() {
    if (!meetsMinimum || loading || dailyLimitReached) return;
    setLoading(true);
    setError(null);
    setNotAMessage(false);
    setGenerated(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, tone }),
      });

      const data = await res.json() as { replies?: [string, string, string]; toneLabels?: string[]; error?: string; repliesLeft?: number };

      if (data.error === 'not_a_message') {
        setNotAMessage(true);
        return;
      }

      if (data.error === 'daily_limit_reached') {
        setDailyLimitReached(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong');
      }

      setReplies(data.replies!);
      setToneLabels(data.toneLabels ?? null);
      setGenerated(true);
      setRepliesLeft(prev => {
        const next = prev === null
          ? (typeof data.repliesLeft === 'number' ? data.repliesLeft : null)
          : Math.max(0, prev - 1);
        if (next === 0) setDailyLimitReached(true);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const showRepliesLeft = generated && repliesLeft !== null && repliesLeft > 0 && !dailyLimitReached;

  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-xl flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Repplo</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Paste a message, get three ready-to-send replies.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <textarea
              value={message}
              onChange={handleChange}
              placeholder="Paste the message you received — the more context, the better the replies."
              rows={6}
              className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-4 pr-16 py-3 text-sm leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 transition"
            />
            <PasteButton onPaste={(text) => {
              const clamped = text.slice(0, MAX_LENGTH);
              setMessage(clamped);
              if (notAMessage) setNotAMessage(false);
            }} />
          </div>

          {/* notAMessage warning + char counter */}
          <div className="flex items-start justify-between gap-2 min-h-[1.25rem]">
            <AnimatePresence>
              {notAMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-amber-600 dark:text-amber-400"
                >
                  This doesn&apos;t look like a message — try pasting a DM or email you received.
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showCounter && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`text-xs tabular-nums ml-auto ${counterColor}`}
                >
                  {nearMax ? `${rawCount}/${MAX_LENGTH}` : `${charCount}/${MIN_LENGTH}`}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Tone selector (left) + replies-left counter (right) */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <ToneSelector value={tone} onChange={setTone} />
            {/* TODO Week 7: replace fade in/out with vertical flip board animation on number change (like a scoreboard). Use Framer Motion AnimatePresence with y: [-10, 0] enter and y: [0, 10] exit so the number flips vertically rather than fading out completely on each generation. */}
            <AnimatePresence>
              {showRepliesLeft && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`text-xs tabular-nums ${repliesLeft === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                >
                  {repliesLeft} {repliesLeft === 1 ? 'reply' : 'replies'} left
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!meetsMinimum || loading || dailyLimitReached}
          className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating…' : generated ? 'New Replies' : 'Generate Replies'}
        </button>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <AnimatePresence>
          {dailyLimitReached && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3"
            >
              You&apos;ve used your 5 free replies today. Come back tomorrow — or upgrade to Pro for unlimited replies.
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {generated && (
            <motion.div
              key="cards"
              className="flex flex-col gap-3"
            >
              {replies.map((reply, i) => (
                <ReplyCard key={i} text={reply} index={i} toneLabel={toneLabels?.[i]} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
