import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
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
  History, Search, Clock, CheckCircle, XCircle, Loader2,
  FileText, ExternalLink, RefreshCw, Calendar, Filter
} from "lucide-react";

// Typ für Activity aus der API
type Activity = {
  id: number;
  status: "completed" | "failed" | "pending" | "processing" | "cancelled" | null;
  createdAt: Date;
  completedAt: Date | null;
  template: {
    id: number;
    title: string;
    icon: string;
    slug: string | null;
    estimatedTimeSavings: number | null;
  } | null;
};

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
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Wartend
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline">
          <XCircle className="h-3 w-3 mr-1" />
          Abgebrochen
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

// Dauer formatieren
function formatDuration(startDate: Date | null, endDate: Date | null) {
  if (!startDate || !endDate) return "-";
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  if (ms < 0) return "-";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export default function Verlauf() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Daten laden - erhöhtes Limit für Verlauf
  const { data, isLoading, refetch } = trpc.dashboard.getRecentActivity.useQuery({
    limit: 20,
  });

  // Filtern
  const filteredActivities = (data || []).filter((activity: Activity) => {
    // Status-Filter
    if (statusFilter !== "all" && activity.status !== statusFilter) {
      return false;
    }
    // Suche
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        activity.template?.title?.toLowerCase().includes(searchLower) ||
        activity.template?.slug?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Statistiken berechnen
  const stats = {
    total: data?.length || 0,
    completed: (data || []).filter((a: Activity) => a.status === "completed").length,
    failed: (data || []).filter((a: Activity) => a.status === "failed").length,
    processing: (data || []).filter((a: Activity) => a.status === "processing").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Verlauf</h1>
            <p className="text-muted-foreground">
              Übersicht aller ausgeführten Aufgaben
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
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Aufgaben ausgeführt</p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Laufend</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">In Bearbeitung</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Suche */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Aufgaben-Verlauf</CardTitle>
                <CardDescription>
                  {filteredActivities.length} von {stats.total} Aufgaben
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                {/* Suche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Aufgabe suchen..."
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
                    <SelectItem value="pending">Wartend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Verlauf Liste */}
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
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine Aufgaben gefunden</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? "Versuchen Sie andere Filter"
                    : "Starten Sie Ihre erste Aufgabe, um den Verlauf zu sehen"}
                </p>
                {!search && statusFilter === "all" && (
                  <Link href="/aufgaben">
                    <Button className="mt-4">
                      Aufgabe starten
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                  <div className="w-10"></div>
                  <div className="flex-1">Aufgabe</div>
                  <div className="w-28 hidden md:block">Status</div>
                  <div className="w-20 hidden md:block">Dauer</div>
                  <div className="w-36 hidden lg:block">Datum</div>
                  <div className="w-24"></div>
                </div>
                
                {/* Activity Rows */}
                {filteredActivities.map((activity: Activity) => (
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
                    <div className="w-28 hidden md:block">
                      <StatusBadge status={activity.status} />
                    </div>
                    <div className="w-20 text-sm text-muted-foreground hidden md:flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(activity.createdAt, activity.completedAt)}
                    </div>
                    <div className="w-36 text-sm text-muted-foreground hidden lg:block">
                      {formatDate(activity.completedAt || activity.createdAt)}
                    </div>
                    <div className="w-24 flex justify-end">
                      {(activity.status === "completed" || activity.status === "failed") && activity.id ? (
                        <Link href={`/ergebnis/${activity.id}`}>
                          <Button 
                            variant={activity.status === "completed" ? "default" : "outline"} 
                            size="sm"
                            className={activity.status === "completed" ? "bg-primary" : ""}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ansehen
                          </Button>
                        </Link>
                      ) : activity.status === "processing" ? (
                        <Button variant="outline" size="sm" disabled>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Läuft...
                        </Button>
                      ) : null}
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
