import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Crown,
  Sparkles,
  Gift,
  Check,
  Calendar,
  Users,
  Zap,
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

// Paket-Icons basierend auf Slug
const getPlanIcon = (slug: string) => {
  switch (slug) {
    case "free":
      return <Gift className="h-8 w-8" />;
    case "basic":
      return <Package className="h-8 w-8" />;
    case "pro":
      return <Sparkles className="h-8 w-8" />;
    case "enterprise":
      return <Crown className="h-8 w-8" />;
    default:
      return <Package className="h-8 w-8" />;
  }
};

// Paket-Farben basierend auf Slug
const getPlanColors = (slug: string) => {
  switch (slug) {
    case "free":
      return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", accent: "text-gray-500" };
    case "basic":
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", accent: "text-blue-500" };
    case "pro":
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", accent: "text-purple-500" };
    case "enterprise":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", accent: "text-amber-500" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", accent: "text-gray-500" };
  }
};

// Status-Badge
const getStatusBadge = (status: string | null | undefined) => {
  switch (status) {
    case "trial":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Testphase</Badge>;
    case "active":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Aktiv</Badge>;
    case "expired":
      return <Badge variant="destructive">Abgelaufen</Badge>;
    case "cancelled":
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Gekündigt</Badge>;
    case "suspended":
      return <Badge variant="destructive">Gesperrt</Badge>;
    default:
      return <Badge variant="outline">Unbekannt</Badge>;
  }
};

export default function MeinAbo() {
  const { data: subscriptionData, isLoading: subLoading } = trpc.userSubscription.getMySubscription.useQuery();
  const { data: usageData, isLoading: usageLoading } = trpc.userSubscription.getMyUsage.useQuery();
  const { data: availablePlans } = trpc.userSubscription.getAvailablePlans.useQuery();

  const isLoading = subLoading || usageLoading;

  // Berechne Credit-Prozentsatz
  const creditsUsed = subscriptionData?.subscription?.creditsUsed || 0;
  const creditsTotal = subscriptionData?.subscription?.creditsTotal || subscriptionData?.plan?.creditLimit || 100;
  const creditPercentage = creditsTotal ? Math.min(100, (creditsUsed / creditsTotal) * 100) : 0;

  // Warnung wenn Credits fast aufgebraucht
  const showCreditWarning = creditPercentage >= 80;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </DashboardLayout>
    );
  }

  // Kein Abo vorhanden
  if (!subscriptionData?.subscription || !subscriptionData?.plan) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mein Abo</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihr Abonnement und sehen Sie Ihre Nutzungsstatistiken
            </p>
          </div>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Kein aktives Abonnement</h3>
              <p className="text-muted-foreground text-center mb-4">
                Sie haben derzeit kein aktives Abonnement. Kontaktieren Sie Ihren Administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const plan = subscriptionData.plan;
  const subscription = subscriptionData.subscription;
  const colors = getPlanColors(plan.slug);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mein Abo</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Abonnement und sehen Sie Ihre Nutzungsstatistiken
          </p>
        </div>

        {/* Warnung bei niedrigen Credits */}
        {showCreditWarning && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Credits fast aufgebraucht</p>
                <p className="text-sm text-yellow-700">
                  Sie haben {creditPercentage.toFixed(0)}% Ihrer Credits verbraucht. 
                  Kontaktieren Sie Ihren Administrator für ein Upgrade.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Haupt-Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Aktuelles Paket */}
          <Card className={`${colors.border} border-2`}>
            <CardHeader className={`${colors.bg} rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={colors.text}>
                    {getPlanIcon(plan.slug)}
                  </div>
                  <div>
                    <CardTitle className={colors.text}>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Gültigkeitszeitraum */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Gültig bis</p>
                  <p className="font-medium">
                    {subscription.validUntil 
                      ? new Date(subscription.validUntil).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Unbegrenzt"}
                  </p>
                </div>
              </div>

              {/* Verbleibende Tage */}
              {subscription.daysRemaining !== undefined && subscription.daysRemaining <= 30 && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Verbleibend</p>
                    <p className={`font-medium ${subscription.daysRemaining <= 7 ? "text-red-600" : ""}`}>
                      {subscription.daysRemaining} Tage
                    </p>
                  </div>
                </div>
              )}

              {/* Mitarbeiter */}
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mitarbeiter</p>
                  <p className="font-medium">
                    {subscriptionData.memberCount} / {plan.userLimit || "∞"}
                  </p>
                </div>
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Enthaltene Funktionen</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className={`h-4 w-4 ${colors.accent}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credits & Nutzung */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Credits & Nutzung
              </CardTitle>
              <CardDescription>
                Ihr aktueller Verbrauch in diesem Abrechnungszeitraum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credit-Balken */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verbrauchte Credits</span>
                  <span className="font-medium">{creditsUsed} / {creditsTotal || "∞"}</span>
                </div>
                <Progress 
                  value={creditPercentage} 
                  className={`h-3 ${creditPercentage >= 80 ? "[&>div]:bg-yellow-500" : creditPercentage >= 95 ? "[&>div]:bg-red-500" : ""}`}
                />
                <p className="text-xs text-muted-foreground">
                  {creditsTotal ? `${(creditsTotal - creditsUsed)} Credits verbleibend` : "Unbegrenzte Credits"}
                </p>
              </div>

              {/* Statistiken */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{usageData?.tasksThisMonth || 0}</p>
                  <p className="text-sm text-muted-foreground">Aufgaben (30 Tage)</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{usageData?.totalTasks || 0}</p>
                  <p className="text-sm text-muted-foreground">Aufgaben gesamt</p>
                </div>
              </div>

              {/* Top Templates */}
              {usageData?.usageByTemplate && usageData.usageByTemplate.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Meistgenutzte Aufgaben</p>
                  <ul className="space-y-2">
                    {usageData.usageByTemplate.slice(0, 3).map((item, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {item.templateName || "Unbekannt"}
                        </span>
                        <Badge variant="secondary">{item.count}x</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Letzte Aktivitäten */}
        {usageData?.recentTasks && usageData.recentTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Letzte Aktivitäten
              </CardTitle>
              <CardDescription>
                Ihre zuletzt durchgeführten Aufgaben
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageData.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{task.templateName || "Aufgabe"}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.startedAt
                            ? new Date(task.startedAt).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "secondary"
                          : task.status === "failed"
                          ? "destructive"
                          : "outline"
                      }
                      className={
                        task.status === "completed" ? "bg-green-100 text-green-800" : ""
                      }
                    >
                      {task.status === "completed"
                        ? "Abgeschlossen"
                        : task.status === "failed"
                        ? "Fehlgeschlagen"
                        : task.status === "processing"
                        ? "In Bearbeitung"
                        : task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verfügbare Upgrades (für später) */}
        {availablePlans && availablePlans.length > 1 && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Upgrade-Optionen</CardTitle>
              <CardDescription>
                Erweitern Sie Ihre Möglichkeiten mit einem höheren Paket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {availablePlans
                  .filter((p) => p.slug !== plan.slug)
                  .slice(0, 3)
                  .map((upgradePlan) => {
                    const upgradeColors = getPlanColors(upgradePlan.slug);
                    return (
                      <div
                        key={upgradePlan.id}
                        className={`p-4 rounded-lg border ${upgradeColors.border} ${upgradeColors.bg}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={upgradeColors.text}>
                            {getPlanIcon(upgradePlan.slug)}
                          </div>
                          <span className={`font-semibold ${upgradeColors.text}`}>
                            {upgradePlan.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {upgradePlan.description}
                        </p>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Anfragen
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Kontaktieren Sie Ihren Administrator für ein Upgrade
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
