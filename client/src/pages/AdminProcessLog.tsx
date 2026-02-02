import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Hash,
  Coins,
  Timer,
  FileUp,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

export default function AdminProcessLog() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProcess, setSelectedProcess] = useState<any>(null);

  const { data, isLoading } = trpc.audit.getProcessLog.useQuery({
    page,
    limit: 20,
  });

  // Nur Owner darf zugreifen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Zugriff verweigert</CardTitle>
            <CardDescription>
              Diese Seite ist nur für den Owner zugänglich.
            </CardDescription>
          </CardHeader>
          <CardContent>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Erfolgreich</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fehler</Badge>;
      case "processing":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Läuft</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Wartend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return "€0.0000";
    if (cost < 0.0001) return `€${cost.toFixed(6)}`;
    return `€${cost.toFixed(4)}`;
  };

  // Statistiken berechnen
  const stats = {
    total: data?.pagination.total || 0,
    completed: data?.processes.filter(p => p.status === "completed").length || 0,
    failed: data?.processes.filter(p => p.status === "failed").length || 0,
    totalCost: data?.processes.reduce((sum, p) => sum + p.cost, 0) || 0,
    totalTokens: data?.processes.reduce((sum, p) => sum + p.totalTokens, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">
              Prozess-Protokoll
            </h1>
            <p className="text-gray-600 mt-1">
              Vollständige Aufzeichnung aller Aufgaben-Ausführungen mit Kosten
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate("/admin")}
          >
            Zurück zum Admin
          </Button>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt</p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-[#5FBDCE]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Erfolgreich</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Fehler</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamtkosten</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCost(stats.totalCost)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tokens</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <Coins className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabelle */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#5FBDCE]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prozess-ID</TableHead>
                      <TableHead>User / Firma</TableHead>
                      <TableHead>Aufgabe</TableHead>
                      <TableHead className="text-center">Dokumente</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                      <TableHead className="text-center">Dauer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Zeit</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.processes.map((process) => (
                      <TableRow key={process.executionId}>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {process.processId}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{process.userName}</span>
                            </div>
                            {process.organizationName && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{process.organizationName}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{process.templateName}</p>
                            {process.templateUniqueId && (
                              <p className="text-xs text-gray-500">{process.templateUniqueId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {process.documentCount > 0 ? (
                            <div className="flex items-center justify-center space-x-1">
                              <FileUp className="h-4 w-4 text-blue-500" />
                              <span>{process.documentCount}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <span className="text-green-600">{process.inputTokens.toLocaleString()}</span>
                            <span className="text-gray-400"> / </span>
                            <span className="text-blue-600">{process.outputTokens.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatCost(process.cost)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-1 text-sm">
                            <Timer className="h-3 w-3 text-gray-400" />
                            <span>{formatDuration(process.executionTimeMs)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(process.status || "pending")}
                        </TableCell>
                        <TableCell>
                          {process.feedbackRating === "positive" && (
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                          )}
                          {process.feedbackRating === "negative" && (
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                          )}
                          {!process.feedbackRating && (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {new Date(String(process.startedAt)).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedProcess(process)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Prozess-Details</DialogTitle>
                                <DialogDescription>
                                  {process.processId}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">User</p>
                                    <p className="font-medium">{process.userName}</p>
                                    <p className="text-sm text-gray-500">{process.userEmail}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Organisation</p>
                                    <p className="font-medium">{process.organizationName || "-"}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Aufgabe</p>
                                  <p className="font-medium">{process.templateName}</p>
                                  <p className="text-sm text-gray-500">{process.templateUniqueId}</p>
                                </div>
                                {process.documentNames.length > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500">Dokumente</p>
                                    <ul className="list-disc list-inside">
                                      {process.documentNames.map((name: string, i: number) => (
                                        <li key={i} className="text-sm">{name}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Input Tokens</p>
                                    <p className="font-medium text-green-600">{process.inputTokens.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Output Tokens</p>
                                    <p className="font-medium text-blue-600">{process.outputTokens.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Gesamtkosten</p>
                                    <p className="font-medium text-orange-600">{formatCost(process.cost)}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">LLM Model</p>
                                    <p className="font-medium">{process.llmModel || "-"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Dauer</p>
                                    <p className="font-medium">{formatDuration(process.executionTimeMs)}</p>
                                  </div>
                                </div>
                                {process.errorMessage && (
                                  <div>
                                    <p className="text-sm text-gray-500">Fehlermeldung</p>
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{process.errorMessage}</p>
                                  </div>
                                )}
                                {process.feedbackComment && (
                                  <div>
                                    <p className="text-sm text-gray-500">Feedback</p>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{process.feedbackComment}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.processes || data.processes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                          Keine Prozesse gefunden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Seite {page} von {data.pagination.totalPages} ({data.pagination.total} Einträge)
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
