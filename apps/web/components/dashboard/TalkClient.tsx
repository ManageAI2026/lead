'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Talk screen client. Owns the composer + optimistic chat (wired to POST /api/talk),
 * the demo "Claude Code dispatch" build-task card (client-only approve/reject state),
 * and the changelog rail. Bubble / card / tag styles are ported verbatim from the
 * approved prototype. All colors reference the design-system CSS var tokens.
 */

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

interface ChangelogEntry {
  day: string;
  text: string;
  tag: 'deployed' | 'auto';
}

type TaskState = 'awaiting' | 'approved' | 'rejected';

const SEED_CHANGELOG: ChangelogEntry[] = [
  { day: 'Tue', text: 'Added NPI registry as free enrichment source', tag: 'deployed' },
  { day: 'Mon', text: 'Repair: shadow-DOM extraction strategy for JS-rendered team pages', tag: 'auto' },
  { day: 'Fri', text: 'Raised catch-all confidence penalty 0.15 → 0.25', tag: 'deployed' },
];

// [bg, color, label] per task state — tokenized from the prototype.
const TASK_META: Record<TaskState, [string, string, string]> = {
  awaiting: ['var(--amberl)', 'var(--amber)', 'AWAITING APPROVAL'],
  approved: ['var(--greenl)', 'var(--green)', 'DEPLOYED'],
  rejected: ['var(--redl)', 'var(--red)', 'REJECTED'],
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `local-${Date.now()}-${idCounter}`;
}

function userBubble(): CSSProperties {
  return {
    maxWidth: '76%',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: '14px 14px 4px 14px',
    padding: '10px 14px',
    font: '500 13.5px/1.55 var(--f)',
  };
}

function agentBubble(): CSSProperties {
  return {
    maxWidth: '80%',
    background: 'var(--surf)',
    border: '1px solid var(--borderl)',
    color: 'var(--text)',
    borderRadius: '4px 14px 14px 14px',
    padding: '11px 14px',
    font: '500 13.5px/1.6 var(--f)',
  };
}

export function TalkClient({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(
    initial.map((m) => ({ id: m.id, role: m.role, text: m.text }))
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [taskState, setTaskState] = useState<TaskState>('awaiting');
  const [changelog, setChangelog] = useState<ChangelogEntry[]>(SEED_CHANGELOG);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, taskState]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    try {
      const res = await fetch('/api/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`talk failed: ${res.status}`);
      const data: { reply?: string } = await res.json();
      const reply =
        data.reply ??
        'I ran into an issue reaching the data layer just now — try that again in a moment.';
      setMessages((prev) => [...prev, { id: nextId(), role: 'agent', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'agent',
          text: "I couldn't reach the Operator just now — check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function approve() {
    setTaskState('approved');
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'agent',
        text: 'Deployed. Arizona Medicaid registry is now a free-first discovery source — it’ll fire before any paid provider on Arizona targets.',
      },
    ]);
    setChangelog((prev) => [
      { day: 'Now', text: 'Added AZ Medicaid provider registry as free discovery source', tag: 'deployed' },
      ...prev,
    ]);
  }

  function reject() {
    setTaskState('rejected');
  }

  const approved = taskState === 'approved';
  const taskMeta = TASK_META[taskState];
  const steps: { label: string; done: boolean }[] = [
    { label: 'Planned adapter against packages/providers registry', done: true },
    { label: 'Wrote az-medicaid.adapter.ts + free-source flag', done: true },
    { label: 'Added fixture + 4 passing tests', done: true },
    { label: approved ? 'Promoted to production' : 'Awaiting approval to promote', done: approved },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', animation: 'lbp-up .5s ease' }}>
      {/* Left column — chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 30px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accentl)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 8V4H8" />
              <rect x="4" y="8" width="16" height="12" rx="2" />
              <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
            </svg>
          </span>
          <div>
            <div style={{ font: '700 14px var(--f)', color: 'var(--text)' }}>Operator</div>
            <div style={{ font: '500 11.5px var(--f)', color: 'var(--text3)' }}>
              Runs on your AI key · can run jobs, answer from data, build &amp; fix
            </div>
          </div>
          <button
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: '#fff',
              border: '1px solid var(--border)',
              color: 'var(--text2)',
              borderRadius: 9,
              padding: '7px 12px',
              font: '600 12px var(--f)',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            Rebecca (video)
          </button>
        </div>

        {/* Message list */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 30px',
            maxWidth: 820,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 14,
              }}
            >
              <div style={m.role === 'user' ? userBubble() : agentBubble()}>{m.text}</div>
            </div>
          ))}

          {/* Build-task card (client demo state) */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 14,
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
              overflow: 'hidden',
              margin: '6px 0 8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                background: 'var(--surf)',
                borderBottom: '1px solid var(--borderl)',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--accentl)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span
                    style={{
                      font: '700 8.5px var(--f)',
                      letterSpacing: '.06em',
                      color: 'var(--purple)',
                      background: 'var(--purplel)',
                      padding: '2px 6px',
                      borderRadius: 5,
                    }}
                  >
                    BUILD
                  </span>
                  <span style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>
                    Claude Code dispatch
                  </span>
                </div>
                <div style={{ font: '500 12px var(--f)', color: 'var(--text2)', marginTop: 2 }}>
                  Add Arizona Medicaid provider registry source
                </div>
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  flex: 'none',
                  background: taskMeta[0],
                  color: taskMeta[1],
                  font: '700 9.5px var(--f)',
                  letterSpacing: '.06em',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                {taskMeta[2]}
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      flex: 'none',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: s.done ? 'var(--green)' : 'var(--surfh)',
                      color: '#fff',
                      fontSize: 9,
                    }}
                  >
                    {s.done ? '✓' : ''}
                  </span>
                  <span style={{ font: '500 12px var(--f)', color: s.done ? 'var(--text)' : 'var(--text3)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid var(--borderl)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: 11,
                    color: 'var(--text2)',
                    background: 'var(--surf)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '3px 9px',
                  }}
                >
                  +142 −8 · 3 files
                </span>
                <span style={{ font: '500 11px var(--f)', color: 'var(--text3)' }}>
                  isolated git worktree · 4/4 tests pass
                </span>
              </div>
              {taskState === 'awaiting' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button
                    onClick={approve}
                    style={{
                      flex: 1,
                      background: 'var(--accent)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 9,
                      padding: 10,
                      font: '600 12.5px var(--f)',
                      cursor: 'pointer',
                    }}
                  >
                    Approve &amp; deploy
                  </button>
                  <button
                    onClick={reject}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--border)',
                      color: 'var(--text2)',
                      borderRadius: 9,
                      padding: '10px 16px',
                      font: '600 12.5px var(--f)',
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Composer */}
        <div style={{ padding: '16px 30px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0 6px 0 14px',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about the data, run a job, or request a build / fix…"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text)',
                font: '500 13.5px var(--f)',
                padding: '14px 0',
              }}
            />
            <button
              onClick={() => void send()}
              disabled={sending}
              style={{
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                borderRadius: 9,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: sending ? 'default' : 'pointer',
                margin: '5px 0',
                opacity: sending ? 0.6 : 1,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right rail — changelog */}
      <aside
        style={{
          width: 300,
          flex: 'none',
          borderLeft: '1px solid var(--border)',
          background: '#fff',
          padding: 20,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            font: '700 10px var(--f)',
            letterSpacing: '.1em',
            color: 'var(--text3)',
            marginBottom: 14,
          }}
        >
          CHANGELOG — WHAT SHIPPED
        </div>
        {changelog.map((c, i) => {
          const tone: [string, string] =
            c.tag === 'deployed' ? ['var(--greenl)', 'var(--green)'] : ['var(--accentl)', 'var(--accentd)'];
          return (
            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--borderl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--text3)' }}>{c.day}</span>
                <span
                  style={{
                    background: tone[0],
                    color: tone[1],
                    font: '700 9px var(--f)',
                    letterSpacing: '.05em',
                    padding: '2px 7px',
                    borderRadius: 5,
                    textTransform: 'uppercase',
                  }}
                >
                  {c.tag}
                </span>
              </div>
              <div style={{ font: '500 12.5px/1.5 var(--f)', color: 'var(--text)' }}>{c.text}</div>
            </div>
          );
        })}
      </aside>
    </div>
  );
}
