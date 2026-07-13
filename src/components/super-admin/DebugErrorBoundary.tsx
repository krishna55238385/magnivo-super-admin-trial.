'use client'

import { Component, ReactNode } from 'react'

export class DebugErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[DebugErrorBoundary] caught error:', error)
    console.error('[DebugErrorBoundary] error.stack:', error.stack)
    console.error('[DebugErrorBoundary] componentStack:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#f87171', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <p>Render error caught — see console for componentStack.</p>
          <p>{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
