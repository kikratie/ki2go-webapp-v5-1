import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  FileText,
  Euro,
  Calendar,
  Activity,
  BarChart3,
  Settings,
  UserCog,
  Briefcase,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

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

// Mitarbeiter-Rollen Badge
function MemberRoleBadge({ role }: { role: string }) {
  const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    owner: { label: "Inhaber", variant: "default" },
    admin: { label: "Admin", variant: "secondary" },
    member: { label: "Mitarbeiter", variant: "outline" },
  };
  
  const config = roleConfig[role] || { label: role, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Übersicht Tab
function OverviewTab({ customerId }: { customerId: number }) {
  const { data, isLoading } = trpc.customerManagement.getCustomerById.useQuery({ organizationId: customerId });
  const { data: trends } = trpc.customerManagement.getCustomerUsageTrends.useQuery({ organizationId: customerId });
  const { data: topTemplates } = trpc.customerManagement.getCustomerTopTemplates.useQuery({ organizationId: customerId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI-Karten */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.memberCount}</div>
            <p className="text-xs text-muted-foreground">Registrierte Nutzer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aufgaben (Monat)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.currentMonth.tasksUsed}</div>
            <p className="text-xs text-muted-foreground">Ausgeführte Aufgaben</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kosten (Monat)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.kpis.currentMonth.totalCostEur.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">LLM-Kosten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.kpis.templates.activated}
              {data.kpis.templates.custom > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  +{data.kpis.templates.custom} Custom
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Aktivierte Aufgaben</p>
          </CardContent>
        </Card>
      </div>

      {/* Nutzungs-Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Nutzungs-Trend (6 Monate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends && trends.length > 0 ? (
            <div className="space-y-4">
              {trends.map((month) => (
                <div key={month.month} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-muted-foreground">{month.month}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min((month.tasksUsed / Math.max(...trends.map(t => t.tasksUsed || 1))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm font-medium text-right">{month.tasksUsed} Aufg.</span>
                  <span className="w-20 text-sm text-muted-foreground text-right">€{month.totalCostEur.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Keine Nutzungsdaten vorhanden</p>
          )}
        </CardContent>
      </Card>

      {/* Top-Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meistgenutzte Aufgaben
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topTemplates && topTemplates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead className="text-right">Ausführungen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTemplates.map((template, index) => (
                  <TableRow key={template.templateId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{template.name}</TableCell>
                    <TableCell className="text-right">{template.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">Noch keine Aufgaben ausgeführt</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Mitarbeiter Tab
function MembersTab({ customerId }: { customerId: number }) {
  const { data: members, isLoading, refetch } = trpc.customerManagement.getCustomerMembers.useQuery({ organizationId: customerId });
  const { data: categories } = trpc.customerManagement.getCategories.useQuery();
  const { data: businessAreas } = trpc.customerManagement.getBusinessAreas.useQuery();
  
  const updateDepartment = trpc.customerManagement.updateMemberDepartment.useMutation({
    onSuccess: () => {
      toast.success("Abteilung aktualisiert");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleCategoryChange = (userId: number, categoryId: string) => {
    updateDepartment.mutate({
      userId,
      categoryId: categoryId === "none" ? null : parseInt(categoryId),
      businessAreaId: members?.find(m => m.userId === userId)?.department.businessAreaId || null,
    });
  };

  const handleBusinessAreaChange = (userId: number, businessAreaId: string) => {
    updateDepartment.mutate({
      userId,
      categoryId: members?.find(m => m.userId === userId)?.department.categoryId || null,
      businessAreaId: businessAreaId === "none" ? null : parseInt(businessAreaId),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Mitarbeiter ({members?.length || 0})
        </CardTitle>
        <CardDescription>
          Verwalten Sie Mitarbeiter und weisen Sie Abteilungen zu
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members && members.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Unternehmensbereich</TableHead>
                <TableHead>Nutzung (Monat)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className={member.isInactive ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MemberRoleBadge role={member.role} />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.department.categoryId?.toString() || "none"}
                      onValueChange={(value) => handleCategoryChange(member.userId!, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Keine Kategorie</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.department.businessAreaId?.toString() || "none"}
                      onValueChange={(value) => handleBusinessAreaChange(member.userId!, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Bereich wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kein Bereich</SelectItem>
                        {businessAreas?.map((area) => (
                          <SelectItem key={area.id} value={area.id.toString()}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{member.usage.tasksThisMonth}</span>
                      <span className="text-muted-foreground"> Aufgaben</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      €{member.usage.costThisMonth.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.isInactive ? (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inaktiv (30+ Tage)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aktiv
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Keine Mitarbeiter</h3>
            <p className="text-muted-foreground">Diese Firma hat noch keine Mitarbeiter registriert</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Templates Tab
function TemplatesTab({ customerId }: { customerId: number }) {
  const { data: templates, isLoading } = trpc.customerManagement.getCustomerTemplates.useQuery({ organizationId: customerId });
  const { data: customTemplates } = trpc.customerManagement.getCustomerCustomTemplates.useQuery({ organizationId: customerId });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Aktivierte Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Aktivierte Aufgaben ({templates?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead>Aktiviert am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.templateName}</TableCell>
                    <TableCell>
                      {template.assignedAt ? new Date(template.assignedAt).toLocaleDateString("de-DE") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">Keine Aufgaben aktiviert</p>
          )}
        </CardContent>
      </Card>

      {/* Custom Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Custom-Templates ({customTemplates?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customTemplates && customTemplates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nutzung</TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{template.uniqueId}</code>
                    </TableCell>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={template.status === "active" ? "default" : "secondary"}>
                        {template.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.usageCount || 0}x</TableCell>
                    <TableCell>
                      {template.createdAt ? new Date(template.createdAt).toLocaleDateString("de-DE") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">Keine Custom-Templates vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Paket Tab
function PlanTab({ customerId }: { customerId: number }) {
  const { data: customerData, refetch } = trpc.customerManagement.getCustomerById.useQuery({ organizationId: customerId });
  const { data: plans } = trpc.customerManagement.getAvailablePlans.useQuery();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const updatePlan = trpc.customerManagement.updateCustomerPlan.useMutation({
    onSuccess: () => {
      toast.success("Paket erfolgreich geändert");
      setDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handlePlanChange = () => {
    if (!selectedPlanId) return;
    updatePlan.mutate({
      organizationId: customerId,
      planId: selectedPlanId,
    });
  };

  const currentPlan = customerData?.subscription?.plan;
  const subscription = customerData?.subscription;

  return (
    <div className="space-y-6">
      {/* Aktuelles Paket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Aktuelles Paket
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                  <p className="text-muted-foreground">{currentPlan.description}</p>
                </div>
                <SubscriptionStatusBadge status={subscription?.status || null} />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Gültig bis</p>
                  <p className="font-medium">
                    {subscription?.validUntil 
                      ? new Date(subscription.validUntil).toLocaleDateString("de-DE")
                      : "-"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits verbraucht</p>
                  <p className="font-medium">
                    {subscription?.creditsUsed || 0} / {subscription?.creditsTotal || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preis</p>
                  <p className="font-medium">
                    {currentPlan.priceMonthly ? `€${currentPlan.priceMonthly}/Monat` : "Kostenlos"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Kein Paket zugewiesen</h3>
              <p className="text-muted-foreground">Dieser Kunde hat noch kein Paket</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paket ändern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paket ändern
          </CardTitle>
          <CardDescription>
            Wählen Sie ein neues Paket für diesen Kunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans?.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${
                  currentPlan?.id === plan.id 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {currentPlan?.id === plan.id && (
                      <Badge>Aktuell</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User-Limit:</span>
                      <span>{plan.userLimit || "Unbegrenzt"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credits:</span>
                      <span>{plan.creditLimit || "Unbegrenzt"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preis:</span>
                      <span className="font-medium">
                        {plan.priceMonthly ? `€${plan.priceMonthly}/Monat` : "Kostenlos"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlanId && selectedPlanId !== currentPlan?.id && (
            <div className="mt-6 flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    Paket ändern
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Paket wirklich ändern?</DialogTitle>
                    <DialogDescription>
                      Das Paket wird sofort geändert. Der Kunde erhält die neuen Limits und Features.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handlePlanChange} disabled={updatePlan.isPending}>
                      {updatePlan.isPending ? "Wird geändert..." : "Bestätigen"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hauptkomponente
export default function AdminKundenDetail() {
  const params = useParams<{ id: string }>();
  const customerId = parseInt(params.id || "0");
  
  const { data, isLoading, error } = trpc.customerManagement.getCustomerById.useQuery(
    { organizationId: customerId },
    { enabled: customerId > 0 }
  );

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fehler beim Laden</h2>
            <p className="text-muted-foreground">{error.message}</p>
            <Link href="/admin/kunden">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/kunden">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            {isLoading ? (
              <Skeleton className="h-10 w-64" />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{data?.organization.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {data?.organization.customerNumber && (
                        <code className="bg-muted px-2 py-0.5 rounded">{data.organization.customerNumber}</code>
                      )}
                      {data?.organization.industry && (
                        <span>• {data.organization.industry}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {data?.subscription && (
            <SubscriptionStatusBadge status={data.subscription.status} />
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mitarbeiter
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Paket
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab customerId={customerId} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab customerId={customerId} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesTab customerId={customerId} />
          </TabsContent>

          <TabsContent value="plan">
            <PlanTab customerId={customerId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
