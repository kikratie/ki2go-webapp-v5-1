import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Mail, Phone, MapPin } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/Ki2GoSymbol.jpg" alt="KI2GO" className="h-8 w-8 rounded-lg" />
              <span className="font-bold text-[#1E3A5F]">KI2GO</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E3A5F]/10 mb-6">
              <Shield className="h-8 w-8 text-[#1E3A5F]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">
              Datenschutzerklärung
            </h1>
            <p className="text-gray-600">
              Gültig ab: 1. Januar 2025 | Version 1.0
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="font-semibold text-lg mb-4 text-[#1E3A5F]">Inhaltsverzeichnis</h2>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <a href="#verantwortlicher" className="text-[#5FBDCE] hover:underline">1. Verantwortlicher</a>
              <a href="#erhobene-daten" className="text-[#5FBDCE] hover:underline">2. Erhobene Daten</a>
              <a href="#zweck" className="text-[#5FBDCE] hover:underline">3. Zweck der Verarbeitung</a>
              <a href="#rechtsgrundlage" className="text-[#5FBDCE] hover:underline">4. Rechtsgrundlage</a>
              <a href="#speicherdauer" className="text-[#5FBDCE] hover:underline">5. Speicherdauer</a>
              <a href="#empfaenger" className="text-[#5FBDCE] hover:underline">6. Empfänger der Daten</a>
              <a href="#ki-verarbeitung" className="text-[#5FBDCE] hover:underline">7. KI-Verarbeitung</a>
              <a href="#cookies" className="text-[#5FBDCE] hover:underline">8. Cookies</a>
              <a href="#rechte" className="text-[#5FBDCE] hover:underline">9. Ihre Rechte</a>
              <a href="#kontakt" className="text-[#5FBDCE] hover:underline">10. Kontakt</a>
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl p-8 shadow-sm space-y-8">
            
            <section id="verantwortlicher">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">1. Verantwortlicher</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist:</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-medium">ProAgentur GmbH</p>
                  <p>August Greimlweg 40</p>
                  <p>1230 Wien, Österreich</p>
                  <p className="mt-2">E-Mail: datenschutz@ki2go.at</p>
                  <p>Telefon: +43 1 234 5678</p>
                </div>
              </div>
            </section>

            <section id="erhobene-daten">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">2. Erhobene Daten</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Wir erheben und verarbeiten folgende Kategorien personenbezogener Daten:</p>
                
                <h3 className="font-semibold text-[#1E3A5F] mt-6">2.1 Registrierungsdaten</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name und E-Mail-Adresse</li>
                  <li>Firmenname (bei Geschäftskunden)</li>
                  <li>Position und Kontaktdaten</li>
                  <li>Branche und Unternehmensgröße</li>
                </ul>

                <h3 className="font-semibold text-[#1E3A5F] mt-6">2.2 Nutzungsdaten</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Anmeldezeitpunkte und -häufigkeit</li>
                  <li>Genutzte Funktionen und Aufgaben</li>
                  <li>Hochgeladene Dokumente (verschlüsselt)</li>
                  <li>Generierte Ergebnisse</li>
                </ul>

                <h3 className="font-semibold text-[#1E3A5F] mt-6">2.3 Technische Daten</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP-Adresse (anonymisiert)</li>
                  <li>Browser-Typ und -Version</li>
                  <li>Betriebssystem</li>
                  <li>Referrer-URL</li>
                </ul>
              </div>
            </section>

            <section id="zweck">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">3. Zweck der Verarbeitung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Wir verarbeiten Ihre Daten für folgende Zwecke:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Vertragserfüllung:</strong> Bereitstellung der KI2GO-Plattform und ihrer Funktionen</li>
                  <li><strong>Kontoverwaltung:</strong> Verwaltung Ihres Benutzerkontos und Ihrer Einstellungen</li>
                  <li><strong>Kommunikation:</strong> Beantwortung von Anfragen und Support</li>
                  <li><strong>Verbesserung:</strong> Analyse und Optimierung unserer Dienste</li>
                  <li><strong>Sicherheit:</strong> Schutz vor Missbrauch und Betrug</li>
                  <li><strong>Rechtliche Pflichten:</strong> Erfüllung gesetzlicher Aufbewahrungspflichten</li>
                </ul>
              </div>
            </section>

            <section id="rechtsgrundlage">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">4. Rechtsgrundlage</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Die Verarbeitung Ihrer Daten erfolgt auf Basis folgender Rechtsgrundlagen:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Erfüllung des Nutzungsvertrags</li>
                  <li><strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Ihre Einwilligung (z.B. für Newsletter)</li>
                  <li><strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Erfüllung rechtlicher Verpflichtungen</li>
                  <li><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigte Interessen (z.B. Sicherheit, Analyse)</li>
                </ul>
              </div>
            </section>

            <section id="speicherdauer">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">5. Speicherdauer</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Wir speichern Ihre Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist 
                  oder gesetzliche Aufbewahrungsfristen bestehen.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Kontodaten:</strong> Bis zur Löschung des Kontos + 30 Tage Karenzzeit</li>
                  <li><strong>Nutzungsdaten:</strong> 24 Monate nach letzter Aktivität</li>
                  <li><strong>Rechnungsdaten:</strong> 7 Jahre (gesetzliche Aufbewahrungspflicht)</li>
                  <li><strong>Hochgeladene Dokumente:</strong> 90 Tage nach Verarbeitung (automatische Löschung)</li>
                </ul>
                <p>
                  Nach Ablauf der Speicherdauer werden die Daten sicher gelöscht oder anonymisiert.
                </p>
              </div>
            </section>

            <section id="empfaenger">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">6. Empfänger der Daten</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Ihre Daten werden an folgende Kategorien von Empfängern weitergegeben:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Hosting-Provider:</strong> Server innerhalb der EU (ISO 27001 zertifiziert)</li>
                  <li><strong>Zahlungsdienstleister:</strong> Zur Abwicklung von Zahlungen</li>
                  <li><strong>KI-Dienste:</strong> Zur Verarbeitung von Aufgaben (siehe Abschnitt 7)</li>
                  <li><strong>Behörden:</strong> Bei gesetzlicher Verpflichtung</li>
                </ul>
                <p>
                  Eine Übermittlung in Drittländer außerhalb der EU erfolgt nur mit angemessenen 
                  Garantien (z.B. Standardvertragsklauseln).
                </p>
              </div>
            </section>

            <section id="ki-verarbeitung">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">7. KI-Verarbeitung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  KI2GO nutzt künstliche Intelligenz zur Bearbeitung Ihrer Aufgaben. Dabei gelten 
                  besondere Datenschutzmaßnahmen:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ihre Daten werden <strong>nicht</strong> zum Training von KI-Modellen verwendet</li>
                  <li>Die Verarbeitung erfolgt auf Servern innerhalb der EU</li>
                  <li>Hochgeladene Dokumente werden nach der Verarbeitung automatisch gelöscht</li>
                  <li>Es erfolgt keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO</li>
                </ul>
                <p>
                  Die KI-generierten Ergebnisse werden nur für Sie erstellt und nicht mit anderen 
                  Nutzern geteilt.
                </p>
              </div>
            </section>

            <section id="cookies">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">8. Cookies</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Wir verwenden folgende Arten von Cookies:</p>
                
                <h3 className="font-semibold text-[#1E3A5F] mt-4">Notwendige Cookies</h3>
                <p>
                  Diese Cookies sind für den Betrieb der Plattform erforderlich (z.B. Session-Cookies 
                  für die Anmeldung). Sie können nicht deaktiviert werden.
                </p>

                <h3 className="font-semibold text-[#1E3A5F] mt-4">Analyse-Cookies</h3>
                <p>
                  Mit Ihrer Einwilligung verwenden wir Analyse-Cookies, um die Nutzung unserer 
                  Plattform zu verstehen und zu verbessern. Diese können Sie jederzeit in den 
                  Einstellungen deaktivieren.
                </p>
              </div>
            </section>

            <section id="rechte">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">9. Ihre Rechte</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Auskunft (Art. 15 DSGVO):</strong> Recht auf Information über Ihre gespeicherten Daten</li>
                  <li><strong>Berichtigung (Art. 16 DSGVO):</strong> Recht auf Korrektur unrichtiger Daten</li>
                  <li><strong>Löschung (Art. 17 DSGVO):</strong> Recht auf Löschung Ihrer Daten ("Recht auf Vergessenwerden")</li>
                  <li><strong>Einschränkung (Art. 18 DSGVO):</strong> Recht auf Einschränkung der Verarbeitung</li>
                  <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Recht auf Export Ihrer Daten</li>
                  <li><strong>Widerspruch (Art. 21 DSGVO):</strong> Recht auf Widerspruch gegen die Verarbeitung</li>
                  <li><strong>Widerruf (Art. 7 DSGVO):</strong> Recht auf Widerruf erteilter Einwilligungen</li>
                </ul>
                <p>
                  Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter datenschutz@ki2go.at. 
                  Sie haben außerdem das Recht, eine Beschwerde bei der zuständigen Aufsichtsbehörde 
                  einzureichen:
                </p>
                <div className="bg-slate-50 p-4 rounded-lg mt-4">
                  <p className="font-medium">Österreichische Datenschutzbehörde</p>
                  <p>Barichgasse 40-42</p>
                  <p>1030 Wien</p>
                  <p>dsb@dsb.gv.at</p>
                </div>
              </div>
            </section>

            <section id="kontakt">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">10. Kontakt für Datenschutzanfragen</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte erreichen Sie uns unter:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#5FBDCE] mt-0.5" />
                    <div>
                      <p className="font-medium">ProAgentur GmbH</p>
                      <p>Datenschutzbeauftragter</p>
                      <p>August Greimlweg 40</p>
                      <p>1230 Wien, Österreich</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[#5FBDCE]" />
                      <a href="mailto:datenschutz@ki2go.at" className="text-[#5FBDCE] hover:underline">
                        datenschutz@ki2go.at
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-[#5FBDCE]" />
                      <span>+43 1 234 5678</span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  Wir werden Ihre Anfrage innerhalb von 30 Tagen bearbeiten.
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-12">
        <div className="container text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} KI2GO - Ein Service der ProAgentur GmbH</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/agb" className="hover:text-[#5FBDCE]">AGB</Link>
            <Link href="/datenschutz" className="hover:text-[#5FBDCE]">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-[#5FBDCE]">Impressum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
