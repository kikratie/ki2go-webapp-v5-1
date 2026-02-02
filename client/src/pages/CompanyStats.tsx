import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  FileText,
  Loader2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target
} from "lucide-react";

// Einfache Bar-Chart Komponente
const SimpleBarChart = ({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) => {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 truncate max-w-[200px]">{item.label}</span>
            <span className="font-medium text-[#1E3A5F]">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${item.color || 'bg-[#5FBDCE]'}`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Trend-Indikator
const TrendIndicator = ({ value, positive = true }: { value: number; positive?: boolean }) => {
  const isPositive = positive ? value >= 0 : value <= 0;
  return (
    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      <span>{Math.abs(value)}%</span>
    </div>
  );
};

export default function CompanyStats() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Test-Modus prüfen
  const { data: testModeData } = trpc.testroom.getCurrentMode.useQuery(undefined, {
    enabled: user?.role === 'owner',
  });
  const isInTestMode = testModeData?.isInTestMode && testModeData?.session && (testModeData.session.testMode === 'firma_admin' || testModeData.session.testMode === 'firma_member');
  const effectiveOrgId = isInTestMode && testModeData?.session?.testOrganizationId 
    ? testModeData.session.testOrganizationId 
    : user?.organizationId;

  // Statistiken laden
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getCompanyStats.useQuery(
    { organizationId: effectiveOrgId || 0 },
    { enabled: !!effectiveOrgId }
  );

  // Aktivitäten laden
  const { data: activities, isLoading: activitiesLoading } = trpc.dashboard.getCompanyActivity.useQuery(
    { organizationId: effectiveOrgId || 0, limit: 10 },
    { enabled: !!effectiveOrgId }
  );

  // Organisation laden
  const { data: orgDetails } = trpc.organization.getById.useQuery(
    { id: effectiveOrgId || 0 },
    { enabled: !!effectiveOrgId }
  );

  const isLoading = authLoading || statsLoading;

  // Lade-Zustand
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
        </div>
      </DashboardLayout>
    );
  }

  // Nicht eingeloggt oder keine Organisation
  if (!user || (!user.organizationId && !isInTestMode)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Zugriff verweigert</CardTitle>
              <CardDescription>
                Sie müssen einer Organisation angehören, um diese Seite zu sehen.
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
      </DashboardLayout>
    );
  }

  const members = orgDetails?.members || [];
  const orgName = isInTestMode ? "KI2GO Test-Firma" : orgDetails?.name;

  // Beispiel-Daten für Charts (in Produktion aus API)
  const memberUsageData = members.slice(0, 5).map((member, index) => ({
    label: member.userName || `Mitarbeiter ${index + 1}`,
    value: Math.floor(Math.random() * 50) + 10,
    color: index === 0 ? 'bg-[#5FBDCE]' : index === 1 ? 'bg-indigo-500' : 'bg-gray-400'
  }));

  const templateUsageData = [
    { label: "Vertrags Analyse", value: 45, color: 'bg-[#5FBDCE]' },
    { label: "CV Analyse", value: 32, color: 'bg-indigo-500' },
    { label: "Stellenanzeigen optimieren", value: 28, color: 'bg-purple-500' },
    { label: "Bilanz Analyse", value: 21, color: 'bg-orange-500' },
    { label: "E-Mail Vorlagen", value: 15, color: 'bg-green-500' },
  ];

  const weeklyData = [
    { label: "Mo", value: 12 },
    { label: "Di", value: 18 },
    { label: "Mi", value: 15 },
    { label: "Do", value: 22 },
    { label: "Fr", value: 19 },
    { label: "Sa", value: 5 },
    { label: "So", value: 3 },
  ];

  const maxMemberUsage = Math.max(...memberUsageData.map(d => d.value), 1);
  const maxTemplateUsage = Math.max(...templateUsageData.map(d => d.value), 1);
  const maxWeeklyUsage = Math.max(...weeklyData.map(d => d.value), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Nutzungs-Statistiken</h1>
            <p className="text-gray-500">{orgName}</p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "week" | "month" | "year")}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Letzte 7 Tage</SelectItem>
              <SelectItem value="month">Letzter Monat</SelectItem>
              <SelectItem value="year">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Aufgaben gesamt</span>
                <Target className="h-4 w-4 text-[#5FBDCE]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#1E3A5F]">{stats?.tasksTotal || 0}</span>
                <TrendIndicator value={12} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Aktive Nutzer</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#1E3A5F]">{stats?.memberCount || members.length}</span>
                <TrendIndicator value={5} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Zeit gespart</span>
                <Clock className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#1E3A5F]">{stats?.timeSavedHours || 0}h</span>
                <TrendIndicator value={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Ø pro Mitarbeiter</span>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#1E3A5F]">
                  {members.length > 0 ? Math.round((stats?.tasksTotal || 0) / members.length) : 0}
                </span>
                <span className="text-gray-400 text-sm">Aufgaben</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Nach Mitarbeiter
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Nach Aufgabe
            </TabsTrigger>
          </TabsList>

          {/* Übersicht Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wöchentliche Nutzung */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#5FBDCE]" />
                    Wöchentliche Nutzung
                  </CardTitle>
                  <CardDescription>
                    Aufgaben pro Wochentag
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-40 gap-2">
                    {weeklyData.map((day, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-[#5FBDCE] rounded-t transition-all duration-500 hover:bg-[#5FBDCE]/80"
                          style={{ height: `${(day.value / maxWeeklyUsage) * 100}%`, minHeight: '8px' }}
                        />
                        <span className="text-xs text-gray-500 mt-2">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Beliebteste Aufgaben
                  </CardTitle>
                  <CardDescription>
                    Am häufigsten verwendete Templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart data={templateUsageData} maxValue={maxTemplateUsage} />
                </CardContent>
              </Card>
            </div>

            {/* Letzte Aktivitäten */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Letzte Team-Aktivitäten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#5FBDCE]/20 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-[#5FBDCE]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.templateName || 'Aufgabe'}</p>
                            <p className="text-xs text-gray-500">{activity.userName || 'Mitarbeiter'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {activity.status === 'completed' ? 'Abgeschlossen' : 'In Bearbeitung'}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Aktivitäten</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nach Mitarbeiter Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#5FBDCE]" />
                  Nutzung nach Mitarbeiter
                </CardTitle>
                <CardDescription>
                  Aufgaben pro Teammitglied im ausgewählten Zeitraum
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Mitglieder</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member, index) => {
                      const usage = Math.floor(Math.random() * 50) + 10;
                      const timeSaved = Math.floor(usage * 15);
                      return (
                        <div 
                          key={member.id}
                          className="p-4 rounded-xl bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#5FBDCE]/20 flex items-center justify-center font-medium text-[#1E3A5F]">
                                {(member.userName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{member.userName || 'Mitarbeiter'}</p>
                                <p className="text-sm text-gray-500">{member.userEmail}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[#1E3A5F]">{usage}</p>
                              <p className="text-xs text-gray-500">Aufgaben</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-lg font-semibold text-[#1E3A5F]">{timeSaved}m</p>
                              <p className="text-xs text-gray-500">Zeit gespart</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-[#1E3A5F]">{Math.floor(usage * 0.9)}</p>
                              <p className="text-xs text-gray-500">Abgeschlossen</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-green-600">+{Math.floor(Math.random() * 20)}%</p>
                              <p className="text-xs text-gray-500">vs. Vormonat</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nach Aufgabe Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Nutzung nach Aufgaben-Typ
                </CardTitle>
                <CardDescription>
                  Welche Templates werden am häufigsten verwendet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templateUsageData.map((template, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${template.color}`} />
                          <span className="font-medium">{template.label}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-[#1E3A5F]">{template.value}</span>
                          <TrendIndicator value={Math.floor(Math.random() * 30) - 10} />
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${template.color}`}
                          style={{ width: `${(template.value / maxTemplateUsage) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{Math.floor(template.value * 15)} Min. gespart</span>
                        <span>{Math.floor(template.value / members.length || 1)} pro Mitarbeiter</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
