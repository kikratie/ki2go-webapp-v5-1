import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Upload, 
  Crown, 
  Zap, 
  HardDrive,
  Loader2,
  ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KundenraumHeaderProps {
  showUploadButton?: boolean;
}

export default function KundenraumHeader({ showUploadButton = true }: KundenraumHeaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Kundenraum-Info laden
  const { data: kundenraumInfo, refetch: refetchInfo } = trpc.organization.getKundenraumInfo.useQuery();
  
  // Plan-Info laden
  const { data: stats } = trpc.myTemplates.getKundenraumStats.useQuery();

  // Logo-Update Mutation
  const updateLogoMutation = trpc.organization.updateLogo.useMutation({
    onSuccess: () => {
      toast({ title: "Logo aktualisiert", description: "Ihr Firmenlogo wurde erfolgreich hochgeladen." });
      refetchInfo();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Logo-Upload Handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !kundenraumInfo?.id) return;

    // Validierung
    if (!file.type.startsWith("image/")) {
      toast({ title: "Fehler", description: "Bitte wählen Sie eine Bilddatei aus.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Fehler", description: "Das Bild darf maximal 2MB groß sein.", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // Bild zu Base64 konvertieren für einfachen Upload
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Hier würde normalerweise ein Upload zu S3 erfolgen
        // Für jetzt speichern wir die Base64-URL direkt (für kleine Logos OK)
        // In Produktion sollte storagePut verwendet werden
        
        updateLogoMutation.mutate({
          organizationId: kundenraumInfo.id,
          logoUrl: base64,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Fehler", description: "Logo-Upload fehlgeschlagen.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Berechne Nutzungs-Prozentsätze
  const taskUsagePercent = stats?.taskLimit?.limit 
    ? Math.min(100, (stats.taskLimit.used / stats.taskLimit.limit) * 100)
    : 0;

  const storageUsedGB = (stats?.usage?.storageUsedMb || 0) / 1024;
  const storageLimitGB = (stats?.plan?.limits?.storage || 1073741824) / (1024 * 1024 * 1024);
  const storagePercent = Math.min(100, (storageUsedGB / storageLimitGB) * 100);

  if (!kundenraumInfo) {
    return null; // Kein Kundenraum-Branding wenn User keine Organisation hat
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20 mb-6">
      <div className="container py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Linke Seite: Firmenlogo + Name */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {kundenraumInfo.logoUrl ? (
                  <img 
                    src={kundenraumInfo.logoUrl} 
                    alt={kundenraumInfo.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-primary/50" />
                )}
              </div>
              
              {/* Upload-Overlay */}
              {showUploadButton && (
                <div 
                  className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Firmenname + Branche */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  Kundenraum der {kundenraumInfo.name}
                </h2>
              </div>
              {kundenraumInfo.industry && (
                <p className="text-sm text-muted-foreground">
                  {kundenraumInfo.industry}
                </p>
              )}
            </div>
          </div>

          {/* Rechte Seite: Plan-Status + Nutzung */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Plan-Badge */}
            {stats?.plan && (
              <Badge 
                variant="outline" 
                className="gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-800"
              >
                <Crown className="h-4 w-4" />
                <span className="font-semibold">{stats.plan.planName}</span>
              </Badge>
            )}

            {/* Nutzungs-Anzeigen */}
            <div className="flex items-center gap-6">
              {/* Aufgaben-Nutzung */}
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Aufgaben</span>
                    <span className="font-medium">
                      {stats?.taskLimit?.used || 0} / {stats?.taskLimit?.limit === 0 ? "∞" : stats?.taskLimit?.limit || 0}
                    </span>
                  </div>
                  <Progress 
                    value={taskUsagePercent} 
                    className="h-2"
                  />
                </div>
              </div>

              {/* Speicher-Nutzung */}
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Speicher</span>
                    <span className="font-medium">
                      {storageUsedGB.toFixed(1)} / {storageLimitGB.toFixed(0)} GB
                    </span>
                  </div>
                  <Progress 
                    value={storagePercent} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
