import React from 'react'
import { QueryClient, QueryClientProvider as RQClientProvider } from 'react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export default function QueryClientProvider({ children }) {
  return <RQClientProvider client={queryClient}>{children}</RQClientProvider>
}
