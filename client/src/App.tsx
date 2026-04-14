import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoomPhotos from "./pages/AdminRoomPhotos";
import BlockedDates from "./pages/BlockedDates";
import AuditLogs from "./pages/AuditLogs";
import AccessControl from "./pages/AccessControl";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reservar" component={Booking} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/fotos" component={AdminRoomPhotos} />
      <Route path="/admin/bloqueios" component={BlockedDates} />
      <Route path="/admin/logs" component={AuditLogs} />
      <Route path="/admin/acesso" component={AccessControl} />
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
