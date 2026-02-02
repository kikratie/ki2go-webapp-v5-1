import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft, Mail, Phone, MapPin, Clock, Send, Building2, 
  CheckCircle2, Loader2 
} from "lucide-react";

export default function Kontakt() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    setIsSubmitting(true);
    
    // Simuliere API-Aufruf (hier könnte später eine echte API angebunden werden)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Ihre Nachricht wurde erfolgreich gesendet!");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </div>
        </header>

        <main className="container py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Vielen Dank für Ihre Nachricht!</h1>
            <p className="text-muted-foreground mb-8">
              Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.
            </p>
            <Button asChild>
              <Link href="/">Zurück zur Startseite</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Kontaktieren Sie uns</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Haben Sie Fragen zu KI2GO oder möchten Sie mehr über unsere Lösungen erfahren? 
            Wir freuen uns auf Ihre Nachricht!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Kontaktformular */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Schreiben Sie uns</CardTitle>
                <CardDescription>
                  Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Ihr Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ihre@email.at"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Unternehmen</Label>
                      <Input
                        id="company"
                        placeholder="Ihr Unternehmen"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+43 1 234 5678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Betreff</Label>
                    <Input
                      id="subject"
                      placeholder="Worum geht es?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nachricht *</Label>
                    <Textarea
                      id="message"
                      placeholder="Ihre Nachricht an uns..."
                      rows={6}
                      className="resize-y"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    * Pflichtfelder. Mit dem Absenden stimmen Sie unserer{" "}
                    <Link href="/datenschutz" className="text-primary hover:underline">
                      Datenschutzerklärung
                    </Link>{" "}
                    zu.
                  </p>

                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Nachricht senden
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Kontaktinformationen */}
          <div className="space-y-6">
            {/* Adresse */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Adresse</h3>
                    <p className="text-muted-foreground text-sm">
                      ProAgentur GmbH<br />
                      August Greimlweg 40<br />
                      1230 Wien, Österreich
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* E-Mail */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-Mail</h3>
                    <a 
                      href="mailto:office@ki2go.io" 
                      className="text-primary hover:underline text-sm"
                    >
                      office@ki2go.io
                    </a>
                    <p className="text-muted-foreground text-sm mt-1">
                      Für allgemeine Anfragen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Telefon */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefon</h3>
                    <a 
                      href="tel:+4315551234" 
                      className="text-primary hover:underline text-sm"
                    >
                      +43 1 555 1234
                    </a>
                    <p className="text-muted-foreground text-sm mt-1">
                      Mo-Fr: 9:00 - 17:00 Uhr
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Öffnungszeiten */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Geschäftszeiten</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Montag - Freitag: 9:00 - 17:00</p>
                      <p>Samstag - Sonntag: Geschlossen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unternehmen */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Unternehmen</h3>
                    <p className="text-muted-foreground text-sm">
                      ProAgentur GmbH<br />
                      FN 632602y<br />
                      UID: ATU81104118
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Karte */}
        <div className="mt-12 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Unser Standort</CardTitle>
              <CardDescription>
                Besuchen Sie uns in Wien - im 23. Bezirk Liesing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2659.8!2d16.355!3d48.188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDExJzE2LjgiTiAxNsKwMjEnMTguMCJF!5e0!3m2!1sde!2sat!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "400px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Standort KI2GO - ProAgentur GmbH"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  August Greimlweg 40, 1230 Wien
                </span>
                <a 
                  href="https://maps.google.com/?q=August+Greimlweg+40,+1230+Wien" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  In Google Maps öffnen →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 KI2GO - ProAgentur GmbH. Alle Rechte vorbehalten.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-foreground transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
