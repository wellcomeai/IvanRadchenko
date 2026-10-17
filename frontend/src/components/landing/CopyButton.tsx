"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Скопировать" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // буфер обмена недоступен (http, старый браузер) — просто ничего не делаем
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      className="inline-flex flex-none items-center gap-1.5 rounded-full px-4 h-10 text-[13px] font-semibold text-white transition-colors"
      style={{ background: copied ? "var(--lx-sage)" : "var(--lx-ink)" }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Скопировано" : label}
    </button>
  );
}

/** Строка с промптом, который человек копирует в своего агента. */
export function PromptLine({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-full bg-white pl-5 pr-1.5 py-1.5 border border-[var(--lx-line-2)]" style={{ boxShadow: "var(--lx-shadow)" }}>
      <code className="lx-mono text-[13.5px] text-[var(--lx-ink)] truncate">
        <span className="text-[var(--lx-clay)] mr-2">&gt;</span>
        {text}
      </code>
      <CopyButton text={text} />
    </div>
  );
}
