import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Briefcase, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const industries = [
  "IT & Software",
  "Beratung & Consulting",
  "Finanzdienstleistungen",
  "Handel & E-Commerce",
  "Produktion & Industrie",
  "Gesundheitswesen",
  "Immobilien",
  "Recht & Steuern",
  "Marketing & Medien",
  "Bildung & Forschung",
  "Sonstige",
];

const employeeCounts = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");

  const registerMutation = trpc.onboarding.registerCompany.useMutation({
    onSuccess: (data) => {
      setStep(3);
      toast.success("Firma erfolgreich registriert!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!companyName.trim()) {
      toast.error("Bitte geben Sie einen Firmennamen ein");
      return;
    }
    registerMutation.mutate({
      companyName: companyName.trim(),
      industry: industry || undefined,
      employeeCount: employeeCount || undefined,
    });
  };

  // Lade-Zustand
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  // Nicht eingeloggt
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#5FBDCE]/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-[#5FBDCE]" />
            </div>
            <CardTitle className="text-2xl">Anmeldung erforderlich</CardTitle>
            <CardDescription>
              Bitte melden Sie sich an, um Ihre Firma zu registrieren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/")}
            >
              Zur Anmeldung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bereits registriert
  if (user.organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Bereits registriert</CardTitle>
            <CardDescription>
              Sie gehören bereits einer Organisation an.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/aufgaben")}
            >
              Zu den Aufgaben
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate("/firma/dashboard")}
            >
              Zum Firmen-Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
            Willkommen bei KI2GO
          </h1>
          <p className="text-gray-600">
            Registrieren Sie Ihre Firma und starten Sie Ihre kostenlose Testphase.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? "bg-[#5FBDCE] text-white" : "bg-gray-200 text-gray-500"}`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? "bg-[#5FBDCE]" : "bg-gray-200"}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? "bg-[#5FBDCE] text-white" : "bg-gray-200 text-gray-500"}`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? "bg-[#5FBDCE]" : "bg-gray-200"}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? "bg-[#5FBDCE] text-white" : "bg-gray-200 text-gray-500"}`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Firmenname */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#5FBDCE]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-[#5FBDCE]" />
                </div>
                <div>
                  <CardTitle>Ihre Firma</CardTitle>
                  <CardDescription>Wie heißt Ihre Firma?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Firmenname *</Label>
                <Input
                  id="companyName"
                  placeholder="z.B. Musterfirma GmbH"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-lg"
                />
              </div>

              <Button 
                className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                onClick={() => {
                  if (!companyName.trim()) {
                    toast.error("Bitte geben Sie einen Firmennamen ein");
                    return;
                  }
                  setStep(2);
                }}
              >
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#5FBDCE]/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-[#5FBDCE]" />
                </div>
                <div>
                  <CardTitle>Weitere Details</CardTitle>
                  <CardDescription>Diese Angaben sind optional, helfen uns aber, Sie besser zu unterstützen.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Branche</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branche auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Anzahl Mitarbeiter</Label>
                <Select value={employeeCount} onValueChange={setEmployeeCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiteranzahl auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeCounts.map((count) => (
                      <SelectItem key={count} value={count}>{count}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Zurück
                </Button>
                <Button 
                  className="flex-1 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird registriert...
                    </>
                  ) : (
                    <>
                      Firma registrieren
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Erfolg */}
        {step === 3 && registerMutation.data && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Willkommen bei KI2GO!</CardTitle>
              <CardDescription className="text-base">
                Ihre Firma <strong>{registerMutation.data.organizationName}</strong> wurde erfolgreich registriert.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test-Paket Info */}
              <div className="bg-[#5FBDCE]/10 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-[#1E3A5F]">Ihre Testphase</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    {registerMutation.data.trialDays} Tage kostenlos testen
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Alle Aufgaben verfügbar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Unbegrenzte Ausführungen
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Mitarbeiter einladen
                  </li>
                </ul>
              </div>

              {/* Nächste Schritte */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#1E3A5F]">Nächste Schritte</h3>
                <div className="grid gap-3">
                  <Button 
                    className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 justify-start"
                    onClick={() => navigate("/aufgaben")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aufgaben entdecken
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/firma/users")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Mitarbeiter einladen
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/firma/dashboard")}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Firmen-Dashboard öffnen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {step < 3 && (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="w-10 h-10 bg-[#5FBDCE]/10 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5 text-[#5FBDCE]" />
              </div>
              <h3 className="font-semibold text-[#1E3A5F] mb-1">90 Tage kostenlos</h3>
              <p className="text-sm text-gray-600">Testen Sie alle Funktionen ohne Risiko.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="w-10 h-10 bg-[#5FBDCE]/10 rounded-lg flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-[#5FBDCE]" />
              </div>
              <h3 className="font-semibold text-[#1E3A5F] mb-1">Team einladen</h3>
              <p className="text-sm text-gray-600">Laden Sie Ihre Mitarbeiter ein.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="w-10 h-10 bg-[#5FBDCE]/10 rounded-lg flex items-center justify-center mb-3">
                <Briefcase className="h-5 w-5 text-[#5FBDCE]" />
              </div>
              <h3 className="font-semibold text-[#1E3A5F] mb-1">Alle Aufgaben</h3>
              <p className="text-sm text-gray-600">Zugriff auf alle verfügbaren Aufgaben.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
