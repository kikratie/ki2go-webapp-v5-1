import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Tags, 
  Building2, 
  FileText, 
  Users, 
  Settings,
  Plus,
  ArrowRight,
  Activity,
  Wand2,
  Sparkles,
  Inbox,
  DollarSign,
  BarChart3,
  ClipboardList,
  Zap,
  Factory,
  ShieldCheck,
  FolderOpen,
  UserCog,
  Building,
  FileSearch,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  TrendingUp,
  Eye
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// Status-Badge für Aktivitäten
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
    completed: { label: "Abgeschlossen", variant: "default", icon: CheckCircle2 },
    failed: { label: "Fehlgeschlagen", variant: "destructive", icon: XCircle },
    running: { label: "Läuft", variant: "secondary", icon: PlayCircle },
    pending: { label: "Wartend", variant: "outline", icon: Clock },
  };
  const { label, variant, icon: Icon } = config[status] || config.pending;
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// Zeitformat
function formatTimeAgo(date: Date | string | null) {
  if (!date) return "-";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return then.toLocaleDateString("de-DE");
}

export default function Admin() {
  const { user, loading } = useAuth();
  const { data: categories } = trpc.category.list.useQuery();
  const { data: businessAreas } = trpc.businessArea.list.useQuery();
  const { data: requestStats } = trpc.taskRequest.getStats.useQuery();
  
  // Neue Daten für Übersicht
  const { data: userList, isLoading: usersLoading } = trpc.user.list.useQuery({ limit: 10 });
  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery({ limit: 10 });
  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Prüfe Admin-Berechtigung
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Zugriff verweigert</h2>
          <p className="text-muted-foreground">Sie benötigen Admin-Rechte für diesen Bereich.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.role === 'owner';

  // KUNDEN - Firmen & User verwalten (nur Owner)
  const kundenCards = [
    {
      title: "Firmen-Übersicht",
      description: "Organisationen anlegen, bearbeiten, Subscriptions verwalten",
      icon: Building,
      href: "/admin/organizations",
      color: "bg-indigo-500/10 text-indigo-500",
      badge: null,
    },
    {
      title: "User-Übersicht",
      description: "Alle User bearbeiten, Rollen ändern, Organisationen zuweisen",
      icon: UserCog,
      href: "/admin/all-users",
      color: "bg-pink-500/10 text-pink-500",
      badge: null,
    },
  ];

  // PRODUKTION - Templates & Prompts verwalten
  const produktionCards = [
    {
      title: "Kategorien",
      description: "Aufgaben-Kategorien verwalten",
      icon: Tags,
      href: "/admin/categories",
      count: categories?.length || 0,
      color: "bg-ki2go-turquoise/10 text-ki2go-turquoise",
    },
    {
      title: "Unternehmensbereiche",
      description: "Geschäftsbereiche verwalten",
      icon: Building2,
      href: "/admin/business-areas",
      count: businessAreas?.length || 0,
      color: "bg-ki2go-orange/10 text-ki2go-orange",
    },
    {
      title: "Owner-Templates",
      description: "Know-How-Bibliothek verwalten (OT-Nummern)",
      icon: FileText,
      href: "/admin/templates",
      color: "bg-ki2go-navy/10 text-ki2go-navy",
    },
    {
      title: "Superprompt-Generator",
      description: "KI-gestützte Prompt-Erstellung",
      icon: Wand2,
      href: "/admin/generator",
      color: "bg-gradient-to-r from-ki2go-turquoise/20 to-ki2go-orange/20 text-ki2go-navy",
    },
    {
      title: "Metaprompts",
      description: "Metaprompt-Templates verwalten",
      icon: Sparkles,
      href: "/admin/metaprompts",
      color: "bg-violet-500/10 text-violet-500",
    },
    {
      title: "Custom Templates",
      description: "User- & Firmen-spezifische Superprompts",
      icon: FileSearch,
      href: "/admin/custom-templates",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Anfragen",
      description: "Individuelle Kundenanfragen verwalten",
      icon: Inbox,
      href: "/admin/anfragen",
      count: requestStats?.new || 0,
      color: "bg-blue-500/10 text-blue-500",
      badge: requestStats?.new ? `${requestStats.new} neu` : undefined,
    },
  ];

  // QUALITÄT - Audit & Monitoring (nur Owner)
  const qualitaetCards = [
    {
      title: "Ergebnis-Übersicht",
      description: "Alle Ergebnisse prüfen mit Dokument-Vergleich",
      icon: Eye,
      href: "/admin/ergebnisse",
      color: "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-600",
      badge: "Qualitätssicherung",
    },
    {
      title: "Echtzeit-Dashboard",
      description: "Live-Übersicht aller Aktivitäten",
      icon: Zap,
      href: "/admin/realtime",
      color: "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600",
    },
    {
      title: "Prozess-Protokoll",
      description: "Alle Aufgaben mit Prozess-ID, Kosten & Status",
      icon: ClipboardList,
      href: "/admin/process-log",
      color: "bg-cyan-500/10 text-cyan-500",
    },
    {
      title: "Kosten-Analytics",
      description: "Detaillierte Kostenauswertung nach Firma, Template, Zeit",
      icon: DollarSign,
      href: "/admin/cost-analytics",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      title: "Dokument-Übersicht",
      description: "Alle hochgeladenen Dokumente mit Nutzungshistorie",
      icon: FolderOpen,
      href: "/admin/documents",
      color: "bg-amber-500/10 text-amber-500",
    },
  ];

  // EINSTELLUNGEN
  const einstellungenCards = [
    {
      title: "Benutzer-Verwaltung",
      description: "Benutzer und Rollen verwalten",
      icon: Users,
      href: "/admin/users",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "System-Einstellungen",
      description: "Globale Einstellungen",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500/10 text-gray-500",
    },
    {
      title: "Aktivitäts-Log",
      description: "Admin-Aktionen einsehen",
      icon: Activity,
      href: "/admin/logs",
      color: "bg-green-500/10 text-green-500",
    },
  ];

  const renderCardGrid = (cards: Array<{
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: string;
    count?: number;
    badge?: string | null;
  }>) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
          <Card className="cursor-pointer hover:shadow-md transition-all hover:border-ki2go-turquoise/50 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  {card.badge && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                      {card.badge}
                    </span>
                  )}
                  {card.count !== undefined && card.count !== null && (
                    <span className="text-2xl font-bold text-ki2go-navy">{card.count}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
              <div className="flex items-center text-ki2go-turquoise text-sm mt-3 font-medium">
                Öffnen <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ki2go-navy">Admin-Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Zentrale Verwaltung für Kunden, Produktion und Qualitätskontrolle
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-ki2go-orange/10 text-ki2go-orange text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-ki2go-orange animate-pulse"></span>
            {user.role === 'owner' ? 'Owner' : 'Admin'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-ki2go-turquoise/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Benutzer</p>
                  <p className="text-3xl font-bold text-ki2go-navy">
                    {usersLoading ? <Skeleton className="h-9 w-12" /> : userList?.pagination?.total || userList?.users?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-ki2go-turquoise/10">
                  <Users className="h-6 w-6 text-ki2go-turquoise" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-ki2go-orange/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aufgaben heute</p>
                  <p className="text-3xl font-bold text-ki2go-navy">
                    {statsLoading ? <Skeleton className="h-9 w-12" /> : dashboardStats?.tasksToday || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-ki2go-orange/10">
                  <Activity className="h-6 w-6 text-ki2go-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ergebnisse</p>
                  <p className="text-3xl font-bold text-ki2go-navy">
                    {statsLoading ? <Skeleton className="h-9 w-12" /> : dashboardStats?.savedResults || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Neue Anfragen</p>
                  <p className="text-3xl font-bold text-ki2go-navy">{requestStats?.new || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Inbox className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Zeit gespart</p>
                    <p className="text-3xl font-bold text-ki2go-navy">
                      {statsLoading ? <Skeleton className="h-9 w-12" /> : dashboardStats?.timeSaved || "0h"}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Benutzer-Übersicht und Aktivitäten (nur Owner) */}
        {isOwner && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Letzte Benutzer */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-ki2go-turquoise" />
                    Neueste Benutzer
                  </CardTitle>
                  <CardDescription>Zuletzt registrierte Benutzer</CardDescription>
                </div>
                <Link href="/admin/all-users">
                  <Button variant="outline" size="sm">
                    Alle anzeigen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userList?.users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Benutzer registriert</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userList?.users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ki2go-turquoise to-ki2go-orange flex items-center justify-center text-white font-medium">
                          {u.name?.charAt(0) || u.email?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.name || "Unbekannt"}</p>
                          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={u.role === "owner" ? "default" : u.role === "admin" ? "secondary" : "outline"}>
                            {u.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {u.companyName || "Privat"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Letzte Aktivitäten */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-ki2go-orange" />
                    Letzte Aktivitäten
                  </CardTitle>
                  <CardDescription>Kürzlich ausgeführte Aufgaben</CardDescription>
                </div>
                <Link href="/admin/process-log">
                  <Button variant="outline" size="sm">
                    Alle anzeigen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : recentActivity?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Noch keine Aktivitäten</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity?.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{activity.template?.title || "Unbekannte Aufgabe"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={activity.status || "pending"} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs für verschiedene Bereiche */}
        <Tabs defaultValue={isOwner ? "kunden" : "produktion"} className="w-full">
          <div className="border-b mb-6">
            <TabsList className="flex h-12 items-center gap-0 bg-muted/30 p-1 rounded-lg w-full max-w-2xl">
              {isOwner && (
                <TabsTrigger 
                  value="kunden" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Users className="h-4 w-4" />
                  Kunden
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="produktion" 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Factory className="h-4 w-4" />
                Produktion
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger 
                  value="qualitaet" 
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <BarChart3 className="h-4 w-4" />
                  Qualität
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="einstellungen" 
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </TabsTrigger>
            </TabsList>
          </div>

          {/* KUNDEN Tab (nur Owner) */}
          {isOwner && (
            <TabsContent value="kunden" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-ki2go-navy flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Kunden-Verwaltung
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Firmen anlegen, User bearbeiten, Subscriptions verwalten
                </p>
              </div>
              {renderCardGrid(kundenCards)}
              
              {/* Schnellaktionen für Kunden */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-ki2go-turquoise" />
                    Schnellaktionen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/admin/organizations">
                      <Button variant="outline" className="border-indigo-500 text-indigo-500 hover:bg-indigo-500/10">
                        <Plus className="h-4 w-4 mr-2" />
                        Neue Firma anlegen
                      </Button>
                    </Link>
                    <Link href="/admin/all-users">
                      <Button variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-500/10">
                        <UserCog className="h-4 w-4 mr-2" />
                        User bearbeiten
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* PRODUKTION Tab */}
          <TabsContent value="produktion" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-ki2go-navy flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Produktion & Templates
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Kategorien, Bereiche, Superprompts und Metaprompts verwalten
              </p>
            </div>
            {renderCardGrid(produktionCards)}
            
            {/* Schnellaktionen für Produktion */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-ki2go-turquoise" />
                  Schnellaktionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href="/admin/categories">
                    <Button variant="outline" className="border-ki2go-turquoise text-ki2go-turquoise hover:bg-ki2go-turquoise/10">
                      <Plus className="h-4 w-4 mr-2" />
                      Neue Kategorie
                    </Button>
                  </Link>
                  <Link href="/admin/business-areas">
                    <Button variant="outline" className="border-ki2go-orange text-ki2go-orange hover:bg-ki2go-orange/10">
                      <Plus className="h-4 w-4 mr-2" />
                      Neuer Bereich
                    </Button>
                  </Link>
                  <Link href="/admin/generator">
                    <Button className="bg-gradient-to-r from-ki2go-turquoise to-ki2go-orange text-white hover:opacity-90">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Superprompt generieren
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUALITÄT Tab (nur Owner) */}
          {isOwner && (
            <TabsContent value="qualitaet" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-ki2go-navy flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Qualität & Monitoring
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Echtzeit-Überwachung, Prozess-Protokolle und Kostenanalyse
                </p>
              </div>
              {renderCardGrid(qualitaetCards)}
            </TabsContent>
          )}

          {/* EINSTELLUNGEN Tab */}
          <TabsContent value="einstellungen" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-ki2go-navy flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Einstellungen
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Benutzer, Rollen und System-Konfiguration
              </p>
            </div>
            {renderCardGrid(einstellungenCards)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
