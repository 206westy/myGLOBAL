'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: Record<string, unknown> | null;
  onUpdate: (json: Record<string, unknown>) => void;
  placeholder?: string;
  editable?: boolean;
}

export function TiptapEditor({ content, onUpdate, placeholder, editable = true }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요...' }),
    ],
    content: content ?? undefined,
    immediatelyRender: false,
    editable,
    onUpdate: ({ editor: ed }) => {
      onUpdate(ed.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) {
    return <div className="h-32 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="rounded-lg border border-outline-variant/30 bg-card">
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-outline-variant/20 px-2 py-1.5">
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            label="제목"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="굵게"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="기울임"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 h-5 w-px bg-outline-variant/30" />
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="글머리 목록"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="번호 목록"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 h-5 w-px bg-outline-variant/30" />
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().undo().run()}
            label="되돌리기"
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().redo().run()}
            label="다시 실행"
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      <div className="tiptap-content px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  );
}
