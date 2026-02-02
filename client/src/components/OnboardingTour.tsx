import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Users, 
  Zap,
  Target,
  Rocket,
  PartyPopper
} from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    id: 1,
    title: "Willkommen bei KI2GO!",
    description: "Wir zeigen Ihnen in 3 Schritten, wie Sie das Beste aus KI2GO herausholen.",
    icon: Sparkles,
    color: "bg-[#5FBDCE]",
  },
  {
    id: 2,
    title: "Ihre erste KI-Aufgabe",
    description: "Wählen Sie eine Aufgabe aus und erleben Sie, wie KI Ihre Arbeit vereinfacht.",
    icon: Target,
    color: "bg-indigo-500",
    action: "tasks",
  },
  {
    id: 3,
    title: "Ergebnisse speichern",
    description: "Alle Ergebnisse werden automatisch gespeichert und sind jederzeit abrufbar.",
    icon: FileText,
    color: "bg-green-500",
  },
  {
    id: 4,
    title: "Team einladen",
    description: "Laden Sie Kollegen ein und arbeiten Sie gemeinsam effizienter.",
    icon: Users,
    color: "bg-orange-500",
    action: "team",
  },
];

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleAction = () => {
    if (step.action === "tasks") {
      navigate("/aufgaben");
      handleNext();
    } else if (step.action === "team") {
      navigate("/firma/users");
      handleComplete();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-[#5FBDCE] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            onClick={handleSkip}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
              <step.icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Schritt {currentStep + 1} von {tourSteps.length}
              </p>
              <CardTitle className="text-xl">{step.title}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <CardDescription className="text-base text-gray-600">
            {step.description}
          </CardDescription>

          {/* Step-specific content */}
          {currentStep === 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-[#5FBDCE]/10">
                <Zap className="h-6 w-6 text-[#5FBDCE] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#1E3A5F]">Schnell</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-indigo-50">
                <Target className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-[#1E3A5F]">Präzise</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-[#1E3A5F]">Einfach</p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1E3A5F]">Beliebte Aufgaben zum Starten:</p>
              <div className="space-y-2">
                {["Vertrags Analyse", "CV Analyse", "E-Mail Vorlagen"].map((task, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate("/aufgaben")}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#5FBDCE]/20 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#5FBDCE]" />
                    </div>
                    <span className="text-sm font-medium">{task}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Automatische Speicherung</p>
                  <p className="text-sm text-green-600">
                    Alle Ergebnisse finden Sie unter "Meine Dokumente" und im Verlauf.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Team-Zusammenarbeit</p>
                  <p className="text-sm text-orange-600">
                    Laden Sie Kollegen per E-Mail oder Link ein. Alle nutzen das gleiche Kontingent.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Zurück
              </Button>
            )}
            
            {step.action ? (
              <Button 
                className="flex-1 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 gap-2"
                onClick={handleAction}
              >
                {step.action === "tasks" ? "Aufgaben ansehen" : "Team einladen"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-[#5FBDCE] hover:bg-[#5FBDCE]/90 gap-2"
                onClick={handleNext}
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <PartyPopper className="h-4 w-4" />
                    Los geht's!
                  </>
                ) : (
                  <>
                    Weiter
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip Link */}
          <button 
            onClick={handleSkip}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Tour überspringen
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
