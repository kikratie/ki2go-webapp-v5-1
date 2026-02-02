import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  UserPlus,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function Invitation() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [joining, setJoining] = useState(false);

  const code = params.code || "";

  // Einladungs-Details laden
  const { data: inviteDetails, isLoading: inviteLoading } = trpc.onboarding.getInvitationDetails.useQuery(
    { code },
    { enabled: !!code }
  );

  // Beitritts-Mutation
  const joinMutation = trpc.onboarding.joinByCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Willkommen bei ${data.organizationName}!`);
      navigate("/aufgaben");
    },
    onError: (error) => {
      toast.error(error.message);
      setJoining(false);
    },
  });

  // Automatisch beitreten wenn eingeloggt und noch nicht in Organisation
  useEffect(() => {
    if (user && !user.organizationId && inviteDetails?.valid && !joining) {
      setJoining(true);
      joinMutation.mutate({ code });
    }
  }, [user, inviteDetails, joining]);

  const isLoading = authLoading || inviteLoading;

  // Lade-Zustand
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  // Ungültige Einladung
  if (!inviteDetails?.valid) {
    const reasonMessages: Record<string, string> = {
      not_found: "Diese Einladung existiert nicht.",
      already_used: "Diese Einladung wurde bereits verwendet.",
      expired: "Diese Einladung ist abgelaufen.",
      max_uses_reached: "Diese Einladung hat die maximale Nutzungsanzahl erreicht.",
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Ungültige Einladung</CardTitle>
            <CardDescription>
              {reasonMessages[inviteDetails?.reason || "not_found"]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              Bitte kontaktieren Sie Ihren Administrator für einen neuen Einladungs-Link.
            </p>
            <Button 
              className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
              onClick={() => navigate("/")}
            >
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User ist bereits in einer Organisation
  if (user?.organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Bereits Mitglied</CardTitle>
            <CardDescription>
              Sie gehören bereits einer Organisation an und können dieser Einladung nicht folgen.
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

  // Beitritt läuft
  if (joining || joinMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#5FBDCE]/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
            </div>
            <CardTitle className="text-2xl">Beitritt läuft...</CardTitle>
            <CardDescription>
              Sie werden {inviteDetails.organizationName} hinzugefügt.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Nicht eingeloggt - Anmeldung erforderlich
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#5FBDCE]/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-[#5FBDCE]" />
            </div>
            <CardTitle className="text-2xl">Einladung zu</CardTitle>
            <CardDescription className="text-lg font-semibold text-[#1E3A5F]">
              {inviteDetails.organizationName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rolle:</span>
                <span className="font-medium">
                  {inviteDetails.role === "admin" ? "Administrator" : "Mitarbeiter"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-center text-gray-600 text-sm">
                Melden Sie sich an, um der Organisation beizutreten.
              </p>
              <Button 
                className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                onClick={() => {
                  // Speichere Code für nach dem Login
                  sessionStorage.setItem("pendingInviteCode", code);
                  window.location.href = getLoginUrl();
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Anmelden und beitreten
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Mit der Anmeldung stimmen Sie unseren Nutzungsbedingungen zu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erfolg (sollte nicht erreicht werden, da automatischer Beitritt)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Willkommen!</CardTitle>
          <CardDescription>
            Sie sind jetzt Mitglied von {inviteDetails.organizationName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
            onClick={() => navigate("/aufgaben")}
          >
            Zu den Aufgaben
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
