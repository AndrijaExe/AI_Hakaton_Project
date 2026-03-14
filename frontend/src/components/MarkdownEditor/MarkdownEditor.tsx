import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Type } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before
): { newValue: string; cursorPos: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end);

  if (!selected) {
    const pos = start;
    const newValue = text.slice(0, pos) + before + after + text.slice(pos);
    return { newValue, cursorPos: pos + before.length };
  }

  const newValue = text.slice(0, start) + before + selected + after + text.slice(end);
  return { newValue, cursorPos: start + before.length + selected.length + after.length };
}

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = '120px', className = '' }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    const pos = pendingCursorRef.current;
    if (ta && pos !== null) {
      pendingCursorRef.current = null;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }
  }, [value]);

  const applyFormat = useCallback(
    (before: string, after?: string) => {
      const ta = textareaRef.current;
      if (!ta) return;

      ta.focus();
      const { newValue, cursorPos } = wrapSelection(ta, before, after ?? before);
      pendingCursorRef.current = cursorPos;
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <div className={`border border-slate-600 rounded-xl overflow-hidden bg-slate-800 ${className}`}>
      <div className="flex items-center gap-0.5 p-1.5 border-b border-slate-700 bg-slate-800/80">
        <button
          type="button"
          onClick={() => applyFormat('**')}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400"
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('*')}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400"
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('\n## ', '')}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400"
          title="Heading"
        >
          <Type size={18} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 text-sm resize-y focus:outline-none focus:ring-0 bg-slate-800 text-slate-100 placeholder:text-slate-500"
        style={{ minHeight }}
      />
    </div>
  );
}
