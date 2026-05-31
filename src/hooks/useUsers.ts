import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUsersByAdmin, updateUserById } from '../api/auth'
import type { AuthUpdateUserRequest } from '../types'

export function useUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['auth-users'],
    queryFn: listUsersByAdmin,
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AuthUpdateUserRequest }) =>
      updateUserById(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-users'] })
    },
  })
}
