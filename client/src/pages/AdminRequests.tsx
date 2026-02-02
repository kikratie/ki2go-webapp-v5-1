import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  TrendingUp,
  Calendar,
  User,
  Building2,
  Mail,
  Phone,
  FileText,
  Euro,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

// Status-Konfiguration
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "Neu", color: "bg-blue-500", icon: Inbox },
  reviewing: { label: "In Prüfung", color: "bg-yellow-500", icon: Eye },
  offer_sent: { label: "Angebot gesendet", color: "bg-purple-500", icon: Send },
  accepted: { label: "Angenommen", color: "bg-green-500", icon: CheckCircle2 },
  rejected: { label: "Abgelehnt", color: "bg-red-500", icon: XCircle },
  in_progress: { label: "In Bearbeitung", color: "bg-orange-500", icon: RefreshCw },
  completed: { label: "Abgeschlossen", color: "bg-emerald-500", icon: CheckCircle2 },
  cancelled: { label: "Storniert", color: "bg-gray-500", icon: XCircle },
};

// Dringlichkeits-Konfiguration
const urgencyConfig: Record<string, { label: string; color: string }> = {
  normal: { label: "Normal", color: "bg-gray-100 text-gray-700" },
  urgent: { label: "Dringend", color: "bg-orange-100 text-orange-700" },
  asap: { label: "ASAP", color: "bg-red-100 text-red-700" },
};

// Komplexitäts-Konfiguration
const complexityConfig: Record<string, { label: string; color: string }> = {
  standard: { label: "Standard", color: "bg-green-100 text-green-700" },
  complex: { label: "Komplex", color: "bg-yellow-100 text-yellow-700" },
  custom: { label: "Sonderlösung", color: "bg-purple-100 text-purple-700" },
};

// Dynamisches Icon
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || FileText;
  return <IconComponent className={className} />;
};

export default function AdminRequests() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerText, setOfferText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerValidDays, setOfferValidDays] = useState("14");

  // Daten laden
  const { data: stats, isLoading: statsLoading } = trpc.taskRequest.getStats.useQuery();
  const { data: requestsData, isLoading: requestsLoading, refetch } = trpc.taskRequest.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 100,
  });
  const { data: requestDetail, isLoading: detailLoading } = trpc.taskRequest.getById.useQuery(
    { id: selectedRequest! },
    { enabled: !!selectedRequest }
  );

  // Mutations
  const updateStatusMutation = trpc.taskRequest.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status aktualisiert");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const sendOfferMutation = trpc.taskRequest.sendOffer.useMutation({
    onSuccess: () => {
      toast.success("Angebot wurde gesendet");
      setShowOfferDialog(false);
      setOfferText("");
      setOfferPrice("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Filter-Logik
  const filteredRequests = requestsData?.requests.filter((req) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.description?.toLowerCase().includes(query) ||
      req.contactName?.toLowerCase().includes(query) ||
      req.companyName?.toLowerCase().includes(query) ||
      req.contactEmail?.toLowerCase().includes(query)
    );
  });

  // Status ändern
  const handleStatusChange = (requestId: number, newStatus: string) => {
    updateStatusMutation.mutate({
      id: requestId,
      status: newStatus as any,
    });
  };

  // Angebot senden
  const handleSendOffer = () => {
    if (!selectedRequest || !offerText.trim()) {
      toast.error("Bitte geben Sie einen Angebotstext ein");
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(offerValidDays));

    sendOfferMutation.mutate({
      id: selectedRequest,
      offerText: offerText.trim(),
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      offerValidUntil: validUntil.toISOString(),
    });
  };

  // Formatierung
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: string | number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(typeof price === "string" ? parseFloat(price) : price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anfragen-Verwaltung</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie individuelle Kundenanfragen und erstellen Sie Angebote
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Statistik-Karten */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Anfragen</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.new || 0}
            </div>
            <p className="text-xs text-muted-foreground">Warten auf Bearbeitung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Prüfung</CardTitle>
            <Eye className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.reviewing || 0}
            </div>
            <p className="text-xs text-muted-foreground">Werden gerade bearbeitet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Angebote offen</CardTitle>
            <Send className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.offerSent || 0}
            </div>
            <p className="text-xs text-muted-foreground">Warten auf Kundenentscheidung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konversionsrate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : stats && stats.total > 0 ? (
                `${Math.round(((stats.accepted + stats.completed) / stats.total) * 100)}%`
              ) : (
                "0%"
              )}
            </div>
            <p className="text-xs text-muted-foreground">Angenommene Angebote</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter und Suche */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Beschreibung, Name, Firma oder E-Mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="reviewing">In Prüfung</SelectItem>
                <SelectItem value="offer_sent">Angebot gesendet</SelectItem>
                <SelectItem value="accepted">Angenommen</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests?.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Keine Anfragen gefunden</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Versuchen Sie andere Filterkriterien"
                  : "Es gibt noch keine Kundenanfragen"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Datum</TableHead>
                  <TableHead>Anfrage</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests?.map((request) => {
                  const status = statusConfig[request.status || "new"];
                  const urgency = urgencyConfig[request.urgency || "normal"];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRequest(request.id)}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.createdAt).split(",")[0]}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">{request.description}</p>
                          {request.urgency !== "normal" && (
                            <Badge variant="outline" className={`mt-1 ${urgency.color}`}>
                              {urgency.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{request.contactName || "-"}</p>
                          <p className="text-muted-foreground">{request.companyName || request.contactEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.categoryIcon && (
                            <DynamicIcon name={request.categoryIcon} className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{request.categoryName || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.deadline ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(request.deadline).split(",")[0]}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${status.color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedRequest(request.id); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(request.id, "reviewing");
                              }}
                              disabled={request.status === "reviewing"}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              In Prüfung nehmen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request.id);
                                setShowOfferDialog(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Angebot erstellen
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(request.id, "completed");
                              }}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Als abgeschlossen markieren
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(request.id, "cancelled");
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Stornieren
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail-Dialog */}
      <Dialog open={!!selectedRequest && !showOfferDialog} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anfrage-Details</DialogTitle>
            <DialogDescription>
              Anfrage vom {requestDetail && formatDate(requestDetail.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : requestDetail ? (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={`${statusConfig[requestDetail.status || "new"].color} text-white`}
                  >
                    {statusConfig[requestDetail.status || "new"].label}
                  </Badge>
                </div>
                <Select
                  value={requestDetail.status || "new"}
                  onValueChange={(value) => handleStatusChange(requestDetail.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Neu</SelectItem>
                    <SelectItem value="reviewing">In Prüfung</SelectItem>
                    <SelectItem value="offer_sent">Angebot gesendet</SelectItem>
                    <SelectItem value="accepted">Angenommen</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                    <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Anfrage-Beschreibung */}
              <div>
                <Label className="text-sm text-muted-foreground">Anfrage</Label>
                <p className="mt-1 text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                  {requestDetail.description}
                </p>
              </div>

              {/* Kontaktdaten */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kontaktdaten
                  </h4>
                  <div className="space-y-2 text-sm">
                    {requestDetail.contactName && (
                      <p><span className="text-muted-foreground">Name:</span> {requestDetail.contactName}</p>
                    )}
                    {requestDetail.companyName && (
                      <p className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {requestDetail.companyName}
                      </p>
                    )}
                    {requestDetail.contactEmail && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`mailto:${requestDetail.contactEmail}`} className="text-primary hover:underline">
                          {requestDetail.contactEmail}
                        </a>
                      </p>
                    )}
                    {requestDetail.contactPhone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {requestDetail.contactPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Klassifizierung
                  </h4>
                  <div className="space-y-2 text-sm">
                    {requestDetail.categoryName && (
                      <p><span className="text-muted-foreground">Kategorie:</span> {requestDetail.categoryName}</p>
                    )}
                    {requestDetail.businessAreaName && (
                      <p><span className="text-muted-foreground">Bereich:</span> {requestDetail.businessAreaName}</p>
                    )}
                    {requestDetail.deadline && (
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Deadline: {formatDate(requestDetail.deadline).split(",")[0]}
                      </p>
                    )}
                    {requestDetail.urgency && (
                      <Badge variant="outline" className={urgencyConfig[requestDetail.urgency].color}>
                        {urgencyConfig[requestDetail.urgency].label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Angebot (falls vorhanden) */}
              {requestDetail.offerText && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Gesendetes Angebot
                    </h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{requestDetail.offerText}</p>
                      {requestDetail.offerPrice && (
                        <p className="font-medium text-lg">{formatPrice(requestDetail.offerPrice)}</p>
                      )}
                      {requestDetail.offerValidUntil && (
                        <p className="text-xs text-muted-foreground">
                          Gültig bis: {formatDate(requestDetail.offerValidUntil).split(",")[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Interne Notizen */}
              <div className="space-y-2">
                <Label htmlFor="internalNotes">Interne Notizen</Label>
                <Textarea
                  id="internalNotes"
                  placeholder="Notizen für das Team (nicht sichtbar für Kunden)..."
                  defaultValue={requestDetail.internalNotes || ""}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Schließen
            </Button>
            <Button
              onClick={() => setShowOfferDialog(true)}
              disabled={requestDetail?.status === "offer_sent" || requestDetail?.status === "completed"}
            >
              <Send className="h-4 w-4 mr-2" />
              Angebot erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Angebots-Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Angebot erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein individuelles Angebot für diese Anfrage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offerText">Angebotstext *</Label>
              <Textarea
                id="offerText"
                placeholder="Beschreiben Sie Ihr Angebot..."
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Dieser Text wird dem Kunden per E-Mail zugesendet
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="offerPrice">Preis (EUR)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="offerPrice"
                    type="number"
                    placeholder="0.00"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerValidDays">Gültigkeit (Tage)</Label>
                <Select value={offerValidDays} onValueChange={setOfferValidDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Tage</SelectItem>
                    <SelectItem value="14">14 Tage</SelectItem>
                    <SelectItem value="30">30 Tage</SelectItem>
                    <SelectItem value="60">60 Tage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Tipp: Template erstellen</p>
                  <p className="text-muted-foreground">
                    Wenn diese Anfrage zu einem wiederverwendbaren Template führt, können Sie es später im Generator erstellen und produktisieren.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSendOffer} disabled={sendOfferMutation.isPending}>
              {sendOfferMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Angebot senden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
