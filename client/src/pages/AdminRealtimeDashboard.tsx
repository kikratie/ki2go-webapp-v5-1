import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign,
  Loader2,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  RefreshCw,
  Upload,
  Zap
} from "lucide-react";

export default function AdminRealtimeDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, refetch } = trpc.audit.getRealtimeStats.useQuery(undefined, {
    refetchInterval: 30000, // Alle 30 Sekunden aktualisieren
  });

  // Nur Owner darf zugreifen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Zugriff verweigert</CardTitle>
            <CardDescription>
              Diese Seite ist nur für den Owner zugänglich.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/")}
            >
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCost = (cost: number) => {
    if (cost === 0) return "€0.00";
    if (cost < 0.01) return `€${cost.toFixed(4)}`;
    return `€${cost.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">
              Echtzeit-Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Live-Übersicht aller Aktivitäten und Statistiken
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/admin")}
            >
              Zurück zum Admin
            </Button>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
          </div>
        ) : (
          <>
            {/* Echtzeit-Statistiken */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Aktive User (24h)</p>
                      <p className="text-3xl font-bold text-green-900">
                        {data?.realtime.activeUsers24h || 0}
                      </p>
                    </div>
                    <div className="relative">
                      <Activity className="h-10 w-10 text-green-500" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Laufende Aufgaben</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {data?.realtime.runningTasks || 0}
                      </p>
                    </div>
                    <Zap className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={`bg-gradient-to-br ${
                (data?.realtime.errorRate || 0) > 10 
                  ? 'from-red-50 to-red-100 border-red-200' 
                  : 'from-gray-50 to-gray-100 border-gray-200'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${(data?.realtime.errorRate || 0) > 10 ? 'text-red-700' : 'text-gray-700'}`}>
                        Fehler-Rate (7d)
                      </p>
                      <p className={`text-3xl font-bold ${(data?.realtime.errorRate || 0) > 10 ? 'text-red-900' : 'text-gray-900'}`}>
                        {data?.realtime.errorRate || 0}%
                      </p>
                    </div>
                    <AlertTriangle className={`h-10 w-10 ${(data?.realtime.errorRate || 0) > 10 ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>
              <Card className={`bg-gradient-to-br ${
                (data?.realtime.expiringSubscriptions || 0) > 0 
                  ? 'from-amber-50 to-amber-100 border-amber-200' 
                  : 'from-gray-50 to-gray-100 border-gray-200'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${(data?.realtime.expiringSubscriptions || 0) > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                        Ablaufend (14d)
                      </p>
                      <p className={`text-3xl font-bold ${(data?.realtime.expiringSubscriptions || 0) > 0 ? 'text-amber-900' : 'text-gray-900'}`}>
                        {data?.realtime.expiringSubscriptions || 0}
                      </p>
                    </div>
                    <Clock className={`h-10 w-10 ${(data?.realtime.expiringSubscriptions || 0) > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gesamt-Statistiken */}
            <Card>
              <CardHeader>
                <CardTitle>Gesamt-Statistiken</CardTitle>
                <CardDescription>Alle Daten seit Beginn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-[#5FBDCE] mx-auto mb-2" />
                    <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totals.users || 0}</p>
                    <p className="text-sm text-gray-500">User gesamt</p>
                  </div>
                  <div className="text-center">
                    <Building2 className="h-8 w-8 text-[#5FBDCE] mx-auto mb-2" />
                    <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totals.organizations || 0}</p>
                    <p className="text-sm text-gray-500">Organisationen</p>
                  </div>
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-[#5FBDCE] mx-auto mb-2" />
                    <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totals.executions || 0}</p>
                    <p className="text-sm text-gray-500">Ausführungen</p>
                  </div>
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-[#5FBDCE] mx-auto mb-2" />
                    <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totals.documents || 0}</p>
                    <p className="text-sm text-gray-500">Dokumente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zeitraum-Statistiken */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Heute */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-[#5FBDCE]" />
                    <span>Heute</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ausführungen</span>
                      <span className="font-bold text-[#1E3A5F]">{data?.today.executions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Kosten</span>
                      <span className="font-bold text-orange-600">{formatCost(data?.today.cost || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diese Woche */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-[#5FBDCE]" />
                    <span>Diese Woche</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ausführungen</span>
                      <span className="font-bold text-[#1E3A5F]">{data?.thisWeek.executions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Kosten</span>
                      <span className="font-bold text-orange-600">{formatCost(data?.thisWeek.cost || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dieser Monat */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-[#5FBDCE]" />
                    <span>Dieser Monat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ausführungen</span>
                      <span className="font-bold text-[#1E3A5F]">{data?.thisMonth.executions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Kosten</span>
                      <span className="font-bold text-orange-600">{formatCost(data?.thisMonth.cost || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Schnellzugriff</CardTitle>
                <CardDescription>Direkte Links zu detaillierten Übersichten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center space-y-2"
                    onClick={() => navigate("/admin/organizations")}
                  >
                    <Building2 className="h-6 w-6 text-[#5FBDCE]" />
                    <span>Firmen</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center space-y-2"
                    onClick={() => navigate("/admin/users")}
                  >
                    <Users className="h-6 w-6 text-[#5FBDCE]" />
                    <span>User</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center space-y-2"
                    onClick={() => navigate("/admin/process-log")}
                  >
                    <FileText className="h-6 w-6 text-[#5FBDCE]" />
                    <span>Prozesse</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center space-y-2"
                    onClick={() => navigate("/admin/cost-analytics")}
                  >
                    <DollarSign className="h-6 w-6 text-[#5FBDCE]" />
                    <span>Kosten</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
