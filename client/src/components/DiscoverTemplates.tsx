import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Clock, 
  FileText, 
  ArrowRight,
  Plus,
  Check,
  Loader2
} from "lucide-react";
import { useState } from "react";

interface DiscoverTemplatesProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export default function DiscoverTemplates({ 
  limit = 6, 
  showTitle = true,
  compact = false 
}: DiscoverTemplatesProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const { data: templates, isLoading } = trpc.myTemplates.getDiscoverableTemplates.useQuery({ limit });
  const { data: kundenraumInfo } = trpc.myTemplates.hasKundenraum.useQuery();
  
  const [addingTemplateId, setAddingTemplateId] = useState<number | null>(null);
  const [addedTemplates, setAddedTemplates] = useState<Set<number>>(new Set());
  
  const copyMutation = trpc.myTemplates.copyTemplateToKundenraum.useMutation({
    onSuccess: (result, variables) => {
      if (result.alreadyExists) {
        toast({
          title: "Bereits vorhanden",
          description: result.message,
        });
      } else {
        toast({
          title: "Erfolgreich hinzugefügt",
          description: result.message,
        });
        setAddedTemplates(prev => new Set(prev).add(variables.templateId));
      }
      // Aktualisiere die Listen
      utils.myTemplates.getDiscoverableTemplates.invalidate();
      utils.myTemplates.getKundenraumTemplates.invalidate();
      setAddingTemplateId(null);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
      setAddingTemplateId(null);
    },
  });

  const handleAddToKundenraum = (templateId: number) => {
    setAddingTemplateId(templateId);
    copyMutation.mutate({ templateId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return null; // Nichts anzeigen wenn alle Templates bereits verwendet werden
  }

  const hasKundenraum = kundenraumInfo?.hasKundenraum ?? false;

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Neue Aufgaben entdecken</h2>
              <p className="text-sm text-muted-foreground">
                {hasKundenraum 
                  ? "Fügen Sie neue Aufgaben zu Ihrem Kundenraum hinzu"
                  : "Diese Templates können Sie direkt ausprobieren"
                }
              </p>
            </div>
          </div>
          <Link href="/aufgaben">
            <Button variant="ghost" size="sm" className="gap-1">
              Alle anzeigen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <div className={compact 
        ? "grid gap-3 md:grid-cols-2 lg:grid-cols-3" 
        : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      }>
        {templates.map((template) => {
          const isAdding = addingTemplateId === template.id;
          const isAdded = addedTemplates.has(template.id);
          
          return (
            <Card 
              key={template.id} 
              className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 overflow-hidden"
            >
              {/* Farbiger Top-Border */}
              <div 
                className="h-1 w-full"
                style={{ backgroundColor: template.color || "#3B82F6" }}
              />
              
              <CardHeader className={compact ? "pb-2 pt-3" : "pb-2"}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${template.color || "#3B82F6"}20` }}
                    >
                      <FileText 
                        className="h-5 w-5" 
                        style={{ color: template.color || "#3B82F6" }}
                      />
                    </div>
                    <div>
                      <CardTitle className={compact ? "text-sm line-clamp-1" : "text-base line-clamp-1"}>
                        {template.title || template.name}
                      </CardTitle>
                      {!compact && (
                        <CardDescription className="text-xs">
                          {template.uniqueId}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  {/* NEU Badge */}
                  <Badge 
                    variant="secondary" 
                    className="bg-emerald-100 text-emerald-700 text-xs shrink-0"
                  >
                    NEU
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className={compact ? "pt-0 pb-3" : ""}>
                {!compact && template.shortDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {template.shortDescription}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {/* Zeit-Ersparnis */}
                  {template.estimatedTimeSavings && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>~{template.estimatedTimeSavings} Min. gespart</span>
                    </div>
                  )}

                  {/* Unterschiedliche Buttons je nach Kundenraum-Status */}
                  {hasKundenraum ? (
                    // Mit Kundenraum: "Hinzufügen" Button
                    isAdded ? (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        disabled
                        className="gap-1 text-emerald-600"
                      >
                        <Check className="h-3 w-3" />
                        Hinzugefügt
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="gap-1"
                        onClick={() => handleAddToKundenraum(template.id)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Hinzufügen
                      </Button>
                    )
                  ) : (
                    // Ohne Kundenraum: "Ausprobieren" Button (direkt ausführen)
                    <Link href={`/aufgabe/${template.slug}`}>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="gap-1 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Ausprobieren
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hinweis wenn mehr Templates verfügbar */}
      {templates.length >= limit && (
        <div className="text-center pt-2">
          <Link href="/aufgaben">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Weitere Aufgaben entdecken
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
