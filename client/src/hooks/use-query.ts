import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export const useApiQuery = (queryKey, queryFn, options = {}) => {
  const { isAuthenticated } = useContext(AuthContext);

  return useQuery({
    queryKey,
    queryFn,
    ...options,
    enabled: isAuthenticated && (options.enabled ?? true),
  });
};

export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (...args) => {
      if (options.onSuccess) {
        options.onSuccess(...args);
      }
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries(key);
        });
      }
    },
  });
};
