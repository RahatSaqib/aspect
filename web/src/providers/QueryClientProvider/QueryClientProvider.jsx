import React from 'react'
import { QueryClient, QueryClientProvider as RQClientProvider } from 'react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      /**
       * set staleTime from default 0 milliseconds to 4 hours
       * TODO: Discuss in a team if it makes sense to put this in env file
       * to configure staleTime per customer basis
       */
      staleTime: 1000 /* ms */ * 60 /* secs */ * 60 /* mins */ * 4 /* hours */,
    },
  },
})

export default function QueryClientProvider({ children }) {
  return <RQClientProvider client={queryClient}>{children}</RQClientProvider>
}
