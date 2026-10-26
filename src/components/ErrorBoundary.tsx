import { Component, type ReactNode } from 'react'

interface State {
  failed: boolean
}

// Last line of defence: a render error shows a recovery card instead of a blank page.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="page" style={{ maxWidth: 560, margin: '80px auto' }}>
        <div className="card empty">
          <h2>Something went wrong</h2>
          <p>The demo hit an unexpected problem. All data is local and nothing was lost.</p>
          <button className="btn primary" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </div>
      </div>
    )
  }
}
