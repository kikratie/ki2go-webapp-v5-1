import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Building2, 
  Euro, 
  TrendingUp, 
  Users,
  BarChart3,
  Activity
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function OwnerKosten() {
  // Manus-Gesamtkosten
  const { data: manusKosten, isLoading: kostenLoading } = trpc.ownerDashboard.getManusKosten.useQuery();
  
  // Kosten pro Kunde
  const { data: kundenKosten, isLoading: kundenLoading } = trpc.ownerDashboard.getKundenKosten.useQuery();
  
  // Kosten-Trend
  const { data: kostenTrend } = trpc.ownerDashboard.getKostenTrend.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manus-Kosten Übersicht</h1>
            <p className="text-muted-foreground">
              Verbrauch und Kosten aller Kunden bei Manus
            </p>
          </div>
          <Badge variant="default" className="gap-1 w-fit">
            <Euro className="h-3 w-3" />
            Owner Dashboard
          </Badge>
        </div>

        {/* Gesamt-KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kosten (Monat)</CardTitle>
              <Euro className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {kostenLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    €{(manusKosten?.currentMonth.totalCostEur || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aktueller Monat
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kosten (Gesamt)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kostenLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    €{(manusKosten?.allTime.totalCostEur || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seit Beginn
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
              {kostenLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {manusKosten?.currentMonth.tasksUsed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {manusKosten?.allTime.tasksUsed || 0} insgesamt
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
              {kostenLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {((manusKosten?.currentMonth.inputTokens || 0) + (manusKosten?.currentMonth.outputTokens || 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In: {(manusKosten?.currentMonth.inputTokens || 0).toLocaleString()} / Out: {(manusKosten?.currentMonth.outputTokens || 0).toLocaleString()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kosten-Trend */}
        {kostenTrend && kostenTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kosten-Trend (letzte 12 Monate)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-40">
                {kostenTrend.map((t) => {
                  const maxCost = Math.max(...kostenTrend.map(x => x.totalCostEur), 0.01);
                  const height = (t.totalCostEur / maxCost) * 100;
                  return (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`€${t.totalCostEur.toFixed(4)} (${t.tasksUsed} Aufgaben)`}
                      />
                      <span className="text-[10px] text-muted-foreground rotate-45 origin-left">
                        {t.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kosten pro Kunde/Organisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Kosten pro Kunde
            </CardTitle>
            <CardDescription>
              Verbrauch und Kosten aufgeschlüsselt nach Organisationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kundenLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : kundenKosten && kundenKosten.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead className="text-right">Mitarbeiter</TableHead>
                    <TableHead className="text-right">Aufgaben (Monat)</TableHead>
                    <TableHead className="text-right">Tokens (Monat)</TableHead>
                    <TableHead className="text-right">Kosten (Monat)</TableHead>
                    <TableHead className="text-right">Kosten (Gesamt)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kundenKosten.map((kunde) => (
                    <TableRow key={kunde.organizationId}>
                      <TableCell className="font-medium">
                        {kunde.organizationName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {kunde.memberCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {kunde.currentMonth.tasksUsed}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(kunde.currentMonth.inputTokens + kunde.currentMonth.outputTokens).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        €{kunde.currentMonth.totalCostEur.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{kunde.allTime.totalCostEur.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Kunden-Daten vorhanden.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info-Box */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Kosten-Berechnung</p>
                <p className="text-sm text-muted-foreground">
                  Die Kosten werden basierend auf dem Token-Verbrauch berechnet. 
                  Input-Tokens: €0.00007/1K, Output-Tokens: €0.00028/1K (Gemini 2.5 Flash Preise).
                  Diese Kosten sind Ihre tatsächlichen Manus-Kosten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
