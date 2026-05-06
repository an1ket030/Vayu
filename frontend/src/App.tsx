import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import HotspotMap from './pages/HotspotMap';
import RouteFinder from './pages/RouteFinder';
import ExposureTracker from './pages/ExposureTracker';
import Forecast from './pages/Forecast';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import { useAuthStore } from './store/useAuthStore';

// ─── Global Error Boundary ────────────────────────────────────────────────────
// Catches any uncaught React render error to prevent blank-screen crashes.
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
          <div className="max-w-md w-full border border-destructive/30 bg-destructive/5 rounded-2xl p-8 text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-sm text-muted-foreground font-mono break-all">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Protected Route ──────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  element: React.ReactElement;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const ProtectedRoute = ({ element, isAuthenticated, isLoading }: ProtectedRouteProps) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  return isAuthenticated ? element : <Navigate to="/auth" replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Auth page — full screen, no sidebar */}
          <Route path="/auth" element={<Auth />} />

          {/* Main app shell */}
          <Route
            path="/*"
            element={
              <div className="flex h-screen bg-background text-foreground overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto p-6">
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/map" element={<HotspotMap />} />
                        <Route path="/route" element={<RouteFinder />} />
                        <Route path="/forecast" element={<Forecast />} />
                        <Route
                          path="/exposure"
                          element={
                            <ProtectedRoute
                              element={<ExposureTracker />}
                              isAuthenticated={isAuthenticated}
                              isLoading={isLoading}
                            />
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute
                              element={<Profile />}
                              isAuthenticated={isAuthenticated}
                              isLoading={isLoading}
                            />
                          }
                        />
                      </Routes>
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
