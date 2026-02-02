import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ExternalLink,
  RefreshCw,
  Calendar,
  Filter,
  User,
  Building2,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from "lucide-react";

// Status-Badge Komponente
function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Abgeschlossen
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Fehlgeschlagen
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Läuft
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || "Unbekannt"}</Badge>;
  }
}

// Datum formatieren
function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminErgebnisse() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");

  // Alle Workflow-Ausführungen laden (Owner sieht alle)
  const { data: activities, isLoading, refetch } = trpc.dashboard.getRecentActivity.useQuery(
    { limit: 100 },
    { enabled: !!user }
  );

  // Statistiken berechnen
  const stats = {
    total: activities?.length || 0,
    completed: activities?.filter((a: any) => a.status === "completed").length || 0,
    failed: activities?.filter((a: any) => a.status === "failed").length || 0,
    needsReview: activities?.filter((a: any) => a.status === "completed" && !a.reviewed).length || 0,
  };

  // Filtern
  const filteredActivities = (activities || []).filter((activity: any) => {
    const matchesSearch = !search || 
      activity.template?.title?.toLowerCase().includes(search.toLowerCase()) ||
      activity.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      activity.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold">Zugriff verweigert</h2>
              <p className="text-muted-foreground mt-2">
                Diese Seite ist nur für Administratoren zugänglich.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ki2go-navy flex items-center gap-2">
              <Eye className="h-8 w-8" />
              Ergebnis-Übersicht
            </h1>
            <p className="text-muted-foreground mt-1">
              Qualitätssicherung: Alle Ergebnisse prüfen mit Dokument-Vergleich
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>

        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Ergebnisse</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erfolgreich</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fehlgeschlagen</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">Mit Fehler</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zu prüfen</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.needsReview}</div>
              <p className="text-xs text-muted-foreground">Noch nicht geprüft</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Suche */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Alle Ergebnisse</CardTitle>
                <CardDescription>
                  {filteredActivities.length} von {stats.total} Ergebnissen
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                {/* Suche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Aufgabe oder Benutzer suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>
                {/* Status-Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                    <SelectItem value="processing">Laufend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Ergebnis-Liste */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine Ergebnisse gefunden</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? "Versuchen Sie andere Filter"
                    : "Es wurden noch keine Aufgaben ausgeführt"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                  <div className="w-10"></div>
                  <div className="flex-1">Aufgabe</div>
                  <div className="w-40 hidden lg:block">Benutzer</div>
                  <div className="w-28 hidden md:block">Status</div>
                  <div className="w-36 hidden lg:block">Datum</div>
                  <div className="w-28"></div>
                </div>
                
                {/* Ergebnis Rows */}
                {filteredActivities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 px-4 py-3 border rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {activity.template?.title || "Unbekannte Aufgabe"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                    <div className="w-40 hidden lg:flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-sm truncate">
                        {activity.user?.displayName || activity.user?.email || "Unbekannt"}
                      </span>
                    </div>
                    <div className="w-28 hidden md:block">
                      <StatusBadge status={activity.status} />
                    </div>
                    <div className="w-36 text-sm text-muted-foreground hidden lg:block">
                      {formatDate(activity.completedAt || activity.createdAt)}
                    </div>
                    <div className="w-28 flex justify-end">
                      {(activity.status === "completed" || activity.status === "failed") && activity.id && (
                        <Link href={`/ergebnis/${activity.id}`}>
                          <Button variant="default" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Prüfen
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
