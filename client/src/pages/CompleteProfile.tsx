import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Building2, User, Phone, MapPin, Briefcase, CheckCircle2, UserCircle, Check, AlertCircle } from "lucide-react";

// Inline-Validierung Komponente
const ValidationIcon = ({ isValid, showWhen }: { isValid: boolean; showWhen: boolean }) => {
  if (!showWhen) return null;
  return isValid ? (
    <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
  ) : (
    <AlertCircle className="h-5 w-5 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2" />
  );
};

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  // Prüfen ob Profil bereits vollständig
  const { data: profileCheck, isLoading: checkLoading } = trpc.user.checkProfileComplete.useQuery();
  const { data: options } = trpc.user.getOptions.useQuery();
  const { data: currentProfile } = trpc.user.getProfile.useQuery();
  
  const completeProfileMutation = trpc.user.completeProfile.useMutation({
    onSuccess: () => {
      utils.user.checkProfileComplete.invalidate();
      utils.user.getProfile.invalidate();
      utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
  });

  // Formular-State
  const [formData, setFormData] = useState({
    userType: "business" as "business" | "private",
    displayName: "",
    companyName: "",
    position: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Österreich",
    industry: "",
    howFound: "",
    termsAndPrivacyAccepted: false, // Kombiniert AGB + Datenschutz
  });

  // Touched-State für Inline-Validierung (zeigt Validierung erst nach Interaktion)
  const [touched, setTouched] = useState({
    displayName: false,
    companyName: false,
  });

  // Vorausfüllen wenn Daten vorhanden
  useEffect(() => {
    if (currentProfile) {
      setFormData(prev => ({
        ...prev,
        userType: (currentProfile as any).userType || "business",
        displayName: currentProfile.name || "",
        companyName: currentProfile.companyName || "",
        position: currentProfile.position || "",
        phone: currentProfile.phone || "",
        address: currentProfile.address || "",
        city: currentProfile.city || "",
        postalCode: currentProfile.postalCode || "",
        country: currentProfile.country || "Österreich",
        industry: currentProfile.industry || "",
        howFound: currentProfile.howFound || "",
        termsAndPrivacyAccepted: !!(currentProfile.termsAcceptedAt && currentProfile.privacyAcceptedAt),
      }));
    }
  }, [currentProfile]);

  // Redirect wenn Profil bereits vollständig
  useEffect(() => {
    if (profileCheck?.complete) {
      setLocation("/dashboard");
    }
  }, [profileCheck, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeProfileMutation.mutate({
      ...formData,
      // Beide Felder werden auf den kombinierten Wert gesetzt
      termsAccepted: formData.termsAndPrivacyAccepted,
      privacyAccepted: formData.termsAndPrivacyAccepted,
    });
  };

  // Validierungslogik
  const isNameValid = formData.displayName.length >= 2;
  const isCompanyValid = formData.userType === "private" || formData.companyName.length >= 2;
  
  // Formular ist gültig wenn alle Pflichtfelder ausgefüllt sind
  const isFormValid = isNameValid && isCompanyValid && formData.termsAndPrivacyAccepted;

  if (checkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#0f1f33]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0f1f33] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logoKi2Go.jpg" 
            alt="KI2GO" 
            className="h-16 mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-white">Willkommen bei KI2GO</h1>
          <p className="text-gray-300 mt-2">
            Bitte vervollständigen Sie Ihr Profil, um fortzufahren
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-[#5FBDCE]" />
              Profil vervollständigen
            </CardTitle>
            <CardDescription>
              Nur 2 Pflichtfelder - schnell erledigt!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* User-Typ Auswahl */}
              <div className="space-y-4 p-4 bg-[#5FBDCE]/5 rounded-lg border border-[#5FBDCE]/20">
                <h3 className="font-medium text-[#1E3A5F]">Ich nutze KI2GO als... *</h3>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value: "business" | "private") => 
                    setFormData(prev => ({ ...prev, userType: value }))
                  }
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.userType === "business" 
                      ? "border-[#5FBDCE] bg-[#5FBDCE]/10" 
                      : "border-gray-200 hover:border-[#5FBDCE]/50"
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
                      ? "border-[#5FBDCE] bg-[#5FBDCE]/10" 
                      : "border-gray-200 hover:border-[#5FBDCE]/50"
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
              </div>

              {/* Pflichtfelder mit Inline-Validierung */}
              <div className="space-y-4 p-4 bg-[#1E3A5F]/5 rounded-lg border border-[#1E3A5F]/10">
                <h3 className="font-medium text-[#1E3A5F] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Pflichtangaben
                </h3>
                
                {/* Name - IMMER Pflicht - MIT INLINE-VALIDIERUNG */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-[#1E3A5F] font-medium">
                    Ihr Name *
                  </Label>
                  <div className="relative">
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      onBlur={() => setTouched(prev => ({ ...prev, displayName: true }))}
                      placeholder="Max Mustermann"
                      required
                      className={`pr-10 transition-all ${
                        touched.displayName 
                          ? isNameValid 
                            ? "border-green-500 focus:border-green-500 bg-green-50/50" 
                            : "border-amber-500 focus:border-amber-500 bg-amber-50/50"
                          : "border-[#1E3A5F]/20 focus:border-[#5FBDCE] bg-white"
                      }`}
                    />
                    <ValidationIcon isValid={isNameValid} showWhen={touched.displayName || formData.displayName.length > 0} />
                  </div>
                  <p className={`text-xs transition-colors ${
                    touched.displayName && !isNameValid ? "text-amber-600" : "text-gray-500"
                  }`}>
                    {touched.displayName && !isNameValid 
                      ? "Bitte geben Sie mindestens 2 Zeichen ein" 
                      : "Wie sollen wir Sie ansprechen?"}
                  </p>
                </div>

                {/* Firmenname - nur bei Business - MIT INLINE-VALIDIERUNG */}
                {formData.userType === "business" && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-[#1E3A5F] font-medium">
                      Firmenname *
                    </Label>
                    <div className="relative">
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        onBlur={() => setTouched(prev => ({ ...prev, companyName: true }))}
                        placeholder="Ihre Firma GmbH"
                        required
                        className={`pr-10 transition-all ${
                          touched.companyName 
                            ? isCompanyValid 
                              ? "border-green-500 focus:border-green-500 bg-green-50/50" 
                              : "border-amber-500 focus:border-amber-500 bg-amber-50/50"
                            : "border-[#1E3A5F]/20 focus:border-[#5FBDCE] bg-white"
                        }`}
                      />
                      <ValidationIcon isValid={isCompanyValid} showWhen={touched.companyName || formData.companyName.length > 0} />
                    </div>
                    {touched.companyName && !isCompanyValid && (
                      <p className="text-xs text-amber-600">
                        Bitte geben Sie mindestens 2 Zeichen ein
                      </p>
                    )}
                  </div>
                )}

                {/* Info bei Privatperson */}
                {formData.userType === "private" && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      Als Privatperson können Sie KI2GO für persönliche Aufgaben nutzen. 
                      Ihr Account wird als "Privat" gekennzeichnet.
                    </p>
                  </div>
                )}

                {/* KOMBINIERTE AGB + Datenschutz Checkbox */}
                <div className="pt-4 mt-4 border-t border-[#1E3A5F]/10">
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, termsAndPrivacyAccepted: !prev.termsAndPrivacyAccepted }))}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.termsAndPrivacyAccepted 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-300 bg-gray-50 hover:border-[#5FBDCE]"
                    }`}
                  >
                    <div 
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        formData.termsAndPrivacyAccepted 
                          ? "bg-green-500 border-green-500" 
                          : "bg-white border-gray-400"
                      }`}
                    >
                      {formData.termsAndPrivacyAccepted && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${formData.termsAndPrivacyAccepted ? "text-green-700" : "text-gray-700"}`}>
                        AGB und Datenschutzerklärung akzeptieren *
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ich akzeptiere die{" "}
                        <a 
                          href="/agb" 
                          target="_blank" 
                          className="text-[#5FBDCE] hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Allgemeinen Geschäftsbedingungen
                        </a>
                        {" "}und habe die{" "}
                        <a 
                          href="/datenschutz" 
                          target="_blank" 
                          className="text-[#5FBDCE] hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Datenschutzerklärung
                        </a>
                        {" "}gelesen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optionale Felder */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Optionale Angaben
                  <span className="text-xs text-gray-400 font-normal">(können später ergänzt werden)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Position */}
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="z.B. Geschäftsführer"
                      className="bg-white"
                    />
                  </div>

                  {/* Telefon */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+43 1 234 5678"
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Branche */}
                {formData.userType === "business" && options?.industries && (
                  <div className="space-y-2">
                    <Label htmlFor="industry">Branche</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Branche auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Wie gefunden */}
                {options?.howFoundOptions && (
                  <div className="space-y-2">
                    <Label htmlFor="howFound">Wie haben Sie von KI2GO erfahren?</Label>
                    <Select
                      value={formData.howFound}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, howFound: value }))}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Bitte auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.howFoundOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Fehler-Anzeige */}
              {completeProfileMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {completeProfileMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid || completeProfileMutation.isPending}
                className="w-full ki2go-button-primary h-12 text-lg"
              >
                {completeProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Profil speichern und starten
                  </>
                )}
              </Button>

              {/* Fortschrittsanzeige */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className={`w-3 h-3 rounded-full ${isNameValid ? "bg-green-500" : "bg-gray-300"}`} />
                <div className={`w-3 h-3 rounded-full ${isCompanyValid ? "bg-green-500" : "bg-gray-300"}`} />
                <div className={`w-3 h-3 rounded-full ${formData.termsAndPrivacyAccepted ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="ml-2">
                  {[isNameValid, isCompanyValid, formData.termsAndPrivacyAccepted].filter(Boolean).length}/3 erledigt
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
