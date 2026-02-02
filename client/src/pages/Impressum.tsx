import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Scale, FileText, Users } from "lucide-react";

export default function Impressum() {
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
              <Building2 className="h-8 w-8 text-[#1E3A5F]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">
              Impressum
            </h1>
            <p className="text-gray-600">
              Angaben gemäß § 5 ECG und § 25 Mediengesetz
            </p>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                <MapPin className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Standort</p>
                <p className="font-medium text-[#1E3A5F]">Wien, Österreich</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                <Mail className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">E-Mail</p>
                <p className="font-medium text-[#1E3A5F]">office@ki2go.io</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                <Globe className="h-5 w-5 text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="font-medium text-[#1E3A5F]">www.ki2go.io</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl p-8 shadow-sm space-y-8">
            
            {/* Entwickler-Hinweis */}
            <section className="bg-[#5FBDCE]/10 rounded-lg p-6 border border-[#5FBDCE]/20">
              <p className="text-[#1E3A5F] font-medium">
                KI2GO ist eine Entwicklung der <strong>ProAgentur GmbH</strong>
              </p>
            </section>

            {/* Diensteanbieter nach ECG */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#5FBDCE]/10">
                  <Building2 className="h-5 w-5 text-[#5FBDCE]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Diensteanbieter gemäß § 5 ECG</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[#1E3A5F] mb-2">Unternehmensbezeichnung</h3>
                    <p className="font-medium">ProAgentur GmbH</p>
                    <p>Betreiber der Plattform KI2GO</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1E3A5F] mb-2">Rechtsform</h3>
                    <p>Gesellschaft mit beschränkter Haftung (GmbH)</p>
                    <p>nach österreichischem Recht</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Anschrift */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#5FBDCE]/10">
                  <MapPin className="h-5 w-5 text-[#5FBDCE]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Geografische Anschrift</h2>
              </div>
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="font-medium text-lg">ProAgentur GmbH</p>
                <p>August Greimlweg 40</p>
                <p>1230 Wien</p>
                <p>Österreich</p>
              </div>
            </section>

            {/* Kontakt */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#5FBDCE]/10">
                  <Mail className="h-5 w-5 text-[#5FBDCE]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Kontaktdaten</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#5FBDCE] mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1E3A5F]">E-Mail</p>
                    <a href="mailto:office@ki2go.io" className="text-[#5FBDCE] hover:underline">
                      office@ki2go.io
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-[#5FBDCE] mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1E3A5F]">Website</p>
                    <a href="https://www.ki2go.io" target="_blank" rel="noopener noreferrer" className="text-[#5FBDCE] hover:underline">
                      www.ki2go.io
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Firmenbuch */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#5FBDCE]/10">
                  <Scale className="h-5 w-5 text-[#5FBDCE]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Firmenbucheintragung</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Firmenbuchnummer</h3>
                  <p className="font-mono bg-slate-50 px-3 py-2 rounded">FN 632602y</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Firmenbuchgericht</h3>
                  <p>Handelsgericht Wien</p>
                </div>
              </div>
            </section>

            {/* UID und Behörde */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#5FBDCE]/10">
                  <FileText className="h-5 w-5 text-[#5FBDCE]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Steuerliche Angaben</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Umsatzsteuer-Identifikationsnummer (UID)</h3>
                  <p className="font-mono bg-slate-50 px-3 py-2 rounded">ATU81104118</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Zuständiges Finanzamt</h3>
                  <p>Finanzamt Österreich</p>
                </div>
              </div>
            </section>

            {/* Unternehmensgegenstand */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#5FBDCE]/10">
                  <Building2 className="h-5 w-5 text-[#5FBDCE]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Unternehmensgegenstand</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  <strong>Werbe- und Handelsagentur</strong>
                </p>
                <p>
                  Entwicklung und Betrieb von KI-gestützten Softwarelösungen und Plattformen zur 
                  Automatisierung von Geschäftsprozessen. Erbringung von IT-Dienstleistungen, 
                  insbesondere im Bereich künstliche Intelligenz, Datenverarbeitung und 
                  Softwareentwicklung.
                </p>
                <p>
                  <strong>Kammerzugehörigkeit:</strong> Wirtschaftskammer Wien
                </p>
              </div>
            </section>

            {/* Mediengesetz */}
            <section className="border-t pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                  <FileText className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Angaben gemäß § 25 Mediengesetz</h2>
              </div>
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Medieninhaber und Herausgeber</h3>
                  <p>
                    ProAgentur GmbH<br />
                    August Greimlweg 40<br />
                    1230 Wien, Österreich
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Grundlegende Richtung (Blattlinie)</h3>
                  <p>
                    KI2GO ist eine Informations- und Serviceplattform für KI-gestützte Geschäftslösungen. 
                    Die Plattform dient der Bereitstellung von automatisierten Workflows, der Unterstützung 
                    bei geschäftlichen Aufgaben durch künstliche Intelligenz sowie der Information über 
                    KI-Technologien und deren Anwendungsmöglichkeiten in Unternehmen.
                  </p>
                  <p className="mt-2">
                    Die redaktionellen Inhalte werden unabhängig erstellt und dienen ausschließlich 
                    informativen Zwecken. Die Plattform verfolgt keine politische Ausrichtung.
                  </p>
                </div>
              </div>
            </section>

            {/* Streitbeilegung */}
            <section className="border-t pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                  <Scale className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Streitbeilegung</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  <strong>Online-Streitbeilegung:</strong> Die Europäische Kommission stellt eine Plattform 
                  zur Online-Streitbeilegung (OS) bereit, die Sie unter{" "}
                  <a 
                    href="https://ec.europa.eu/consumers/odr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#5FBDCE] hover:underline"
                  >
                    ec.europa.eu/consumers/odr
                  </a>{" "}
                  finden.
                </p>
                <p>
                  <strong>Verbraucherstreitbeilegung:</strong> Wir sind nicht bereit und nicht verpflichtet, 
                  an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. 
                  Bei Beschwerden wenden Sie sich bitte direkt an uns unter{" "}
                  <a href="mailto:office@ki2go.io" className="text-[#5FBDCE] hover:underline">
                    office@ki2go.io
                  </a>.
                </p>
              </div>
            </section>

            {/* Haftungsausschluss */}
            <section className="border-t pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                  <FileText className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Haftungsausschluss</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Haftung für Inhalte</h3>
                  <p>
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                    Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
                    Als Diensteanbieter sind wir gemäß § 7 Abs. 1 ECG für eigene Inhalte auf diesen Seiten 
                    nach den allgemeinen Gesetzen verantwortlich.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Haftung für Links</h3>
                  <p>
                    Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
                    Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                    Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
                    der Seiten verantwortlich.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A5F] mb-2">Urheberrecht</h3>
                  <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                    dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und 
                    jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
                    Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </div>
              </div>
            </section>

            {/* Bildnachweise */}
            <section className="border-t pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#1E3A5F]/10">
                  <FileText className="h-5 w-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Bildnachweise</h2>
              </div>
              <div className="text-gray-700 leading-relaxed">
                <p>
                  Alle auf dieser Website verwendeten Bilder, Grafiken und Icons stammen aus eigener 
                  Produktion oder sind lizenzfrei verfügbar. Für spezifische Bildnachweise wenden Sie 
                  sich bitte an{" "}
                  <a href="mailto:office@ki2go.io" className="text-[#5FBDCE] hover:underline">
                    office@ki2go.io
                  </a>.
                </p>
              </div>
            </section>

          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Stand: Januar 2026</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white py-8 mt-12">
        <div className="container text-center">
          <p className="text-white/60 text-sm">
            © 2026 KI2GO - ProAgentur GmbH. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
