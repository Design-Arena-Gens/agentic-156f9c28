'use client';

import { FormEvent, useMemo, useState } from 'react';
import styles from './page.module.css';

type Message = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: 'sheet' | 'openrouter';
};

type ChatResponse = {
  answer: string;
  source: 'sheet' | 'openrouter';
  reasoning?: string;
};

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: createId(),
      sender: 'assistant',
      text: 'Hi! Ask me anything. I will check the knowledge base first and fall back to OpenRouter when needed.',
      source: 'sheet'
    }
  ]);
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const canSubmit = useMemo(() => question.trim().length > 0 && !isSending, [question, isSending]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const payload = question.trim();
    setQuestion('');
    const userMessage: Message = {
      id: createId(),
      sender: 'user',
      text: payload
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsSending(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: payload })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = (await response.json()) as ChatResponse;
      const assistantMessage: Message = {
        id: createId(),
        sender: 'assistant',
        text: body.answer,
        source: body.source
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const assistantMessage: Message = {
        id: createId(),
        sender: 'assistant',
        text: 'Sorry, something went wrong while answering your question. Try again in a bit.'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className={styles.container}>
      <section className={styles.chatPanel}>
        <header className={styles.header}>
          <div>
            <h1>Sheet Sensei</h1>
            <p>Google Sheets knowledge base with OpenRouter superpowers.</p>
          </div>
        </header>
        <div className={styles.messages}>
          {messages.map(message => (
            <article key={message.id} data-origin={message.source} className={styles.message} data-role={message.sender}>
              <div className={styles.meta}>
                <span>{message.sender === 'user' ? 'You' : 'Sensei'}</span>
                {message.source && (
                  <span className={styles.badge}>{message.source === 'sheet' ? 'Sheet' : 'OpenRouter'}</span>
                )}
              </div>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
        <form onSubmit={handleSend} className={styles.inputRow}>
          <input
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="Ask your question..."
            disabled={isSending}
          />
          <button type="submit" disabled={!canSubmit}>
            {isSending ? 'Thinking...' : 'Ask'}
          </button>
        </form>
      </section>
    </main>
  );
}
