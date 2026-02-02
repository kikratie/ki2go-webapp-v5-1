import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Users,
  Zap,
  Check,
  X,
  Crown,
  Sparkles,
  Building2,
  Gift,
  Euro,
  Clock,
} from "lucide-react";

// Paket-Icons basierend auf Slug
const getPlanIcon = (slug: string) => {
  switch (slug) {
    case "free":
      return <Gift className="h-6 w-6" />;
    case "basic":
      return <Package className="h-6 w-6" />;
    case "pro":
      return <Sparkles className="h-6 w-6" />;
    case "enterprise":
      return <Crown className="h-6 w-6" />;
    default:
      return <Package className="h-6 w-6" />;
  }
};

// Paket-Farben basierend auf Slug
const getPlanColor = (slug: string) => {
  switch (slug) {
    case "free":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "basic":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "pro":
      return "bg-purple-50 text-purple-700 border-purple-300";
    case "enterprise":
      return "bg-amber-50 text-amber-700 border-amber-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

// Leeres Paket-Formular
const emptyPlan = {
  name: "",
  slug: "",
  description: "",
  userLimit: 1 as number | null,
  creditLimit: 100 as number | null,
  priceMonthly: "0.00",
  priceYearly: "0.00",
  currency: "EUR",
  isTrialPlan: false,
  trialDays: 90,
  features: [] as string[],
  isActive: true,
};

export default function AdminPakete() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof emptyPlan & { id?: number }>(emptyPlan);
  const [newFeature, setNewFeature] = useState("");

  // Daten laden
  const { data: plans, isLoading, refetch } = trpc.subscriptionPlans.getAll.useQuery();
  const { data: stats } = trpc.subscriptionPlans.getStats.useQuery();

  // Mutations
  const createMutation = trpc.subscriptionPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Paket erfolgreich erstellt");
      setIsEditorOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.subscriptionPlans.update.useMutation({
    onSuccess: () => {
      toast.success("Paket erfolgreich aktualisiert");
      setIsEditorOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.subscriptionPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Paket erfolgreich gelöscht");
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleStatusMutation = trpc.subscriptionPlans.toggleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.isActive ? "Paket aktiviert" : "Paket deaktiviert");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Neues Paket erstellen
  const handleCreate = () => {
    setSelectedPlan(emptyPlan);
    setIsEditorOpen(true);
  };

  // Paket bearbeiten
  const handleEdit = (plan: any) => {
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      userLimit: plan.userLimit,
      creditLimit: plan.creditLimit,
      priceMonthly: plan.priceMonthly || "0.00",
      priceYearly: plan.priceYearly || "0.00",
      currency: plan.currency || "EUR",
      isTrialPlan: plan.isTrialPlan === 1,
      trialDays: plan.trialDays || 90,
      features: plan.features || [],
      isActive: plan.isActive === 1,
    });
    setIsEditorOpen(true);
  };

  // Paket speichern
  const handleSave = () => {
    if (selectedPlan.id) {
      updateMutation.mutate({
        id: selectedPlan.id,
        ...selectedPlan,
      });
    } else {
      createMutation.mutate(selectedPlan);
    }
  };

  // Feature hinzufügen
  const addFeature = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmedFeature = newFeature.trim();
    if (trimmedFeature && trimmedFeature.length > 0) {
      setSelectedPlan((prev) => ({
        ...prev,
        features: [...prev.features, trimmedFeature],
      }));
      setNewFeature("");
    }
  };

  // Feature entfernen
  const removeFeature = (index: number) => {
    setSelectedPlan({
      ...selectedPlan,
      features: selectedPlan.features.filter((_, i) => i !== index),
    });
  };

  // Statistik für ein Paket finden
  const getStatForPlan = (planId: number) => {
    return stats?.find((s) => s.planId === planId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paket-Verwaltung</h1>
            <p className="text-muted-foreground">
              Erstellen und verwalten Sie Subscription-Pakete für Ihre Kunden
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Paket
          </Button>
        </div>

        {/* Statistik-Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pakete gesamt</p>
                  <p className="text-2xl font-bold">{plans?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Pakete</p>
                  <p className="text-2xl font-bold">
                    {plans?.filter((p) => p.isActive).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Abos</p>
                  <p className="text-2xl font-bold">
                    {stats?.reduce((sum, s) => sum + (s.activeSubscriptions || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Test-Pakete</p>
                  <p className="text-2xl font-bold">
                    {plans?.filter((p) => p.isTrialPlan).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Paket-Karten */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Pakete vorhanden</h3>
              <p className="text-muted-foreground text-center mb-4">
                Erstellen Sie Ihr erstes Subscription-Paket für Ihre Kunden.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Paket erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans?.map((plan) => {
              const stat = getStatForPlan(plan.id);
              return (
                <Card
                  key={plan.id}
                  className={`relative ${!plan.isActive ? "opacity-60" : ""} ${getPlanColor(plan.slug)}`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {plan.isTrialPlan === 1 && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Test
                      </Badge>
                    )}
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/50 rounded-lg">
                        {getPlanIcon(plan.slug)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {plan.slug}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Preis */}
                    <div className="text-center py-2">
                      <span className="text-3xl font-bold">
                        €{parseFloat(plan.priceMonthly || "0").toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/Monat</span>
                      {parseFloat(plan.priceYearly || "0") > 0 && (
                        <p className="text-xs text-muted-foreground">
                          oder €{parseFloat(plan.priceYearly || "0").toFixed(0)}/Jahr
                        </p>
                      )}
                    </div>

                    {/* Limits */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Benutzer
                        </span>
                        <span className="font-medium">
                          {plan.userLimit === null ? "∞" : plan.userLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Credits/Monat
                        </span>
                        <span className="font-medium">
                          {plan.creditLimit === null ? "∞" : plan.creditLimit}
                        </span>
                      </div>
                      {plan.isTrialPlan === 1 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Testphase
                          </span>
                          <span className="font-medium">{plan.trialDays} Tage</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {plan.features && (plan.features as string[]).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Features:</p>
                        <ul className="text-xs space-y-1">
                          {(plan.features as string[]).slice(0, 3).map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                          {(plan.features as string[]).length > 3 && (
                            <li className="text-muted-foreground">
                              +{(plan.features as string[]).length - 3} weitere...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Nutzung */}
                    {stat && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {stat.activeSubscriptions || 0} aktive Abos
                        </p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: plan.id })}
                    >
                      {plan.isActive ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedPlan({ ...emptyPlan, id: plan.id, name: plan.name });
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Editor Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPlan.id ? "Paket bearbeiten" : "Neues Paket erstellen"}
              </DialogTitle>
              <DialogDescription>
                Definieren Sie die Eigenschaften und Limits des Pakets
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Grunddaten */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={selectedPlan.name}
                    onChange={(e) =>
                      setSelectedPlan({ ...selectedPlan, name: e.target.value })
                    }
                    placeholder="z.B. Basic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={selectedPlan.slug}
                    onChange={(e) =>
                      setSelectedPlan({
                        ...selectedPlan,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    placeholder="z.B. basic"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={selectedPlan.description}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, description: e.target.value })
                  }
                  placeholder="Kurze Beschreibung des Pakets..."
                  rows={2}
                />
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Limits
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userLimit">Max. Benutzer</Label>
                    <Input
                      id="userLimit"
                      type="number"
                      value={selectedPlan.userLimit ?? ""}
                      onChange={(e) =>
                        setSelectedPlan({
                          ...selectedPlan,
                          userLimit: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Unbegrenzt"
                    />
                    <p className="text-xs text-muted-foreground">Leer = unbegrenzt</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credits/Monat</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={selectedPlan.creditLimit ?? ""}
                      onChange={(e) =>
                        setSelectedPlan({
                          ...selectedPlan,
                          creditLimit: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Unbegrenzt"
                    />
                    <p className="text-xs text-muted-foreground">Leer = unbegrenzt</p>
                  </div>
                </div>
              </div>

              {/* Preise */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Preise
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceMonthly">Monatlich (€)</Label>
                    <Input
                      id="priceMonthly"
                      type="number"
                      step="0.01"
                      value={selectedPlan.priceMonthly}
                      onChange={(e) =>
                        setSelectedPlan({ ...selectedPlan, priceMonthly: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceYearly">Jährlich (€)</Label>
                    <Input
                      id="priceYearly"
                      type="number"
                      step="0.01"
                      value={selectedPlan.priceYearly}
                      onChange={(e) =>
                        setSelectedPlan({ ...selectedPlan, priceYearly: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Währung</Label>
                    <Input
                      id="currency"
                      value={selectedPlan.currency}
                      onChange={(e) =>
                        setSelectedPlan({ ...selectedPlan, currency: e.target.value })
                      }
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              {/* Test-Paket */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Test-Paket
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Dieses Paket als kostenloses Testpaket markieren
                    </p>
                  </div>
                  <Switch
                    checked={selectedPlan.isTrialPlan}
                    onCheckedChange={(checked) =>
                      setSelectedPlan({ ...selectedPlan, isTrialPlan: checked })
                    }
                  />
                </div>
                {selectedPlan.isTrialPlan && (
                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Testphase (Tage)</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      value={selectedPlan.trialDays}
                      onChange={(e) =>
                        setSelectedPlan({
                          ...selectedPlan,
                          trialDays: parseInt(e.target.value) || 90,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Features</h4>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Neues Feature hinzufügen..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature(e);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => addFeature(e)}
                    disabled={!newFeature.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedPlan.features.length > 0 && (
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                      >
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          {feature}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Paket aktiv</Label>
                  <p className="text-sm text-muted-foreground">
                    Inaktive Pakete werden nicht angezeigt
                  </p>
                </div>
                <Switch
                  checked={selectedPlan.isActive}
                  onCheckedChange={(checked) =>
                    setSelectedPlan({ ...selectedPlan, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !selectedPlan.name ||
                  !selectedPlan.slug ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Speichern..."
                  : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Löschen Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Paket löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie das Paket "{selectedPlan.name}" wirklich löschen? Diese Aktion
                kann nicht rückgängig gemacht werden.
                <br />
                <br />
                <strong>Hinweis:</strong> Pakete mit aktiven Abonnements können nicht
                gelöscht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => selectedPlan.id && deleteMutation.mutate({ id: selectedPlan.id })}
              >
                {deleteMutation.isPending ? "Löschen..." : "Löschen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
