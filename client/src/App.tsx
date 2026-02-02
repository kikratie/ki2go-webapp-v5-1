import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminCategories from "./pages/AdminCategories";
import AdminBusinessAreas from "./pages/AdminBusinessAreas";
import AdminTemplates from "./pages/AdminTemplates";
import AdminGenerator from "./pages/AdminGenerator";
import AdminMetaprompts from "./pages/AdminMetaprompts";
import AdminRequests from "./pages/AdminRequests";
import AdminOrganizations from "./pages/AdminOrganizations";
import AdminUsers from "./pages/AdminUsers";
import AdminProcessLog from "./pages/AdminProcessLog";
import AdminCostAnalytics from "./pages/AdminCostAnalytics";
import AdminRealtimeDashboard from "./pages/AdminRealtimeDashboard";
import AdminDocuments from "./pages/AdminDocuments";
import AdminCustomTemplates from "./pages/AdminCustomTemplates";
import AdminErgebnisse from "./pages/AdminErgebnisse";
import AdminChangeRequests from "./pages/AdminChangeRequests";
import Tasks from "./pages/Tasks";
import TaskExecution from "./pages/TaskExecution";
import TaskPreview from "./pages/TaskPreview";
import TaskResult from "./pages/TaskResult";
import Onboarding from "./pages/Onboarding";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyUsers from "./pages/CompanyUsers";
import CompanyStats from "./pages/CompanyStats";
import Invitation from "./pages/Invitation";
import CompleteProfile from "./pages/CompleteProfile";
import AGB from "./pages/AGB";
import Datenschutz from "./pages/Datenschutz";
import Impressum from "./pages/Impressum";
import Kontakt from "./pages/Kontakt";
import MeineDokumente from "./pages/MeineDokumente";
import Verlauf from "./pages/Verlauf";
import MeineTemplates from "./pages/MeineTemplates";
import CookieBanner from "./components/CookieBanner";
import FirmaDashboard from "./pages/FirmaDashboard";
import OwnerKosten from "./pages/OwnerKosten";
import AdminKunden from "./pages/AdminKunden";
import AdminKundenDetail from "./pages/AdminKundenDetail";
import AdminPakete from "./pages/AdminPakete";
import MeinAbo from "./pages/MeinAbo";
import AdminTestraum from "./pages/AdminTestraum";
import CompanySettings from "./pages/CompanySettings";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/agb" component={AGB} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/kontakt" component={Kontakt} />
      
      {/* Authenticated Routes */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Aufgaben Routes */}
      <Route path="/aufgaben" component={Tasks} />
      <Route path="/aufgabe/:slug/vorschau" component={TaskPreview} />
      <Route path="/aufgabe/:slug" component={TaskExecution} />
      <Route path="/ergebnis/:id" component={TaskResult} />
      
      {/* Onboarding & Firmen-Verwaltung */}
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/firma/dashboard" component={CompanyDashboard} />
      <Route path="/firma/nutzung" component={FirmaDashboard} />
      <Route path="/firma/users" component={CompanyUsers} />
      <Route path="/firma/stats" component={CompanyStats} />
      <Route path="/firma/settings" component={CompanySettings} />
      <Route path="/einladung/:code" component={Invitation} />
      
      {/* User Routes */}
      <Route path="/meine-dokumente" component={MeineDokumente} />
      <Route path="/meine-templates" component={MeineTemplates} />
      <Route path="/mein-abo" component={MeinAbo} />
      <Route path="/verlauf" component={Verlauf} />
      <Route path="/profile" component={Profile} />
      
      {/* Legacy Routes - Redirect zu neuen Pfaden */}
      <Route path="/workflow" component={Tasks} />
      <Route path="/curated" component={Tasks} />
      <Route path="/curated/:slug" component={TaskExecution} />
      <Route path="/history" component={Dashboard} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/business-areas" component={AdminBusinessAreas} />
      <Route path="/admin/templates" component={AdminTemplates} />
      <Route path="/admin/generator" component={AdminGenerator} />
      <Route path="/admin/metaprompts" component={AdminMetaprompts} />
      <Route path="/admin/anfragen" component={AdminRequests} />
      
      {/* Owner Audit & Analytics Routes */}
      <Route path="/admin/organizations">{() => { window.location.href = '/admin/kunden'; return null; }}</Route>
      <Route path="/admin/all-users" component={AdminUsers} />
      <Route path="/admin/process-log" component={AdminProcessLog} />
      <Route path="/admin/cost-analytics" component={AdminCostAnalytics} />
      <Route path="/admin/realtime" component={AdminRealtimeDashboard} />
      <Route path="/admin/documents" component={AdminDocuments} />
      <Route path="/admin/custom-templates" component={AdminCustomTemplates} />
      <Route path="/admin/ergebnisse" component={AdminErgebnisse} />
      <Route path="/admin/change-requests" component={AdminChangeRequests} />
      <Route path="/admin/manus-kosten" component={OwnerKosten} />
      <Route path="/admin/kunden" component={AdminKunden} />
      <Route path="/admin/kunden/:id" component={AdminKundenDetail} />
      <Route path="/admin/pakete" component={AdminPakete} />
      <Route path="/admin/testraum" component={AdminTestraum} />
      
      <Route path="/admin/settings" component={Admin} />
      
      {/* Error Routes */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
