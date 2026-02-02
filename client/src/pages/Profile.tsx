import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  User, Mail, Shield, Clock, Calendar, Save, 
  Building, Euro, AlertCircle, MapPin, Phone,
  Briefcase, Globe, Download, Trash2, FileText, Loader2,
  Pencil, X, Building2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Lade Profil-Daten
  const { data: profile, isLoading: profileLoading, refetch } = trpc.user.getProfile.useQuery();
  const { data: options } = trpc.user.getOptions.useQuery();
  
  // Mutations
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil erfolgreich aktualisiert");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Speichern");
    },
  });

  const exportData = trpc.user.exportMyData.useMutation({
    onSuccess: (data) => {
      // Download als JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ki2go-daten-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Daten erfolgreich exportiert");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Export");
    },
  });

  const requestDeletion = trpc.user.requestDeletion.useMutation({
    onSuccess: () => {
      toast.success("Löschantrag wurde eingereicht. Sie erhalten eine Bestätigung per E-Mail.");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Löschantrag");
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    userType: "business" as "business" | "private",
    companyName: "",
    position: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Österreich",
    industry: "",
    howFound: "",
    hourlyRate: "50",
  });

  // Initialisiere Formular mit Profil-Daten
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        userType: (profile as any).userType || "business",
        companyName: profile.companyName || "",
        position: profile.position || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        country: profile.country || "Österreich",
        industry: profile.industry || "",
        howFound: profile.howFound || "",
        hourlyRate: "50",
      });
    }
  }, [profile]);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner': return { label: 'Owner', variant: 'default' as const };
      case 'admin': return { label: 'Administrator', variant: 'secondary' as const };
      default: return { label: 'Benutzer', variant: 'outline' as const };
    }
  };

  const roleInfo = getRoleLabel(user?.role);

  const handleSave = () => {
    updateProfile.mutate({
      name: formData.name || undefined,
      userType: formData.userType,
      companyName: formData.companyName || undefined,
      position: formData.position || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postalCode: formData.postalCode || undefined,
      country: formData.country,
      industry: formData.industry || undefined,
      howFound: formData.howFound || undefined,
    });
  };

  const handleCancel = () => {
    // Formular zurücksetzen auf Original-Daten
    if (profile) {
      setFormData({
        name: profile.name || "",
        userType: (profile as any).userType || "business",
        companyName: profile.companyName || "",
        position: profile.position || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        country: profile.country || "Österreich",
        industry: profile.industry || "",
        howFound: profile.howFound || "",
        hourlyRate: "50",
      });
    }
    setIsEditing(false);
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Profil-Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre persönlichen Informationen und Einstellungen
          </p>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2">
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {formData.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{formData.name || user?.name || 'Benutzer'}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user?.email || '-'}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={roleInfo.variant}>
                      <Shield className="h-3 w-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                    {formData.userType && (
                      <Badge variant="outline">
                        {formData.userType === "business" ? (
                          <><Building2 className="h-3 w-3 mr-1" />Unternehmen</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" />Privatperson</>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {activeTab === "profile" && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button 
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateProfile.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={updateProfile.isPending}
                      >
                        {updateProfile.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Speichern
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
            <TabsTrigger value="privacy">Datenschutz</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            
            {/* User Type Selection - nur im Bearbeitungsmodus */}
            {isEditing && (
              <Card className="border-[#5FBDCE]/30 bg-[#5FBDCE]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
                    <Building2 className="h-5 w-5" />
                    Kontotyp
                  </CardTitle>
                  <CardDescription>
                    Wählen Sie, wie Sie KI2GO nutzen möchten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.userType}
                    onValueChange={(value: "business" | "private") => 
                      setFormData(prev => ({ 
                        ...prev, 
                        userType: value,
                        // Bei Wechsel zu Privat: Firmenname auf "Privat" setzen
                        companyName: value === "private" ? "Privat" : prev.companyName
                      }))
                    }
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.userType === "business" 
                        ? "border-[#5FBDCE] bg-white" 
                        : "border-gray-200 hover:border-[#5FBDCE]/50 bg-white"
                    }`}>
                      <RadioGroupItem value="business" id="business" />
                      <Label htmlFor="business" className="cursor-pointer flex items-center gap-2 flex-1">
                        <Building2 className={`h-5 w-5 ${formData.userType === "business" ? "text-[#5FBDCE]" : "text-gray-400"}`} />
                        <div>
                          <p className="font-medium">Unternehmen / Selbstständig</p>
                          <p className="text-xs text-gray-500">Geschäftliche Nutzung</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.userType === "private" 
                        ? "border-[#5FBDCE] bg-white" 
                        : "border-gray-200 hover:border-[#5FBDCE]/50 bg-white"
                    }`}>
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="cursor-pointer flex items-center gap-2 flex-1">
                        <User className={`h-5 w-5 ${formData.userType === "private" ? "text-[#5FBDCE]" : "text-gray-400"}`} />
                        <div>
                          <p className="font-medium">Privatperson</p>
                          <p className="text-xs text-gray-500">Private Nutzung</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Persönliche Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Ihr Name"
                      className={!isEditing ? "bg-muted" : ""}
                    />
                    {!isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Klicken Sie auf "Bearbeiten" um Ihren Namen zu ändern
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Die E-Mail-Adresse kann nicht geändert werden
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">
                      <Building className="h-4 w-4 inline mr-1" />
                      {formData.userType === "business" ? "Firmenname *" : "Firma (optional)"}
                    </Label>
                    <Input
                      id="company"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      disabled={!isEditing || formData.userType === "private"}
                      placeholder={formData.userType === "business" ? "Ihr Unternehmen" : "Privat"}
                      className={(!isEditing || formData.userType === "private") ? "bg-muted" : ""}
                    />
                    {formData.userType === "private" && (
                      <p className="text-xs text-muted-foreground">
                        Bei Privatpersonen wird "Privat" angezeigt
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Position / Beruf
                    </Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      disabled={!isEditing}
                      placeholder="z.B. Geschäftsführer, Controller"
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+43 1 234 5678"
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Branche</Label>
                    {isEditing ? (
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => setFormData({ ...formData, industry: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Branche wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {options?.industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.industry || "-"}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howFound">Wie haben Sie von uns erfahren?</Label>
                  {isEditing ? (
                    <Select
                      value={formData.howFound}
                      onValueChange={(value) => setFormData({ ...formData, howFound: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.howFoundOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.howFound || "-"}
                      disabled
                      className="bg-muted"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Straße und Hausnummer</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Musterstraße 123"
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">PLZ</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      disabled={!isEditing}
                      placeholder="1050"
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="city">Stadt</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Wien"
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Land
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Österreich">Österreich</SelectItem>
                          <SelectItem value="Deutschland">Deutschland</SelectItem>
                          <SelectItem value="Schweiz">Schweiz</SelectItem>
                          <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.country || "Österreich"}
                        disabled
                        className="bg-muted"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Account-Informationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Registriert:</span>
                    <span>{formatDate(profile?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Letzte Aktualisierung:</span>
                    <span>{formatDate(profile?.updatedAt)}</span>
                  </div>
                  {profile?.termsAcceptedAt && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">AGB akzeptiert:</span>
                      <span>{formatDate(profile.termsAcceptedAt)}</span>
                    </div>
                  )}
                  {profile?.privacyAcceptedAt && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Datenschutz akzeptiert:</span>
                      <span>{formatDate(profile.privacyAcceptedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  ROI-Einstellungen
                </CardTitle>
                <CardDescription>
                  Konfigurieren Sie Ihre Einstellungen für die ROI-Berechnung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Ihr Stundensatz (€)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      className="max-w-[150px]"
                    />
                    <span className="text-muted-foreground">€ / Stunde</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dieser Wert wird verwendet, um die Zeitersparnis in Euro umzurechnen
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organisation</CardTitle>
                <CardDescription>
                  Informationen zu Ihrer Organisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.organization ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{profile.organization.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sie sind Mitglied dieser Organisation
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Sie sind keiner Organisation zugeordnet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Datenexport (DSGVO Art. 20)
                </CardTitle>
                <CardDescription>
                  Laden Sie alle Ihre gespeicherten Daten herunter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Gemäß DSGVO haben Sie das Recht, eine Kopie Ihrer personenbezogenen Daten 
                  in einem maschinenlesbaren Format zu erhalten.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => exportData.mutate()}
                  disabled={exportData.isPending}
                >
                  {exportData.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Meine Daten exportieren
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Konto löschen (DSGVO Art. 17)
                </CardTitle>
                <CardDescription>
                  Beantragen Sie die Löschung Ihres Kontos und aller zugehörigen Daten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-destructive">Achtung: Diese Aktion ist unwiderruflich!</p>
                        <p className="text-muted-foreground mt-1">
                          Bei der Löschung werden alle Ihre Daten, Dokumente und Ausführungshistorie 
                          unwiderruflich entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.
                        </p>
                      </div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Konto-Löschung beantragen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten, 
                          Dokumente und die gesamte Nutzungshistorie werden unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => requestDeletion.mutate({ confirmEmail: user?.email || "" })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {requestDeletion.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Ja, Konto löschen"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rechtliche Dokumente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="/agb" 
                  target="_blank" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Allgemeine Geschäftsbedingungen
                </a>
                <a 
                  href="/datenschutz" 
                  target="_blank" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Shield className="h-4 w-4" />
                  Datenschutzerklärung
                </a>
                <a 
                  href="/impressum" 
                  target="_blank" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Building className="h-4 w-4" />
                  Impressum
                </a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
