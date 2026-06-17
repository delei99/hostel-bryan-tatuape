import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import RoomGallery from "./pages/RoomGallery";
import EditBooking from "./pages/EditBooking";

// Lazy load admin pages to reduce initial bundle size
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminRoomPhotos = lazy(() => import("./pages/AdminRoomPhotos"));
const AdminRooms = lazy(() => import("./pages/AdminRooms"));
const PhotoUpload = lazy(() => import("./pages/admin/PhotoUpload"));
const BlockedDates = lazy(() => import("./pages/BlockedDates"));
const RoomPhotosUpload = lazy(() => import("./pages/RoomPhotosUpload"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// Wrapper component for lazy-loaded routes
function LazyRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reservar" component={Booking} />
      <Route path="/galeria" component={RoomGallery} />
      <Route path="/edit-booking" component={EditBooking} />
      
      {/* Admin routes - lazy loaded */}
      <Route path="/admin" component={() => <LazyRoute component={AdminDashboard} />} />
      <Route path="/admin/quartos" component={() => <LazyRoute component={AdminRooms} />} />
      <Route path="/admin/fotos" component={() => <LazyRoute component={AdminRoomPhotos} />} />
      <Route path="/admin/fotos/upload" component={() => <LazyRoute component={PhotoUpload} />} />
      <Route path="/admin/bloqueios" component={() => <LazyRoute component={BlockedDates} />} />
      <Route path="/admin/bloqueios-excecoes" component={() => <LazyRoute component={BlockedDates} />} />
      <Route path="/admin/fotos-upload" component={() => <LazyRoute component={RoomPhotosUpload} />} />
      
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
