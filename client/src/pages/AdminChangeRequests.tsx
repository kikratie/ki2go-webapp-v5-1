import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Search, 
  Filter,
  MessageSquare,
  Clock,
  User,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";

// Status-Konfiguration
const statusConfig = {
  open: { label: "Offen", color: "bg-yellow-500", icon: AlertCircle },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-500", icon: PlayCircle },
  in_review: { label: "In Prüfung", color: "bg-purple-500", icon: Search },
  implemented: { label: "Umgesetzt", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Abgelehnt", color: "bg-red-500", icon: XCircle },
  closed: { label: "Geschlossen", color: "bg-gray-500", icon: CheckCircle },
};

const priorityConfig = {
  low: { label: "Niedrig", color: "text-gray-500" },
  normal: { label: "Normal", color: "text-blue-500" },
  high: { label: "Hoch", color: "text-orange-500" },
  urgent: { label: "Dringend", color: "text-red-500" },
};

export default function AdminChangeRequests() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [updateOwnerTemplate, setUpdateOwnerTemplate] = useState(false);

  // Daten laden
  const { data: changeRequests, isLoading, refetch } = trpc.customSuperprompt.getChangeRequests.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  // Mutation für Bearbeitung
  const processRequestMutation = trpc.customSuperprompt.processChangeRequest.useMutation({
    onSuccess: () => {
      toast({ 
        title: "Anfrage bearbeitet", 
        description: "Die Änderungsanfrage wurde erfolgreich aktualisiert." 
      });
      setProcessDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      setNewStatus("");
      refetch();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const handleProcessRequest = () => {
    if (!selectedRequest || !newStatus) {
      toast({ title: "Fehler", description: "Bitte wählen Sie einen Status.", variant: "destructive" });
      return;
    }
    processRequestMutation.mutate({
      id: selectedRequest.id,
      status: newStatus as any,
      reviewNote: adminNotes || undefined,
      updateOwnerTemplate,
    });
  };

  // Statistiken berechnen - API gibt { requests, stats } zurück
  const requests = changeRequests?.requests || [];
  const apiStats = changeRequests?.stats;
  
  const stats = {
    total: apiStats?.total || requests.length || 0,
    open: apiStats?.open || requests.filter(r => r.status === "open").length || 0,
    inProgress: apiStats?.inProgress || requests.filter(r => r.status === "in_progress" || r.status === "in_review").length || 0,
    completed: apiStats?.implemented || requests.filter(r => r.status === "implemented" || r.status === "closed").length || 0,
    urgent: requests.filter(r => r.priority === "urgent" || r.priority === "high").length || 0,
  };

  // Gefilterte Anfragen
  const filteredRequests = requests.filter(request => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        request.requesterName?.toLowerCase().includes(query) ||
        request.organizationName?.toLowerCase().includes(query) ||
        request.templateName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zum Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Änderungsanfragen</h1>
                <p className="text-muted-foreground">Kundenanfragen für Template-Änderungen verwalten</p>
              </div>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Statistik-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Offen</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">In Bearbeitung</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Abgeschlossen</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Dringend</p>
                  <p className="text-2xl font-bold text-red-700">{stats.urgent}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Titel, Beschreibung, Kunde..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="in_review">In Prüfung</SelectItem>
                  <SelectItem value="implemented">Umgesetzt</SelectItem>
                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                  <SelectItem value="closed">Geschlossen</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priorität" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Anfragen-Liste */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Keine Anfragen gefunden</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Versuchen Sie andere Filterkriterien."
                  : "Es gibt derzeit keine Änderungsanfragen."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.open;
              const priorityInfo = priorityConfig[request.priority as keyof typeof priorityConfig] || priorityConfig.normal;
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      {/* Status-Indikator */}
                      <div className={`w-1 rounded-full ${statusInfo.color}`} />
                      
                      {/* Hauptinhalt */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{request.title}</h3>
                            <p className="text-muted-foreground mt-1">{request.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className={priorityInfo.color}>
                              {priorityInfo.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Meta-Informationen */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.requesterName || "Unbekannt"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {request.organizationName || "Keine Firma"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {request.templateName || "Unbekannt"} ({request.templateUniqueId})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(request.createdAt).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Admin-Notizen */}
                        {request.reviewNote && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">Admin-Notizen:</p>
                            <p className="text-sm text-muted-foreground">{request.reviewNote}</p>
                          </div>
                        )}

                        {/* Aktionen */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setNewStatus(request.status || "open");
                              setAdminNotes(request.reviewNote || "");
                              setProcessDialogOpen(true);
                            }}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </Button>
                          {request.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setNewStatus("in_progress");
                                processRequestMutation.mutate({
                                  id: request.id,
                                  status: "in_progress",
                                });
                              }}
                            >
                              Annehmen
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog: Anfrage bearbeiten */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Änderungsanfrage bearbeiten</DialogTitle>
            <DialogDescription>
              {selectedRequest?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Anfrage-Details */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Beschreibung:</strong> {selectedRequest.description}</p>
                <p className="text-sm"><strong>Kunde:</strong> {selectedRequest.userName} ({selectedRequest.organizationName})</p>
                <p className="text-sm"><strong>Template:</strong> {selectedRequest.templateName} ({selectedRequest.templateUniqueId})</p>
                <p className="text-sm"><strong>Eingereicht:</strong> {new Date(selectedRequest.createdAt).toLocaleString("de-DE")}</p>
              </div>

              {/* Status ändern */}
              <div className="space-y-2">
                <Label>Neuer Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Offen</SelectItem>
                    <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                    <SelectItem value="in_review">In Prüfung</SelectItem>
                    <SelectItem value="implemented">Umgesetzt</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                    <SelectItem value="closed">Geschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin-Notizen */}
              <div className="space-y-2">
                <Label>Admin-Notizen / Antwort an Kunden</Label>
                <Textarea
                  placeholder="Notizen zur Bearbeitung oder Antwort an den Kunden..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Option: Owner-Template verbessern */}
              {(newStatus === "implemented") && (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
                  <input
                    type="checkbox"
                    id="updateOwnerTemplate"
                    checked={updateOwnerTemplate}
                    onChange={(e) => setUpdateOwnerTemplate(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <div>
                    <Label htmlFor="updateOwnerTemplate" className="font-medium text-amber-800">
                      <Sparkles className="inline mr-2 h-4 w-4" />
                      Owner-Template verbessern
                    </Label>
                    <p className="text-sm text-amber-700">
                      Die Änderung ist revolutionär und sollte in das Owner-Template übernommen werden.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleProcessRequest}
              disabled={processRequestMutation.isPending}
            >
              {processRequestMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...</>
              ) : (
                "Änderungen speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
