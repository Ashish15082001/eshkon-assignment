'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive">
          <p className="font-semibold">Something went wrong rendering this section.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-xs overflow-auto">{this.state.error?.message}</pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
