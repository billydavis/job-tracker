import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createNote, deleteNote, getNotes, updateNote } from '../api/client'
import type { Note } from '../types'

export const notesQueryKey = (jobId: string) => ['notes', jobId] as const

export function useNotesQuery(jobId: string) {
  return useQuery<Note[]>({
    queryKey: notesQueryKey(jobId),
    queryFn: () => getNotes(jobId),
    enabled: Boolean(jobId),
    select: (data) => data ?? [],
  })
}

export function useCreateNoteMutation(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation<Note, Error, string>({
    mutationFn: (content) => createNote({ jobId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey(jobId) })
    },
  })
}

export function useUpdateNoteMutation(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation<Note, Error, { id: string; content: string }>({
    mutationFn: ({ id, content }) => updateNote(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey(jobId) })
    },
  })
}

export function useDeleteNoteMutation(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey(jobId) })
    },
  })
}
