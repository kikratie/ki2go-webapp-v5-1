import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertTriangle, Clock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TrialBanner() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: subscriptionStatus } = trpc.subscription.getStatus.useQuery(
    undefined,
    { enabled: !!user && !!user.organizationId }
  );

  if (
    !user ||
    !user.organizationId ||
    user.role === "owner" ||
    !subscriptionStatus ||
    !subscriptionStatus.hasSubscription ||
    (!subscriptionStatus.isExpiringSoon && !subscriptionStatus.isExpired) ||
    dismissed
  ) {
    return null;
  }

  const daysRemaining = subscriptionStatus.daysRemaining || 0;

  if (subscriptionStatus.isExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Testphase abgelaufen</span>
              <span className="ml-2 text-red-100">
                Ihre Testphase ist beendet. Kontaktieren Sie uns für ein Upgrade.
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-white text-red-600 hover:bg-red-50"
            onClick={() => navigate("/anfrage-stellen")}
          >
            Upgrade anfragen
          </Button>
        </div>
      </div>
    );
  }

  if (daysRemaining <= 7) {
    return (
      <div className="bg-orange-500 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Testphase endet bald</span>
              <span className="ml-2 text-orange-100">
                Noch {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tage"}.
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-orange-50"
              onClick={() => navigate("/anfrage-stellen")}
            >
              Upgrade
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-orange-600"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 flex-shrink-0" />
          <span>Testphase endet in {daysRemaining} Tagen.</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-white text-yellow-700"
            onClick={() => navigate("/firma/dashboard")}
          >
            Details
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
