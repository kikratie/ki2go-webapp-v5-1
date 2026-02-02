import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Euro, 
  Download,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function FirmaDashboard() {
  
  // Prüfe Zugriff
  const { data: access, isLoading: accessLoading } = trpc.firmaDashboard.checkAccess.useQuery();
  
  // KPIs laden
  const { data: kpis, isLoading: kpisLoading } = trpc.firmaDashboard.getKpis.useQuery(
    undefined,
    { enabled: access?.hasAccess }
  );
  
  // Mitarbeiter-Statistiken
  const { data: memberStats, isLoading: membersLoading } = trpc.firmaDashboard.getMemberStats.useQuery(
    undefined,
    { enabled: access?.hasAccess }
  );
  
  // Trends
  const { data: trends } = trpc.firmaDashboard.getTrends.useQuery(
    undefined,
    { enabled: access?.hasAccess }
  );
  
  // CSV Export
  const { data: csvData, refetch: exportCsv } = trpc.firmaDashboard.exportCsv.useQuery(
    undefined,
    { enabled: false }
  );
  
  const handleExport = async () => {
    const result = await exportCsv();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = result.data.filename;
      link.click();
    }
  };

  if (accessLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-8 w-48" />
        </div>
      </DashboardLayout>
    );
  }

  if (!access?.hasAccess) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Kein Zugriff
            </CardTitle>
            <CardDescription>
              {access?.reason || "Sie haben keine Berechtigung für dieses Dashboard."}
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Firmen-Dashboard</h1>
            <p className="text-muted-foreground">
              Nutzungsstatistiken und Kosten-Übersicht für Ihr Unternehmen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {access.role === "owner" ? "Inhaber" : "Administrator"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </div>

        {/* KPI-Karten */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpis?.memberCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {kpis?.activeMemberCount || 0} aktiv diesen Monat
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aufgaben (Monat)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpis?.currentMonth.tasksUsed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {kpis?.allTime.tasksUsed || 0} insgesamt
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens (Monat)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {((kpis?.currentMonth.inputTokens || 0) + (kpis?.currentMonth.outputTokens || 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Input: {(kpis?.currentMonth.inputTokens || 0).toLocaleString()} / Output: {(kpis?.currentMonth.outputTokens || 0).toLocaleString()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kosten (Monat)</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    €{(kpis?.currentMonth.totalCostEur || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    €{(kpis?.allTime.totalCostEur || 0).toFixed(2)} insgesamt
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trend-Übersicht */}
        {trends && trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Nutzungs-Trend (letzte 6 Monate)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {trends.map((t, i) => {
                  const maxTasks = Math.max(...trends.map(x => x.tasksUsed), 1);
                  const height = (t.tasksUsed / maxTasks) * 100;
                  return (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${t.tasksUsed} Aufgaben`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t.month.split("-")[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mitarbeiter-Tabelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mitarbeiter-Nutzung
            </CardTitle>
            <CardDescription>
              Detaillierte Statistiken pro Mitarbeiter für den aktuellen Monat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : memberStats && memberStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="text-right">Aufgaben</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Letzte Aktivität</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats.map((member) => {
                    const isActive = member.currentMonth.tasksUsed > 0;
                    const lastActivity = member.lastExecution 
                      ? new Date(member.lastExecution).toLocaleDateString("de-DE")
                      : "Nie";
                    
                    return (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"}>
                            {member.role === "owner" ? "Inhaber" : member.role === "admin" ? "Admin" : "Mitarbeiter"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {member.currentMonth.tasksUsed}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(member.currentMonth.inputTokens + member.currentMonth.outputTokens).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          €{member.currentMonth.totalCostEur.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Inaktiv
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lastActivity}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Keine Mitarbeiter-Daten vorhanden.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
