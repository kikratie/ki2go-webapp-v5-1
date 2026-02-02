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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Building2,
  Eye,
  Download,
  FileUp,
  FileImage,
  File,
  ExternalLink,
  Clock,
  Hash
} from "lucide-react";
import { FilePreviewButton } from "@/components/FilePreview";

export default function AdminDocuments() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);

  const { data, isLoading } = trpc.audit.getAllDocuments.useQuery({
    page,
    limit: 20,
  });

  const { data: docDetails, isLoading: detailsLoading } = trpc.audit.getDocumentDetails.useQuery(
    { documentId: selectedDoc! },
    { enabled: !!selectedDoc }
  );

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

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5 text-gray-400" />;
    if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-5 w-5 text-blue-600" />;
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return <FileText className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Statistiken berechnen
  const stats = {
    total: data?.pagination.total || 0,
    totalSize: data?.documents.reduce((sum, d) => sum + (d.fileSize || 0), 0) || 0,
    withUsage: data?.documents.filter(d => d.usageCount > 0).length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">
              Dokument-Übersicht
            </h1>
            <p className="text-gray-600 mt-1">
              Alle hochgeladenen Dokumente mit Nutzungshistorie
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt Dokumente</p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{stats.total}</p>
                </div>
                <FileUp className="h-8 w-8 text-[#5FBDCE]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamtgröße</p>
                  <p className="text-2xl font-bold text-blue-600">{formatFileSize(stats.totalSize)}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Aufgaben verwendet</p>
                  <p className="text-2xl font-bold text-green-600">{stats.withUsage}</p>
                </div>
                <Hash className="h-8 w-8 text-green-500" />
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
                      <TableHead>Dokument</TableHead>
                      <TableHead>Hochgeladen von</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead className="text-right">Größe</TableHead>
                      <TableHead className="text-center">Seiten</TableHead>
                      <TableHead className="text-center">Verwendet</TableHead>
                      <TableHead>Hochgeladen am</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getFileIcon(doc.mimeType)}
                            <div>
                              <p className="font-medium text-sm truncate max-w-[200px]">
                                {doc.originalFileName || doc.fileName}
                              </p>
                              <p className="text-xs text-gray-500">{doc.mimeType || "Unbekannt"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{doc.user.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{doc.user.email}</p>
                        </TableCell>
                        <TableCell>
                          {doc.organization ? (
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{doc.organization}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell className="text-center">
                          {doc.pageCount || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {doc.usageCount > 0 ? (
                            <Badge variant="secondary">{doc.usageCount}x</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {new Date(String(doc.uploadedAt)).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedDoc(doc.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Dokument-Details</DialogTitle>
                                  <DialogDescription>
                                    {doc.originalFileName || doc.fileName}
                                  </DialogDescription>
                                </DialogHeader>
                                {detailsLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : docDetails ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Dateiname</p>
                                        <p className="font-medium">{docDetails.originalFileName || docDetails.fileName}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Dateityp</p>
                                        <p className="font-medium">{docDetails.mimeType || "Unbekannt"}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Größe</p>
                                        <p className="font-medium">{formatFileSize(docDetails.fileSize)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Seiten</p>
                                        <p className="font-medium">{docDetails.pageCount || "-"}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Hochgeladen von</p>
                                        <p className="font-medium">{docDetails.user.name}</p>
                                        <p className="text-sm text-gray-500">{docDetails.user.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Organisation</p>
                                        <p className="font-medium">{docDetails.organization || "-"}</p>
                                      </div>
                                    </div>
                                    
                                    {docDetails.fileUrl && (
                                      <div>
                                        <p className="text-sm text-gray-500 mb-2">Download</p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(docDetails.fileUrl || "", "_blank")}
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          Dokument herunterladen
                                        </Button>
                                      </div>
                                    )}

                                    {docDetails.usageHistory && docDetails.usageHistory.length > 0 && (
                                      <div>
                                        <p className="text-sm text-gray-500 mb-2">
                                          Verwendet in {docDetails.totalUsageCount} Aufgaben
                                        </p>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                          {docDetails.usageHistory.map((usage: any) => (
                                            <div 
                                              key={usage.executionId}
                                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                            >
                                              <div>
                                                <p className="text-sm font-medium">{usage.templateName}</p>
                                                <p className="text-xs text-gray-500">{usage.processId}</p>
                                              </div>
                                              <div className="text-right">
                                                <Badge 
                                                  variant={usage.status === "completed" ? "default" : "secondary"}
                                                  className={usage.status === "completed" ? "bg-green-500" : ""}
                                                >
                                                  {usage.status}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {new Date(String(usage.startedAt)).toLocaleString("de-DE", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                  })}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {docDetails.extractedText && (
                                      <div>
                                        <p className="text-sm text-gray-500 mb-2">Extrahierter Text (Vorschau)</p>
                                        <div className="bg-gray-50 p-3 rounded text-sm max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                                          {docDetails.extractedText.substring(0, 2000)}
                                          {docDetails.extractedText.length > 2000 && "..."}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </DialogContent>
                            </Dialog>
                            {doc.fileUrl && (
                              <>
                                <FilePreviewButton
                                  fileUrl={doc.fileUrl}
                                  fileName={doc.fileName}
                                  fileType={doc.mimeType || undefined}
                                  variant="ghost"
                                  size="icon"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(doc.fileUrl || "", "_blank")}
                                  title="Herunterladen"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.documents || data.documents.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Keine Dokumente gefunden
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
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
            <span className="text-sm text-gray-500">
              Seite {page} von {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Weiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
