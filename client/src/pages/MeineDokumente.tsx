import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  FolderOpen, Search, Download, Trash2, MoreVertical,
  FileText, Image, FileSpreadsheet, File, Upload, Sparkles,
  HardDrive, ArrowUpDown, ChevronDown, RefreshCw, X, CloudUpload, Eye
} from "lucide-react";
import { FilePreviewButton } from "@/components/FilePreview";

// Erlaubte Dateitypen
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Datei-Icon basierend auf MIME-Type
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.includes("document") || mimeType.includes("word")) return FileText;
  return File;
}

// Datei-Größe formatieren
function formatFileSize(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Datum formatieren
function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeineDokumente() {
  const { toast } = useToast();
  const [type, setType] = useState<"all" | "upload" | "result">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  
  // Upload State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Daten laden
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.documents.getStats.useQuery();
  const { data: documentsData, isLoading: docsLoading, refetch } = trpc.documents.list.useQuery({
    type,
    search: search || undefined,
    sortBy,
    sortOrder,
    limit: 100,
  });

  // Mutations
  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
    },
    onError: (error) => {
      toast({ title: "Upload fehlgeschlagen", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Dokument gelöscht", description: "Das Dokument wurde erfolgreich gelöscht." });
      refetch();
      refetchStats();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = trpc.documents.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast({ title: "Dokumente gelöscht", description: `${data.deleted} Dokumente wurden gelöscht.` });
      setSelectedIds([]);
      refetch();
      refetchStats();
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Drag & Drop Handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFilesSelected(files);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFilesSelected(files);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Dateityp nicht erlaubt`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Datei zu groß (max. 50 MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Einige Dateien wurden abgelehnt",
        description: errors.join("\n"),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...validFiles]);
      setUploadDialogOpen(true);
    }
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      
      try {
        // Datei zu Base64 konvertieren
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Data URL Format: data:mime;base64,DATA
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });

        successCount++;
      } catch {
        errorCount++;
      }

      setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
    }

    setIsUploading(false);
    setUploadFiles([]);
    setUploadDialogOpen(false);

    if (successCount > 0) {
      toast({
        title: "Upload abgeschlossen",
        description: `${successCount} Datei(en) erfolgreich hochgeladen${errorCount > 0 ? `, ${errorCount} fehlgeschlagen` : ""}`,
      });
    }
  };

  // Handler
  const handleDelete = (id: number) => {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate({ id: documentToDelete });
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      bulkDeleteMutation.mutate({ ids: selectedIds });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (documentsData?.documents) {
      if (selectedIds.length === documentsData.documents.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(documentsData.documents.map(d => d.id));
      }
    }
  };

  const handleDownload = (url: string | null, fileName: string) => {
    if (!url) {
      toast({ title: "Fehler", description: "Download-URL nicht verfügbar", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meine Dokumente</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre hochgeladenen und generierten Dokumente
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Hochladen
            </Button>
            <Button onClick={() => { refetch(); refetchStats(); }} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <CloudUpload className={`h-10 w-10 mx-auto mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm text-muted-foreground mb-2">
            Dateien hierher ziehen oder{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:underline font-medium"
            >
              durchsuchen
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word, Excel, Bilder • Max. 50 MB pro Datei
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Dokumente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.uploadCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Hochgeladen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ergebnisse</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.resultCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Generiert</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Speicher</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalSizeFormatted || "0 B"}</div>
              )}
              <p className="text-xs text-muted-foreground">Verwendet</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Suche */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Dokumente</CardTitle>
                <CardDescription>
                  {documentsData?.total || 0} Dokumente gefunden
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                {/* Suche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>
                {/* Sortierung */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sortieren
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc"); }}>
                      Neueste zuerst
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc"); }}>
                      Älteste zuerst
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("asc"); }}>
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("desc"); }}>
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortBy("size"); setSortOrder("desc"); }}>
                      Größte zuerst
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("size"); setSortOrder("asc"); }}>
                      Kleinste zuerst
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* Typ-Filter */}
            <Tabs value={type} onValueChange={(v) => setType(v as typeof type)} className="mt-4">
              <TabsList>
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="upload">Uploads</TabsTrigger>
                <TabsTrigger value="result">Ergebnisse</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedIds.length} ausgewählt
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Auswahl aufheben
                </Button>
              </div>
            )}

            {/* Dokumente Liste */}
            {docsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : documentsData?.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine Dokumente gefunden</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {search ? "Versuchen Sie eine andere Suche" : "Laden Sie Ihre ersten Dokumente hoch"}
                </p>
                {!search && (
                  <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Dokument hochladen
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                  <Checkbox
                    checked={selectedIds.length === documentsData?.documents.length && documentsData.documents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <div className="flex-1">Datei</div>
                  <div className="w-24 hidden md:block">Typ</div>
                  <div className="w-24 hidden md:block">Größe</div>
                  <div className="w-36 hidden lg:block">Datum</div>
                  <div className="w-10"></div>
                </div>
                
                {/* Document Rows */}
                {documentsData?.documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.mimeType);
                  const isSelected = selectedIds.includes(doc.id);
                  
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-4 px-4 py-3 border rounded-lg transition-colors hover:bg-muted/50 ${
                        isSelected ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(doc.id)}
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {doc.originalFileName || doc.fileName}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="w-24 hidden md:block">
                        <Badge variant={doc.category === "result" ? "default" : "secondary"}>
                          {doc.category === "result" ? "Ergebnis" : "Upload"}
                        </Badge>
                      </div>
                      <div className="w-24 text-sm text-muted-foreground hidden md:block">
                        {formatFileSize(doc.fileSize)}
                      </div>
                      <div className="w-36 text-sm text-muted-foreground hidden lg:block">
                        {formatDate(doc.uploadedAt)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {doc.fileUrl && (
                            <DropdownMenuItem asChild>
                              <FilePreviewButton
                                fileUrl={doc.fileUrl}
                                fileName={doc.originalFileName || doc.fileName}
                                fileType={doc.mimeType || undefined}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start cursor-pointer"
                              />
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Herunterladen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(doc.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dokumente hochladen</DialogTitle>
            <DialogDescription>
              Wählen Sie Dateien zum Hochladen aus oder ziehen Sie sie in das Fenster.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Drag & Drop Zone im Dialog */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25"
              }`}
            >
              <CloudUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Dateien hierher ziehen oder{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline font-medium"
                >
                  durchsuchen
                </button>
              </p>
            </div>

            {/* Ausgewählte Dateien */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeUploadFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress}% hochgeladen...
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFiles([]);
              }}
              disabled={isUploading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadFiles.length === 0 || isUploading}
            >
              {isUploading ? "Wird hochgeladen..." : `${uploadFiles.length} Datei(en) hochladen`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Dokument löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
