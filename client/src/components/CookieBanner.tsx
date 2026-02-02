import { useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Cookie, Shield, BarChart3, Megaphone, 
  ChevronDown, ChevronUp, X, Settings2 
} from "lucide-react";
import { Link } from "wouter";

export default function CookieBanner() {
  const { 
    showBanner, 
    preferences, 
    acceptAll, 
    acceptNecessary, 
    savePreferences,
    closeBanner,
    hasConsented 
  } = useCookieConsent();
  
  const [showDetails, setShowDetails] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });

  if (!showBanner) return null;

  const handleSaveCustom = () => {
    savePreferences(localPrefs);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] animate-in fade-in duration-300"
        onClick={() => hasConsented && closeBanner()}
      />
      
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1E3A5F]/10">
                  <Cookie className="h-6 w-6 text-[#1E3A5F]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1E3A5F]">
                    Cookie-Einstellungen
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ihre Privatsphäre ist uns wichtig
                  </p>
                </div>
              </div>
              {hasConsented && (
                <button 
                  onClick={closeBanner}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-600 leading-relaxed">
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
              Einige Cookies sind für den Betrieb der Website notwendig, während andere uns helfen, 
              die Website zu verbessern und Ihnen personalisierte Inhalte anzuzeigen.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-5">
              <Button 
                onClick={acceptAll}
                className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              >
                Alle akzeptieren
              </Button>
              <Button 
                variant="outline" 
                onClick={acceptNecessary}
              >
                Nur notwendige
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[#5FBDCE]"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Einstellungen
                {showDetails ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="border-t bg-slate-50/50 p-6 space-y-4 animate-in slide-in-from-top duration-300">
              {/* Notwendige Cookies */}
              <div className="flex items-start justify-between gap-4 p-4 bg-white rounded-xl border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="font-medium text-[#1E3A5F]">
                        Notwendige Cookies
                      </Label>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Immer aktiv
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Diese Cookies sind für den Betrieb der Website unbedingt erforderlich. 
                      Sie ermöglichen grundlegende Funktionen wie Seitennavigation und Zugriff 
                      auf sichere Bereiche.
                    </p>
                  </div>
                </div>
                <Switch checked disabled className="data-[state=checked]:bg-green-500" />
              </div>

              {/* Analyse Cookies */}
              <div className="flex items-start justify-between gap-4 p-4 bg-white rounded-xl border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label htmlFor="analytics" className="font-medium text-[#1E3A5F] cursor-pointer">
                      Analyse-Cookies
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website 
                      interagieren. Die gesammelten Informationen werden anonymisiert und dienen 
                      der Verbesserung unserer Dienste.
                    </p>
                  </div>
                </div>
                <Switch 
                  id="analytics"
                  checked={localPrefs.analytics}
                  onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, analytics: checked }))}
                  className="data-[state=checked]:bg-[#5FBDCE]"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between gap-4 p-4 bg-white rounded-xl border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Megaphone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <Label htmlFor="marketing" className="font-medium text-[#1E3A5F] cursor-pointer">
                      Marketing-Cookies
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Diese Cookies werden verwendet, um Werbung relevanter für Sie zu gestalten. 
                      Sie helfen uns auch, die Effektivität unserer Marketingkampagnen zu messen.
                    </p>
                  </div>
                </div>
                <Switch 
                  id="marketing"
                  checked={localPrefs.marketing}
                  onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, marketing: checked }))}
                  className="data-[state=checked]:bg-[#5FBDCE]"
                />
              </div>

              {/* Save Custom Button */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveCustom} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                  Auswahl speichern
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <div className="flex gap-4">
              <Link href="/datenschutz">
                <span className="hover:text-[#5FBDCE] cursor-pointer transition-colors">
                  Datenschutzerklärung
                </span>
              </Link>
              <Link href="/impressum">
                <span className="hover:text-[#5FBDCE] cursor-pointer transition-colors">
                  Impressum
                </span>
              </Link>
            </div>
            <span>© {new Date().getFullYear()} KI2GO - ProAgentur GmbH</span>
          </div>
        </div>
      </div>
    </>
  );
}
