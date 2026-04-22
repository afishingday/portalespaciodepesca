import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import YoutubeExtension from '@tiptap/extension-youtube'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Table as TableIcon,
  Trash2,
  ListVideo,
  Undo2,
  Redo2,
  Minus,
} from 'lucide-react'
import './richText.css'

function toolbarButton(active, onClick, title, children, disabled) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 text-sm font-bold transition-colors disabled:opacity-40 ${
        active ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  initialHtml,
  onChange,
  placeholder = 'Redacta el contenido…',
  disabled = false,
  className = '',
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'text-blue-700 underline font-semibold' },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      YoutubeExtension.configure({
        width: 640,
        height: 360,
        nocookie: true,
        HTMLAttributes: { class: 'rounded-xl border border-zinc-200' },
      }),
    ],
    content: initialHtml?.trim() ? initialHtml : '<p></p>',
    editorProps: {
      attributes: {
        class: 'portal-rich-html max-w-none min-h-[280px] px-3 py-2 md:px-4 md:py-3',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) {
    return (
      <div className={`rounded-xl border border-zinc-200 bg-zinc-50 min-h-[300px] animate-pulse ${className}`.trim()} />
    )
  }

  const run = (fn) => {
    if (disabled) return
    fn()
  }

  return (
    <div className={`rich-text-editor rounded-xl border border-zinc-200 bg-white overflow-hidden ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/90 px-2 py-2">
        {toolbarButton(editor.isActive('bold'), () => run(() => editor.chain().focus().toggleBold().run()), 'Negrita', <Bold className="h-4 w-4" />, disabled)}
        {toolbarButton(editor.isActive('italic'), () => run(() => editor.chain().focus().toggleItalic().run()), 'Cursiva', <Italic className="h-4 w-4" />, disabled)}
        {toolbarButton(editor.isActive('underline'), () => run(() => editor.chain().focus().toggleUnderline().run()), 'Subrayado', <UnderlineIcon className="h-4 w-4" />, disabled)}
        <span className="mx-1 h-6 w-px bg-zinc-300 shrink-0" aria-hidden />
        {toolbarButton(editor.isActive('heading', { level: 1 }), () => run(() => editor.chain().focus().toggleHeading({ level: 1 }).run()), 'Título principal', <Heading1 className="h-4 w-4" />, disabled)}
        {toolbarButton(editor.isActive('heading', { level: 2 }), () => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run()), 'Título de sección', <Heading2 className="h-4 w-4" />, disabled)}
        {toolbarButton(editor.isActive('heading', { level: 3 }), () => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run()), 'Subtítulo', <Heading3 className="h-4 w-4" />, disabled)}
        <span className="mx-1 h-6 w-px bg-zinc-300 shrink-0" aria-hidden />
        {toolbarButton(editor.isActive('bulletList'), () => run(() => editor.chain().focus().toggleBulletList().run()), 'Lista con viñetas', <List className="h-4 w-4" />, disabled)}
        {toolbarButton(editor.isActive('orderedList'), () => run(() => editor.chain().focus().toggleOrderedList().run()), 'Lista numerada', <ListOrdered className="h-4 w-4" />, disabled)}
        <span className="mx-1 h-6 w-px bg-zinc-300 shrink-0" aria-hidden />
        {toolbarButton(false, () => {
          if (disabled) return
          const prev = editor.getAttributes('link').href
          const url = window.prompt('URL del enlace (https://…)', prev || 'https://')
          if (url === null) return
          const t = url.trim()
          if (t === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: t }).run()
        }, 'Enlace', <Link2 className="h-4 w-4" />, disabled)}
        {toolbarButton(false, () => run(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()), 'Insertar tabla 3×3', <TableIcon className="h-4 w-4" />, disabled)}
        {toolbarButton(false, () => run(() => editor.chain().focus().deleteTable().run()), 'Eliminar tabla', <Trash2 className="h-4 w-4 text-red-600" />, disabled || !editor.can().deleteTable())}
        {toolbarButton(false, () => run(() => editor.chain().focus().addRowAfter().run()), 'Fila debajo', <span className="text-xs font-black px-0.5">+⌄</span>, disabled || !editor.can().addRowAfter())}
        {toolbarButton(false, () => run(() => editor.chain().focus().addColumnAfter().run()), 'Columna a la derecha', <span className="text-xs font-black px-0.5">+→</span>, disabled || !editor.can().addColumnAfter())}
        <span className="mx-1 h-6 w-px bg-zinc-300 shrink-0" aria-hidden />
        {toolbarButton(false, () => {
          if (disabled) return
          const raw = window.prompt('Pega la URL del video de YouTube:', 'https://www.youtube.com/watch?v=')
          if (raw == null || !raw.trim()) return
          const ok = editor.chain().focus().setYoutubeVideo({ src: raw.trim() }).run()
          if (!ok) window.alert('No se reconoció como URL de YouTube válida.')
        }, 'Insertar YouTube', <ListVideo className="h-4 w-4" />, disabled)}
        {toolbarButton(false, () => run(() => editor.chain().focus().setHorizontalRule().run()), 'Línea horizontal', <Minus className="h-4 w-4" />, disabled)}
        <span className="mx-1 h-6 w-px bg-zinc-300 shrink-0" aria-hidden />
        {toolbarButton(false, () => run(() => editor.chain().focus().undo().run()), 'Deshacer', <Undo2 className="h-4 w-4" />, disabled || !editor.can().undo())}
        {toolbarButton(false, () => run(() => editor.chain().focus().redo().run()), 'Rehacer', <Redo2 className="h-4 w-4" />, disabled || !editor.can().redo())}
      </div>
      <EditorContent editor={editor} className="rich-text-editor-surface" />
    </div>
  )
}
