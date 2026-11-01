import useSWR from "swr";
import { getUsers } from "@/services/userService.ts";

export const USERS_KEY = "users";

export function useUsers() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    USERS_KEY,
    getUsers,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      errorRetryCount: 2,
    },
  );

  return {
    users: data,
    error: error as Error | undefined,
    isLoading,
    isValidating,
    retry: () => mutate(),
  };
}
