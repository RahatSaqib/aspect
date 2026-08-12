import React from 'react'
import { QueryClient, QueryClientProvider as RQClientProvider } from 'react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const statusCode = error?.statusCode

        // 4xx responses are deterministic client/request errors, so fail fast.
        if (statusCode >= 400 && statusCode < 500) {
          return false
        }

        // Preserve react-query default retry count for transient failures.
        return failureCount < 3
      },
    },
  },
})

export default function QueryClientProvider({ children }) {
  return <RQClientProvider client={queryClient}>{children}</RQClientProvider>
}
