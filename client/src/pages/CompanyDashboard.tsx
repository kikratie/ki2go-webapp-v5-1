import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Loader2,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  FileText,
  Settings,
  UserPlus,
  Activity,
  PlayCircle,
  XCircle,
  Eye,
  CreditCard,
  Mail,
  Shield,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

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

export default function CompanyDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Test-Modus abfragen (nur für Owner)
  const isOwner = user?.role === 'owner';
  const { data: testModeData } = trpc.testroom.getCurrentMode.useQuery(
    undefined,
    { enabled: isOwner }
  );
  
  const isInTestMode = isOwner && testModeData?.isInTestMode;
  const testSession = testModeData?.session;
  const testOrganizationId = testSession?.testOrganizationId;

  // Subscription-Status laden
  const { data: subscriptionStatus, isLoading: subLoading } = trpc.subscription.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Organisation laden - im Test-Modus die Test-Organisation verwenden
  const effectiveOrgId = isInTestMode && testOrganizationId ? testOrganizationId : user?.organizationId;
  const { data: organization, isLoading: orgLoading } = trpc.organization.getById.useQuery(
    { id: effectiveOrgId! },
    { enabled: !!effectiveOrgId }
  );

  // Firmen-Statistiken laden
  const { data: companyStats } = trpc.dashboard.getCompanyStats.useQuery(
    { organizationId: effectiveOrgId! },
    { enabled: !!effectiveOrgId }
  );

  // Letzte Aktivitäten der Firma
  const { data: recentActivity } = trpc.dashboard.getCompanyActivity.useQuery(
    { organizationId: effectiveOrgId!, limit: 5 },
    { enabled: !!effectiveOrgId }
  );

  const isLoading = authLoading || subLoading || orgLoading;

  // Lade-Zustand
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  // Nicht eingeloggt
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Anmeldung erforderlich</CardTitle>
            <CardDescription>
              Bitte melden Sie sich an, um das Firmen-Dashboard zu sehen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/")}
            >
              Zur Anmeldung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Keine Organisation (außer im Test-Modus)
  if (!effectiveOrgId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#5FBDCE]/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-[#5FBDCE]" />
            </div>
            <CardTitle>Keine Firma registriert</CardTitle>
            <CardDescription>
              Registrieren Sie Ihre Firma, um das Dashboard zu nutzen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/onboarding")}
            >
              Firma registrieren
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Berechne Testphase-Fortschritt
  const daysRemaining = subscriptionStatus?.daysRemaining || 0;
  const totalDays = subscriptionStatus?.plan?.trialDays || 90;
  const daysUsed = totalDays - daysRemaining;
  const progressPercent = Math.min(100, (daysUsed / totalDays) * 100);

  // Status-Farbe
  const getStatusColor = () => {
    if (subscriptionStatus?.isExpired) return "text-red-600 bg-red-100";
    if (daysRemaining <= 7) return "text-orange-600 bg-orange-100";
    if (daysRemaining <= 14) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  // Schnellzugriff-Kacheln für Team-Verwaltung
  const teamCards = [
    {
      title: "Mitarbeiter einladen",
      description: "Neue Teammitglieder hinzufügen",
      icon: UserPlus,
      href: "/firma/users",
      color: "bg-[#5FBDCE]/10 text-[#5FBDCE]",
      action: "Einladen",
    },
    {
      title: "Team-Übersicht",
      description: "Alle Mitarbeiter verwalten",
      icon: Users,
      href: "/firma/users",
      color: "bg-indigo-500/10 text-indigo-500",
      count: (organization as any)?.memberCount || 1,
    },
  ];

  // Schnellzugriff-Kacheln für Nutzung
  const nutzungCards = [
    {
      title: "Aufgaben starten",
      description: "KI-gestützte Aufgaben ausführen",
      icon: Sparkles,
      href: "/aufgaben",
      color: "bg-gradient-to-r from-[#5FBDCE]/20 to-[#1E3A5F]/20 text-[#1E3A5F]",
      action: "Starten",
    },
    {
      title: "Nutzungs-Statistiken",
      description: "Detaillierte Auswertungen",
      icon: BarChart3,
      href: "/firma/stats",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      title: "Meine Dokumente",
      description: "Hochgeladene Dateien verwalten",
      icon: FileText,
      href: "/meine-dokumente",
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  // Einstellungen-Kacheln
  const einstellungenCards = [
    {
      title: "Firmen-Einstellungen",
      description: "Logo, Name und Details",
      icon: Building2,
      href: "/firma/settings",
      color: "bg-slate-500/10 text-slate-500",
    },
    {
      title: "Abo & Abrechnung",
      description: "Plan und Rechnungen",
      icon: CreditCard,
      href: "/mein-abo",
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
    action?: string;
  }>) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Link key={card.href + card.title} href={card.href}>
          <Card className="cursor-pointer hover:shadow-md transition-all hover:border-[#5FBDCE]/50 h-full group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${card.color} transition-transform group-hover:scale-110`}>
                  <card.icon className="h-5 w-5" />
                </div>
                {card.count !== undefined && (
                  <span className="text-2xl font-bold text-[#1E3A5F]">{card.count}</span>
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E3A5F]">
                  {organization?.name || "Firmen-Dashboard"}
                </h1>
                <p className="text-gray-500 text-sm">
                  Willkommen zurück! Verwalten Sie Ihr Team und Ihre Aufgaben.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate("/firma/users")}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Mitarbeiter einladen
            </Button>
            <Button 
              onClick={() => navigate("/aufgaben")}
              className="bg-[#5FBDCE] hover:bg-[#5FBDCE]/90 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Neue Aufgabe
            </Button>
          </div>
        </div>

        {/* Warnungen */}
        {subscriptionStatus?.isExpiringSoon && !subscriptionStatus?.isExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Testphase endet bald</h3>
              <p className="text-yellow-700 text-sm">
                Ihre Testphase endet in {daysRemaining} Tagen. Kontaktieren Sie uns für ein Upgrade.
              </p>
            </div>
            <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-100">
              Upgrade anfragen
            </Button>
          </div>
        )}

        {subscriptionStatus?.isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Testphase abgelaufen</h3>
              <p className="text-red-700 text-sm">
                Ihre Testphase ist abgelaufen. Kontaktieren Sie uns für ein Upgrade.
              </p>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Upgrade anfragen
            </Button>
          </div>
        )}

        {/* KPI-Übersicht */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Testphase-Status */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#5FBDCE]/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Testphase</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor()}`}>
                  {subscriptionStatus?.isExpired ? "Abgelaufen" : "Aktiv"}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">{daysRemaining}</span>
                <span className="text-gray-500 text-sm">Tage</span>
              </div>
              <Progress value={progressPercent} className="mt-3 h-1.5" />
            </CardContent>
          </Card>

          {/* Mitarbeiter */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Team</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">
                  {companyStats?.memberCount || (organization as any)?.memberCount || 1}
                </span>
                <span className="text-gray-500 text-sm">Mitarbeiter</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Limit: {subscriptionStatus?.plan?.userLimit || "∞"}
              </p>
            </CardContent>
          </Card>

          {/* Aufgaben diesen Monat */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#5FBDCE]/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Aufgaben</span>
                <Zap className="h-4 w-4 text-[#5FBDCE]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">
                  {companyStats?.tasksThisMonth || subscriptionStatus?.creditsUsed || 0}
                </span>
                <span className="text-gray-500 text-sm">diesen Monat</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {companyStats?.tasksTotal || 0} insgesamt
              </p>
            </CardContent>
          </Card>

          {/* Zeit gespart */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Zeit gespart</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1E3A5F]">
                  {companyStats?.timeSavedHours || Math.round((companyStats?.tasksTotal || 0) * 0.5)}h
                </span>
              </div>
              <p className="text-xs text-green-600 mt-2 font-medium">
                ≈ {Math.round((companyStats?.timeSavedHours || 0) / 8)} Arbeitstage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs für verschiedene Bereiche */}
        <Tabs defaultValue="schnellzugriff" className="space-y-4">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="schnellzugriff" className="gap-2">
              <Zap className="h-4 w-4" />
              Schnellzugriff
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="aktivitaet" className="gap-2">
              <Activity className="h-4 w-4" />
              Aktivität
            </TabsTrigger>
            <TabsTrigger value="einstellungen" className="gap-2">
              <Settings className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          {/* Schnellzugriff */}
          <TabsContent value="schnellzugriff" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A5F]">Schnellzugriff</h2>
              <p className="text-sm text-gray-500">Die wichtigsten Funktionen auf einen Blick</p>
            </div>
            {renderCardGrid(nutzungCards)}
          </TabsContent>

          {/* Team */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A5F]">Team-Verwaltung</h2>
              <Button variant="outline" size="sm" onClick={() => navigate("/firma/users")} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Mitarbeiter einladen
              </Button>
            </div>
            {renderCardGrid(teamCards)}
            
            {/* Team-Mitglieder Liste */}
            {(organization as any)?.members && (organization as any).members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aktive Mitarbeiter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(organization as any).members.slice(0, 5).map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.userName?.charAt(0) || member.userEmail?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.userName || "Unbekannt"}</p>
                            <p className="text-xs text-gray-500">{member.userEmail}</p>
                          </div>
                        </div>
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                          {member.role === "owner" ? "Admin" : "Mitarbeiter"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aktivität */}
          <TabsContent value="aktivitaet" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A5F]">Letzte Aktivitäten</h2>
              <Button variant="outline" size="sm" onClick={() => navigate("/verlauf")} className="gap-2">
                <Eye className="h-4 w-4" />
                Alle anzeigen
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className={`p-2 rounded-lg ${
                          activity.status === 'completed' ? 'bg-green-100' :
                          activity.status === 'failed' ? 'bg-red-100' :
                          activity.status === 'running' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {activity.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                           activity.status === 'failed' ? <XCircle className="h-4 w-4 text-red-600" /> :
                           activity.status === 'running' ? <PlayCircle className="h-4 w-4 text-blue-600" /> :
                           <Clock className="h-4 w-4 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{activity.templateName || activity.title || "Aufgabe"}</p>
                          <p className="text-xs text-gray-500">{activity.userName || "Unbekannt"} • {formatTimeAgo(activity.createdAt)}</p>
                        </div>
                        <StatusBadge status={activity.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Noch keine Aktivitäten</p>
                    <Button 
                      variant="link" 
                      className="text-[#5FBDCE] mt-2"
                      onClick={() => navigate("/aufgaben")}
                    >
                      Erste Aufgabe starten →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Einstellungen */}
          <TabsContent value="einstellungen" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1E3A5F]">Einstellungen</h2>
            </div>
            {renderCardGrid(einstellungenCards)}
          </TabsContent>
        </Tabs>

        {/* Testphase-Info Footer */}
        {subscriptionStatus?.status === "trial" && !subscriptionStatus?.isExpired && (
          <Card className="bg-gradient-to-r from-[#1E3A5F] to-[#2a4a6f] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
            <CardContent className="py-6 relative">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ihre Testphase</h3>
                    <p className="text-white/80 text-sm">
                      Noch {daysRemaining} Tage um alle Funktionen zu testen
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{daysRemaining}</div>
                    <div className="text-white/60 text-xs">Tage übrig</div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="bg-white text-[#1E3A5F] hover:bg-white/90"
                    onClick={() => navigate("/anfrage-stellen")}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Upgrade anfragen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
