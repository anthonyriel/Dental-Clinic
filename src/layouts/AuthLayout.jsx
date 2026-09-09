import { Outlet } from 'react-router-dom'
import Brand from '../components/Brand'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white" href="#main-content">Skip to content</a>
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 flex items-center justify-center">
          <Brand />
        </div>
      </header>
      <main id="main-content" className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
