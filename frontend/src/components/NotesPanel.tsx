import { useState, type FormEvent } from 'react'
import { useNotesQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } from '../hooks/useNotes'

interface Props {
  jobId: string
  defaultOpen?: boolean
}

export default function NotesPanel({ jobId, defaultOpen = false }: Props) {
  const { data: notes = [], isLoading } = useNotesQuery(jobId)
  const createMutation = useCreateNoteMutation(jobId)
  const updateMutation = useUpdateNoteMutation(jobId)
  const deleteMutation = useDeleteNoteMutation(jobId)

  const [open, setOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    await createMutation.mutateAsync(draft.trim())
    setDraft('')
  }

  function startEdit(id: string, content: string) {
    setEditingId(id)
    setEditContent(content)
  }

  async function handleUpdate(id: string) {
    if (!editContent.trim()) return
    await updateMutation.mutateAsync({ id, content: editContent.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>{notes.length === 0 ? 'Add note' : `${notes.length} note${notes.length > 1 ? 's' : ''}`}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
          {isLoading && <p className="text-xs text-gray-400">Loading…</p>}

          {notes.map(note => (
            <div key={note._id} className="flex items-start gap-2">
              {editingId === note._id ? (
                <>
                  <textarea
                    className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      onClick={() => handleUpdate(note._id!)}
                      disabled={updateMutation.isPending}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex-1 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                    <button
                      onClick={() => startEdit(note._id!, note.content)}
                      className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note._id!)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      Del
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <form onSubmit={handleAdd} className="flex gap-2 pt-1">
            <input
              className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Add a note…"
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !draft.trim()}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
