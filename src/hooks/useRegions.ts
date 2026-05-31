import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRegion, deleteRegion, getRegions, updateRegion } from '../api/regions'
import type { Region } from '../types'

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  })
}

export function useCreateRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; code: string; country_codes: string[] }) =>
      createRegion(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['regions'] })
    },
  })
}

export function useUpdateRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Region> }) => updateRegion(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['regions'] })
    },
  })
}

export function useDeleteRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRegion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['regions'] })
    },
  })
}
