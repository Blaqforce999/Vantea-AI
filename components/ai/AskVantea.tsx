'use client';

import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type AskResponse =
  | { ok: true; data: { answer: string } }
  | { ok: false; error: { code: string; message: string } };

const EXAMPLE_QUESTIONS = [
  'What is my most valuable thing?',
  'What did I add this month?',
  'How long have I been building?',
  "What's on my wishlist?",
];

/** Answers questions using only the user's own recorded data. Read-only. */
export function AskVantea() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setAnswer(null);

    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const json = (await res.json()) as AskResponse;
    setPending(false);

    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setAnswer(json.data.answer);
  }

  return (
    <div className="flex flex-col gap-16">
      <form onSubmit={handleAsk} className="flex items-end gap-8">
        <div className="flex-1">
          <Input
            id="ask-vantea-question"
            label="Ask a question about your own data"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What is my most valuable thing?"
          />
        </div>
        <Button type="submit" disabled={pending || !question.trim()}>
          {pending ? 'Thinking…' : 'Ask'}
        </Button>
      </form>

      <div className="flex flex-wrap gap-8">
        {EXAMPLE_QUESTIONS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQuestion(example)}
            className="rounded-md bg-surface-container px-8 py-4 text-caption text-on-surface-variant hover:bg-surface-container-high"
          >
            {example}
          </button>
        ))}
      </div>

      {error && <p className="text-caption text-error">{error}</p>}
      {answer && (
        <Card>
          <p className="text-body-regular text-warm-ink">{answer}</p>
        </Card>
      )}
    </div>
  );
}
