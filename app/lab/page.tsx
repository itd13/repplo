'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

function ReplyCard({ text, index }: { text: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4"
    >
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{text}</p>
      <div className="flex justify-end">
        <CopyButton text={text} />
      </div>
    </motion.div>
  );
}

export default function LabPage() {
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Something went wrong');
      }

      const data = await res.json() as { replies: [string, string, string] };
      setReplies(data.replies);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col flex-1 items-center px-4 py-16 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-xl flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Repplo</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Paste a message, get three ready-to-send replies.</p>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste the message you received…"
          rows={6}
          className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-4 py-3 text-sm leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 transition"
        />

        <button
          onClick={handleGenerate}
          disabled={!message.trim() || loading}
          className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating…' : 'Generate Replies'}
        </button>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <AnimatePresence>
          {generated && (
            <motion.div
              key="cards"
              className="flex flex-col gap-3"
            >
              {replies.map((reply, i) => (
                <ReplyCard key={i} text={reply} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
