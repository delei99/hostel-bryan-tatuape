import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import RoomGallery from "./pages/RoomGallery";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoomPhotos from "./pages/AdminRoomPhotos";
import AdminRooms from "./pages/AdminRooms";
import PhotoUpload from "./pages/admin/PhotoUpload";
import BlockedDates from "./pages/BlockedDates";
// import AuditLogs from "./pages/AuditLogs";
// import AccessControl from "./pages/AccessControl";
// import SecurityAlerts from "./pages/SecurityAlerts";
import RoomPhotosUpload from "./pages/RoomPhotosUpload";
import BlockingExceptions from "./pages/BlockingExceptions";
import EditBooking from "./pages/EditBooking";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reservar" component={Booking} />
      <Route path="/galeria" component={RoomGallery} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/quartos" component={AdminRooms} />
      <Route path="/admin/fotos" component={AdminRoomPhotos} />
      <Route path="/admin/fotos/upload" component={PhotoUpload} />
      <Route path="/admin/bloqueios" component={BlockedDates} />
      <Route path="/admin/fotos-upload" component={RoomPhotosUpload} />
      <Route path="/admin/excecoes" component={BlockingExceptions} />
      <Route path="/edit-booking" component={EditBooking} />
      {/* <Route path="/admin/logs" component={AuditLogs} />
      <Route path="/admin/acesso" component={AccessControl} />
      <Route path="/admin/alertas" component={SecurityAlerts} /> */}
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
