import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Mail, Phone, MapPin } from "lucide-react";

export default function AGB() {
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
              <FileText className="h-8 w-8 text-[#1E3A5F]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">
              Allgemeine Geschäftsbedingungen
            </h1>
            <p className="text-gray-600">
              Gültig ab: 1. Januar 2025 | Version 1.0
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="font-semibold text-lg mb-4 text-[#1E3A5F]">Inhaltsverzeichnis</h2>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <a href="#geltungsbereich" className="text-[#5FBDCE] hover:underline">1. Geltungsbereich</a>
              <a href="#vertragsschluss" className="text-[#5FBDCE] hover:underline">2. Vertragsschluss</a>
              <a href="#leistungen" className="text-[#5FBDCE] hover:underline">3. Leistungsbeschreibung</a>
              <a href="#nutzungsrechte" className="text-[#5FBDCE] hover:underline">4. Nutzungsrechte</a>
              <a href="#preise" className="text-[#5FBDCE] hover:underline">5. Preise und Zahlung</a>
              <a href="#gewaehrleistung" className="text-[#5FBDCE] hover:underline">6. Gewährleistung</a>
              <a href="#haftung" className="text-[#5FBDCE] hover:underline">7. Haftungsbeschränkung</a>
              <a href="#datenschutz" className="text-[#5FBDCE] hover:underline">8. Datenschutz</a>
              <a href="#kuendigung" className="text-[#5FBDCE] hover:underline">9. Kündigung</a>
              <a href="#schlussbestimmungen" className="text-[#5FBDCE] hover:underline">10. Schlussbestimmungen</a>
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl p-8 shadow-sm space-y-8">
            
            <section id="geltungsbereich">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">1. Geltungsbereich</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der 
                  <strong> KI2GO</strong>, betrieben von der ProAgentur GmbH, August Greimlweg 40, 1230 Wien, Österreich 
                  (nachfolgend "Anbieter") und dem Kunden (nachfolgend "Nutzer") über die Nutzung der 
                  KI-gestützten Plattform KI2GO.
                </p>
                <p>
                  Die AGB gelten sowohl für Verbraucher als auch für Unternehmer im Sinne des österreichischen 
                  Konsumentenschutzgesetzes (KSchG). Abweichende Bedingungen des Nutzers werden nicht anerkannt, 
                  es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
                </p>
              </div>
            </section>

            <section id="vertragsschluss">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">2. Vertragsschluss</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Der Vertrag kommt durch die Registrierung des Nutzers auf der Plattform und die Bestätigung 
                  dieser AGB sowie der Datenschutzerklärung zustande. Mit der Registrierung erklärt der Nutzer 
                  sein Einverständnis mit diesen AGB.
                </p>
                <p>
                  Der Nutzer versichert, dass alle bei der Registrierung angegebenen Daten wahrheitsgemäß und 
                  vollständig sind. Änderungen sind dem Anbieter unverzüglich mitzuteilen.
                </p>
              </div>
            </section>

            <section id="leistungen">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">3. Leistungsbeschreibung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  KI2GO bietet eine Plattform für KI-gestützte Aufgabenbearbeitung. Die Plattform ermöglicht es 
                  Nutzern, vordefinierte oder individuelle Aufgaben durch künstliche Intelligenz bearbeiten zu lassen.
                </p>
                <p><strong>Die Leistungen umfassen:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Zugang zu vordefinierten KI-Workflows und Aufgaben</li>
                  <li>Erstellung individueller Anfragen</li>
                  <li>Speicherung und Export von Ergebnissen</li>
                  <li>Verwaltung von Dokumenten und Ergebnissen</li>
                  <li>Für Unternehmen: Team- und Organisationsverwaltung</li>
                </ul>
                <p>
                  Der Anbieter behält sich vor, die Plattform jederzeit weiterzuentwickeln, zu ändern oder 
                  einzelne Funktionen einzustellen, sofern dies für den Nutzer zumutbar ist.
                </p>
              </div>
            </section>

            <section id="nutzungsrechte">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">4. Nutzungsrechte</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Der Nutzer erhält ein nicht-exklusives, nicht übertragbares Recht zur Nutzung der Plattform 
                  für die Dauer des Vertragsverhältnisses.
                </p>
                <p><strong>Der Nutzer verpflichtet sich:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die Plattform nur für rechtmäßige Zwecke zu nutzen</li>
                  <li>Keine Inhalte hochzuladen, die gegen geltendes Recht verstoßen</li>
                  <li>Seine Zugangsdaten vertraulich zu behandeln</li>
                  <li>Den Anbieter unverzüglich über Sicherheitsvorfälle zu informieren</li>
                </ul>
                <p>
                  Die durch die KI generierten Ergebnisse dürfen vom Nutzer für eigene Zwecke verwendet werden. 
                  Eine Weiterveräußerung oder kommerzielle Verwertung der Plattform selbst ist nicht gestattet.
                </p>
              </div>
            </section>

            <section id="preise">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">5. Preise und Zahlung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Die aktuellen Preise sind auf der Plattform einsehbar. Alle Preise verstehen sich in Euro 
                  und beinhalten die gesetzliche Umsatzsteuer, sofern nicht anders angegeben.
                </p>
                <p>
                  Die Abrechnung erfolgt über ein Credit-System. Credits können im Voraus erworben werden und 
                  werden bei Nutzung der Plattform entsprechend abgebucht. Nicht verbrauchte Credits verfallen 
                  nicht, solange das Nutzerkonto aktiv ist.
                </p>
                <p>
                  Der Anbieter behält sich vor, die Preise mit einer Ankündigungsfrist von 30 Tagen anzupassen. 
                  Bereits erworbene Credits bleiben von Preisänderungen unberührt.
                </p>
              </div>
            </section>

            <section id="gewaehrleistung">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">6. Gewährleistung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Der Anbieter gewährleistet eine durchschnittliche Verfügbarkeit der Plattform von 99% im 
                  Jahresmittel. Geplante Wartungsarbeiten werden nach Möglichkeit vorab angekündigt.
                </p>
                <p>
                  <strong>Wichtiger Hinweis:</strong> KI-generierte Ergebnisse sind Hilfsmittel und ersetzen 
                  keine professionelle Beratung. Der Nutzer ist für die Überprüfung und Verwendung der 
                  Ergebnisse selbst verantwortlich. Der Anbieter übernimmt keine Gewähr für die Richtigkeit, 
                  Vollständigkeit oder Eignung der KI-generierten Inhalte für einen bestimmten Zweck.
                </p>
              </div>
            </section>

            <section id="haftung">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">7. Haftungsbeschränkung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers 
                  oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.
                </p>
                <p>
                  Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher 
                  Vertragspflichten und beschränkt auf den vorhersehbaren, vertragstypischen Schaden.
                </p>
                <p>
                  Die Haftung für mittelbare Schäden, entgangenen Gewinn und Datenverlust ist ausgeschlossen, 
                  soweit gesetzlich zulässig. Die Haftung ist in jedem Fall auf den Betrag begrenzt, den der 
                  Nutzer in den letzten 12 Monaten an den Anbieter gezahlt hat.
                </p>
              </div>
            </section>

            <section id="datenschutz">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">8. Datenschutz</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Der Anbieter verarbeitet personenbezogene Daten gemäß der Datenschutz-Grundverordnung (DSGVO) 
                  und dem österreichischen Datenschutzgesetz (DSG). Details zur Datenverarbeitung finden sich 
                  in der separaten <Link href="/datenschutz" className="text-[#5FBDCE] hover:underline">Datenschutzerklärung</Link>.
                </p>
                <p>
                  Die Verarbeitung der vom Nutzer hochgeladenen Daten erfolgt ausschließlich zur Erbringung 
                  der vereinbarten Leistungen. Alle Daten werden auf Servern innerhalb der Europäischen Union 
                  gespeichert.
                </p>
              </div>
            </section>

            <section id="kuendigung">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">9. Kündigung</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Der Nutzer kann sein Konto jederzeit ohne Angabe von Gründen kündigen. Die Kündigung kann 
                  über die Kontoeinstellungen oder per E-Mail an support@ki2go.at erfolgen.
                </p>
                <p>
                  Der Anbieter kann das Nutzungsverhältnis mit einer Frist von 30 Tagen zum Monatsende kündigen. 
                  Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
                </p>
                <p>
                  Nach Kündigung werden die Nutzerdaten gemäß den gesetzlichen Aufbewahrungsfristen und der 
                  Datenschutzerklärung behandelt. Der Nutzer kann vor der Löschung einen Export seiner Daten 
                  anfordern.
                </p>
              </div>
            </section>

            <section id="schlussbestimmungen">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-4">10. Schlussbestimmungen</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Für Verbraucher mit 
                  gewöhnlichem Aufenthalt in der EU gelten zusätzlich die zwingenden Verbraucherschutzbestimmungen 
                  des Aufenthaltsstaates.
                </p>
                <p>
                  Gerichtsstand für alle Streitigkeiten ist Wien, Österreich. Für Verbraucher gilt der 
                  gesetzliche Gerichtsstand.
                </p>
                <p>
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit 
                  der übrigen Bestimmungen unberührt.
                </p>
                <p>
                  Der Anbieter behält sich vor, diese AGB mit angemessener Ankündigungsfrist zu ändern. 
                  Änderungen werden dem Nutzer per E-Mail mitgeteilt. Widerspricht der Nutzer nicht innerhalb 
                  von 30 Tagen, gelten die geänderten AGB als akzeptiert.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="mt-12 p-6 bg-slate-50 rounded-xl">
              <h2 className="text-xl font-bold text-[#1E3A5F] mb-4">Kontakt</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#5FBDCE] mt-0.5" />
                  <div>
                    <p className="font-medium">ProAgentur GmbH</p>
                    <p>August Greimlweg 40</p>
                    <p>1230 Wien, Österreich</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#5FBDCE]" />
                    <a href="mailto:support@ki2go.at" className="text-[#5FBDCE] hover:underline">
                      support@ki2go.at
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-[#5FBDCE]" />
                    <span>+43 1 234 5678</span>
                  </div>
                </div>
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
