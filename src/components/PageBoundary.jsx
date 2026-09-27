import { Component } from 'react'

export default class PageBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <div role="alert" className="min-h-[70vh] flex items-center justify-center p-6 bg-[#e4f2ef]">
      <div className="glass-panel max-w-md p-6 space-y-4">
        <h1 className="text-xl font-bold">We couldn’t open this page</h1>
        <p>Check your connection and reload. A recent app update may require a refresh.</p>
        <p className="text-sm text-slate-600">If you were submitting a booking or payment, check its status before submitting it again.</p>
        <button className="btn btn-primary" onClick={()=>window.location.reload()}>Reload page</button>
      </div>
    </div>
  }
}
