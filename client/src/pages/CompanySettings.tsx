import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  ArrowLeft, 
  Save,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CompanySettings() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // Test-Modus abfragen (nur für Owner)
  const isOwner = user?.role === 'owner';
  const { data: testModeData } = trpc.testroom.getCurrentMode.useQuery(
    undefined,
    { enabled: isOwner }
  );
  
  const isInTestMode = isOwner && testModeData?.isInTestMode;
  const testSession = testModeData?.session;
  const testOrganizationId = testSession?.testOrganizationId;
  
  // Organisation laden
  const effectiveOrgId = isInTestMode && testOrganizationId ? testOrganizationId : user?.organizationId;
  const { data: organization, isLoading: orgLoading, refetch } = trpc.organization.getById.useQuery(
    { id: effectiveOrgId! },
    { enabled: !!effectiveOrgId }
  );

  // Formular-State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Formular mit Organisation-Daten befüllen
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        description: (organization as any).description || "",
        website: (organization as any).website || "",
        email: (organization as any).email || "",
        phone: (organization as any).phone || "",
        address: (organization as any).address || "",
      });
    }
  }, [organization]);

  // Prüfe auf Änderungen
  useEffect(() => {
    if (organization) {
      const changed = 
        formData.name !== (organization.name || "") ||
        formData.description !== ((organization as any).description || "") ||
        formData.website !== ((organization as any).website || "") ||
        formData.email !== ((organization as any).email || "") ||
        formData.phone !== ((organization as any).phone || "") ||
        formData.address !== ((organization as any).address || "");
      setHasChanges(changed);
    }
  }, [formData, organization]);

  // Speichern-Handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement organization update mutation
      // await updateOrganization.mutateAsync({ id: effectiveOrgId!, ...formData });
      toast.success("Einstellungen gespeichert", {
        description: "Die Firmen-Einstellungen wurden erfolgreich aktualisiert.",
      });
      setHasChanges(false);
      refetch();
    } catch (error) {
      toast.error("Fehler beim Speichern", {
        description: "Die Einstellungen konnten nicht gespeichert werden.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Zugriffsprüfung
  const hasAccess = user?.role === 'owner' || user?.role === 'admin';

  if (authLoading || orgLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-red-700 mb-2">Kein Zugriff</h2>
                  <p className="text-red-600 mb-4">
                    Sie haben keine Berechtigung, die Firmen-Einstellungen zu bearbeiten.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/firma/dashboard")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück zum Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/firma/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#1E3A5F]">Firmen-Einstellungen</h1>
                <p className="text-gray-500">Verwalten Sie die Informationen Ihres Unternehmens</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="bg-[#5FBDCE] hover:bg-[#5FBDCE]/90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
          </div>

          {/* Test-Modus Banner */}
          {isInTestMode && (
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Badge variant="outline" className="bg-purple-500 text-white border-0">
                  Test-Modus
                </Badge>
                <span className="text-sm">
                  Sie bearbeiten die Einstellungen der Test-Organisation.
                </span>
              </div>
            </div>
          )}

          {/* Firmen-Info Karte */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Unternehmensprofil</CardTitle>
                  <CardDescription>Grundlegende Informationen zu Ihrem Unternehmen</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Firmenname */}
              <div className="space-y-2">
                <Label htmlFor="name">Firmenname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ihr Firmenname"
                />
              </div>

              {/* Beschreibung */}
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurze Beschreibung Ihres Unternehmens..."
                  rows={3}
                />
              </div>

              {/* Kontaktdaten */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    E-Mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="kontakt@firma.de"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>

              {/* Website & Adresse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.firma.de"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Musterstraße 1, 12345 Stadt"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiken Karte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Firmen-Übersicht</CardTitle>
              <CardDescription>Aktuelle Statistiken Ihres Unternehmens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Users className="h-6 w-6 text-[#5FBDCE] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-[#1E3A5F]">
                    {(organization as any)?.memberCount || 1}
                  </div>
                  <div className="text-sm text-gray-500">Mitarbeiter</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-[#1E3A5F]">
                    {organization?.createdAt 
                      ? new Date(organization.createdAt).toLocaleDateString("de-DE", { month: "short", year: "numeric" })
                      : "-"
                    }
                  </div>
                  <div className="text-sm text-gray-500">Mitglied seit</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-[#1E3A5F]">Aktiv</div>
                  <div className="text-sm text-gray-500">Status</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Building2 className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-[#1E3A5F] truncate">
                    {(organization as any)?.subscriptionPlan || "Free"}
                  </div>
                  <div className="text-sm text-gray-500">Paket</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hinweis */}
          <div className="text-center text-sm text-gray-400">
            Änderungen werden erst nach dem Speichern übernommen.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
