import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, FileText, Clock, 
  ArrowRight, Sparkles, BarChart3, CheckCircle2, Loader2, XCircle,
  ExternalLink, Zap, TrendingUp, FolderOpen, History, PlayCircle,
  FileSearch, PenTool, Settings, Star, Bookmark
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import OnboardingTour from "@/components/OnboardingTour";
import { Link } from "wouter";

// Dynamisches Icon
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <IconComponent className={className} />;
};

// Zeitformatierung
const formatTimeAgo = (date: Date | string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  return then.toLocaleDateString('de-DE');
};

// Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Fertig</Badge>;
    case "processing":
      return <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Läuft</Badge>;
    case "failed":
      return <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1"><XCircle className="h-3 w-3" /> Fehler</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const utils = trpc.useUtils();

  // Onboarding-Status prüfen
  const completeOnboardingMutation = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  // Zeige Onboarding wenn User neu ist
  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  // API-Aufrufe für echte Daten
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: activities, isLoading: activitiesLoading } = trpc.dashboard.getRecentActivity.useQuery({ limit: 5 });
  const { data: quickActions, isLoading: quickActionsLoading } = trpc.dashboard.getQuickActions.useQuery({ limit: 5 });

  // Schnellzugriff-Kacheln
  const schnellzugriffCards = [
    {
      title: "Neue Aufgabe",
      description: "KI-gestützte Aufgabe starten",
      icon: Sparkles,
      href: "/aufgaben",
      color: "bg-gradient-to-br from-[#5FBDCE]/20 to-[#1E3A5F]/10 text-[#1E3A5F]",
      action: "Starten",
      featured: true,
    },
    {
      title: "Meine Templates",
      description: "Gespeicherte Vorlagen",
      icon: Bookmark,
      href: "/meine-templates",
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Meine Dokumente",
      description: "Hochgeladene Dateien",
      icon: FolderOpen,
      href: "/meine-dokumente",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      title: "Verlauf",
      description: "Alle Aktivitäten",
      icon: History,
      href: "/verlauf",
      color: "bg-slate-500/10 text-slate-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header mit Begrüßung */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">
              Willkommen zurück, {user?.name?.split(' ')[0] || 'Benutzer'}!
            </h1>
            <p className="text-gray-500">
              Was möchten Sie heute erledigen?
            </p>
          </div>
          <Link href="/aufgaben">
            <Button className="bg-[#5FBDCE] hover:bg-[#5FBDCE]/90 gap-2">
              <Sparkles className="h-4 w-4" />
              Neue Aufgabe
            </Button>
          </Link>
        </div>

        {/* KPI-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Aufgaben heute */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#5FBDCE]/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Heute</span>
                <Target className="h-4 w-4 text-[#5FBDCE]" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1E3A5F]">{stats?.tasksToday || 0}</span>
                  <span className="text-gray-400 text-sm">Aufgaben</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gespeicherte Ergebnisse */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Ergebnisse</span>
                <FileText className="h-4 w-4 text-indigo-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1E3A5F]">{stats?.savedResults || 0}</span>
                  <span className="text-gray-400 text-sm">gespeichert</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zeit gespart */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Zeit gespart</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1E3A5F]">{stats?.timeSaved || '0m'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Effizienz */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Effizienz</span>
                <Zap className="h-4 w-4 text-orange-500" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1E3A5F]">
                    {stats?.savedResults && stats.savedResults > 0 
                      ? Math.round((stats.timeSavedMinutes || 0) / stats.savedResults) 
                      : 0}
                  </span>
                  <span className="text-gray-400 text-sm">Min./Aufgabe</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs für Schnellzugriff und Aktivitäten */}
        <Tabs defaultValue="schnellzugriff" className="space-y-4">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="schnellzugriff" className="gap-2">
              <Zap className="h-4 w-4" />
              Schnellzugriff
            </TabsTrigger>
            <TabsTrigger value="beliebte" className="gap-2">
              <Star className="h-4 w-4" />
              Beliebte Aufgaben
            </TabsTrigger>
            <TabsTrigger value="aktivitaet" className="gap-2">
              <History className="h-4 w-4" />
              Letzte Aktivitäten
            </TabsTrigger>
          </TabsList>

          {/* Schnellzugriff */}
          <TabsContent value="schnellzugriff" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {schnellzugriffCards.map((card) => (
                <Link key={card.href} href={card.href}>
                  <Card className={`cursor-pointer hover:shadow-md transition-all h-full group ${card.featured ? 'border-[#5FBDCE]/30 bg-gradient-to-br from-[#5FBDCE]/5 to-transparent' : 'hover:border-[#5FBDCE]/50'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl ${card.color} transition-transform group-hover:scale-110`}>
                          <card.icon className="h-5 w-5" />
                        </div>
                        {card.featured && (
                          <Badge variant="secondary" className="bg-[#5FBDCE]/10 text-[#5FBDCE] border-0">
                            Empfohlen
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base mb-1">{card.title}</CardTitle>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                      <div className="flex items-center text-[#5FBDCE] text-sm mt-3 font-medium">
                        {card.action || "Öffnen"} <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Beliebte Aufgaben */}
          <TabsContent value="beliebte" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#5FBDCE]" />
                      Schnellstart
                    </CardTitle>
                    <CardDescription>
                      Wählen Sie eine beliebte Aufgabe oder starten Sie eine neue
                    </CardDescription>
                  </div>
                  <Link href="/aufgaben">
                    <Button variant="outline" size="sm" className="gap-2">
                      Alle anzeigen <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {quickActionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : quickActions && quickActions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                      <Link key={action.slug} href={`/aufgabe/${action.slug}`}>
                        <Card className="cursor-pointer hover:shadow-md hover:border-[#5FBDCE]/50 transition-all h-full group">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-[#5FBDCE]/10 text-[#5FBDCE] transition-transform group-hover:scale-110">
                                <DynamicIcon name={action.icon || "FileText"} className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{action.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                  {action.shortDescription || "KI-gestützte Aufgabe"}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#5FBDCE] transition-colors flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Noch keine Aufgaben-Templates verfügbar.</p>
                    <Link href="/aufgaben">
                      <Button variant="outline">Aufgaben erkunden</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Letzte Aktivitäten */}
          <TabsContent value="aktivitaet" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-500" />
                    Letzte Aktivitäten
                  </CardTitle>
                  <Link href="/verlauf">
                    <Button variant="outline" size="sm" className="gap-2">
                      Alle anzeigen <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => activity.status === 'completed' && (window.location.href = `/ergebnis/${activity.id}`)}
                      >
                        <div className={`p-2.5 rounded-xl ${
                          activity.status === 'completed' ? 'bg-green-100' :
                          activity.status === 'processing' ? 'bg-blue-100' :
                          activity.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {activity.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                           activity.status === 'processing' ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> :
                           activity.status === 'failed' ? <XCircle className="h-5 w-5 text-red-600" /> :
                           <DynamicIcon name={activity.template?.icon ?? "FileText"} className="h-5 w-5 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {activity.template?.title || "Aufgabe"}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatTimeAgo(activity.createdAt)}</span>
                            {activity.template?.estimatedTimeSavings && activity.status === 'completed' && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">{activity.template.estimatedTimeSavings} Min. gespart</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={activity.status ?? 'pending'} />
                          {activity.status === 'completed' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/ergebnis/${activity.id}`;
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">
                      Noch keine Aktivitäten vorhanden
                    </p>
                    <Link href="/aufgaben">
                      <Button variant="outline">
                        Erste Aufgabe starten
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin-Hinweis für Admins/Owner */}
        {(user?.role === 'admin' || user?.role === 'owner') && (
          <Card className="border-[#1E3A5F]/20 bg-gradient-to-r from-[#1E3A5F]/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#1E3A5F]/10">
                  <BarChart3 className="h-6 w-6 text-[#1E3A5F]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-[#1E3A5F]">
                    {user?.role === 'owner' ? 'Owner-Bereich' : 'Admin-Bereich'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Als {user?.role === 'owner' ? 'Owner' : 'Administrator'} haben Sie Zugriff auf erweiterte Funktionen wie das Geschäftsführer-Radar und die Template-Verwaltung.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/radar">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Target className="h-4 w-4" />
                        Zum Radar
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Admin-Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Onboarding-Tour für neue User */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => {
            setShowOnboarding(false);
            completeOnboardingMutation.mutate();
          }}
          onSkip={() => {
            setShowOnboarding(false);
            completeOnboardingMutation.mutate();
          }}
        />
      )}
    </DashboardLayout>
  );
}
