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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  FileText,
  Euro,
} from "lucide-react";

// Status-Badge Komponente
function SubscriptionStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Kein Abo</Badge>;
  
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    trial: { label: "Testphase", variant: "secondary" },
    active: { label: "Aktiv", variant: "default" },
    expired: { label: "Abgelaufen", variant: "destructive" },
    cancelled: { label: "Gekündigt", variant: "outline" },
    suspended: { label: "Gesperrt", variant: "destructive" },
  };
  
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Nutzungs-Ampel Komponente
function UsageIndicator({ used, total }: { used: number; total: number | null }) {
  if (!total) return <span className="text-muted-foreground">-</span>;
  
  const percentage = (used / total) * 100;
  let color = "bg-green-500";
  if (percentage >= 80) color = "bg-red-500";
  else if (percentage >= 60) color = "bg-yellow-500";
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{used}/{total}</span>
    </div>
  );
}

export default function AdminKunden() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = trpc.customerManagement.getCustomers.useQuery({
    page,
    limit: 20,
    search: searchTerm || undefined,
  });

  // KPI-Karten Daten berechnen
  const totalCustomers = data?.pagination.total || 0;
  const activeCustomers = data?.customers.filter(c => c.subscription?.status === "active").length || 0;
  const trialCustomers = data?.customers.filter(c => c.subscription?.status === "trial").length || 0;
  const totalRevenue = data?.customers.reduce((sum, c) => sum + (c.usage?.totalCost || 0), 0) || 0;

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fehler beim Laden</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kunden-Management</h1>
            <p className="text-muted-foreground mt-1">
              Übersicht aller Kunden, Nutzung und Pakete
            </p>
          </div>
        </div>

        {/* KPI-Karten */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Kunden</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalCustomers}</div>
              )}
              <p className="text-xs text-muted-foreground">Registrierte Firmen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Abos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
              )}
              <p className="text-xs text-muted-foreground">Zahlende Kunden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Testphase</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-yellow-600">{trialCustomers}</div>
              )}
              <p className="text-xs text-muted-foreground">Potenzielle Kunden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Umsatz</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
              )}
              <p className="text-xs text-muted-foreground">LLM-Kosten gesamt</p>
            </CardContent>
          </Card>
        </div>

        {/* Suchleiste */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kundenliste</CardTitle>
                <CardDescription>
                  Alle registrierten Firmen mit Nutzungsstatistiken
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kunde suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : data?.customers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Keine Kunden gefunden</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Versuchen Sie einen anderen Suchbegriff" : "Es sind noch keine Kunden registriert"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Kundennr.</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Nutzung (Monat)</TableHead>
                    <TableHead>Templates</TableHead>
                    <TableHead>Kosten (Monat)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            {customer.industry && (
                              <div className="text-xs text-muted-foreground">{customer.industry}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {customer.customerNumber || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        {customer.subscription?.plan ? (
                          <Badge variant="outline" className="font-medium">
                            <Package className="h-3 w-3 mr-1" />
                            {customer.subscription.plan.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <SubscriptionStatusBadge status={customer.subscription?.status || null} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.memberCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <UsageIndicator 
                          used={customer.usage?.tasksThisMonth || 0} 
                          total={customer.subscription?.creditsTotal || null} 
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {customer.templates?.activated || 0}
                          </span>
                          {(customer.templates?.custom || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{customer.templates?.custom} Custom
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          €{(customer.usage?.costThisMonth || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/kunden/${customer.id}`}>
                          <Button variant="ghost" size="sm">
                            Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Seite {data.pagination.page} von {data.pagination.totalPages} ({data.pagination.total} Kunden)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Weiter
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
