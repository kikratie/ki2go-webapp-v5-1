import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  File,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Download,
  ExternalLink,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
} from "lucide-react";

interface FilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  extractedText?: string | null;
}

// Hilfsfunktion um den Dateityp zu bestimmen
const getFileCategory = (fileName: string, fileType?: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeType = fileType?.toLowerCase() || "";

  // PDF
  if (extension === "pdf" || mimeType.includes("pdf")) {
    return "pdf";
  }

  // Bilder
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension) ||
    mimeType.includes("image")
  ) {
    return "image";
  }

  // Text-Dateien
  if (
    ["txt", "md", "markdown", "log"].includes(extension) ||
    mimeType.includes("text/plain")
  ) {
    return "text";
  }

  // Code-Dateien
  if (
    ["json", "xml", "html", "css", "js", "ts", "tsx", "jsx", "py", "sql"].includes(extension) ||
    mimeType.includes("application/json")
  ) {
    return "code";
  }

  // Office-Dokumente
  if (
    ["doc", "docx"].includes(extension) ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  ) {
    return "word";
  }

  if (
    ["xls", "xlsx", "csv"].includes(extension) ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return "spreadsheet";
  }

  return "unknown";
};

// Icon basierend auf Dateityp
const getFileIcon = (category: string) => {
  switch (category) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "image":
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    case "text":
    case "code":
      return <FileCode className="h-5 w-5 text-green-500" />;
    case "word":
      return <FileText className="h-5 w-5 text-blue-600" />;
    case "spreadsheet":
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

export function FilePreview({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  fileType,
  extractedText,
}: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const category = getFileCategory(fileName, fileType);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderPreview = () => {
    switch (category) {
      case "pdf":
        return (
          <div className="w-full h-full min-h-[600px] bg-white rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <Skeleton className="w-full h-full" />
              </div>
            )}
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full min-h-[600px]"
              title={fileName}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        );

      case "image":
        return (
          <div className="flex flex-col h-full">
            {/* Bild-Toolbar */}
            <div className="flex items-center justify-center gap-2 p-2 border-b bg-muted/20">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={imageZoom <= 50}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {imageZoom}%
              </span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={imageZoom >= 200}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-2" />
              <Button variant="ghost" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Bild-Anzeige */}
            <ScrollArea className="flex-1">
              <div className="flex items-center justify-center p-4 min-h-[500px]">
                {isLoading && <Skeleton className="w-64 h-64" />}
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full rounded-lg shadow-lg transition-transform duration-200"
                  style={{
                    transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    display: isLoading ? "none" : "block",
                  }}
                  onLoad={() => setIsLoading(false)}
                />
              </div>
            </ScrollArea>
          </div>
        );

      case "text":
      case "code":
        // Wenn extrahierter Text vorhanden ist, zeige diesen
        if (extractedText) {
          return (
            <ScrollArea className="h-full max-h-[600px]">
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg border">
                  {extractedText}
                </pre>
              </div>
            </ScrollArea>
          );
        }
        // Fallback: Versuche die Datei direkt zu laden
        return (
          <div className="w-full h-full min-h-[400px]">
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-[400px] bg-white rounded-lg"
              title={fileName}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        );

      case "word":
      case "spreadsheet":
        // Für Office-Dokumente: Zeige extrahierten Text oder Hinweis
        if (extractedText) {
          return (
            <ScrollArea className="h-full max-h-[600px]">
              <div className="p-4">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Hinweis:</strong> Dies ist der extrahierte Textinhalt des Dokuments.
                    Für die vollständige Formatierung laden Sie die Datei herunter.
                  </p>
                </div>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg border">
                  {extractedText}
                </pre>
              </div>
            </ScrollArea>
          );
        }
        // Fallback: Hinweis zum Download
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            {getFileIcon(category)}
            <h3 className="text-lg font-medium mt-4 mb-2">{fileName}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Für diesen Dateityp ist keine direkte Vorschau verfügbar.
              Laden Sie die Datei herunter, um sie in der entsprechenden Anwendung zu öffnen.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
              <Button variant="outline" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  In neuem Tab öffnen
                </a>
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <File className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{fileName}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Für diesen Dateityp ist keine Vorschau verfügbar.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
              <Button variant="outline" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  In neuem Tab öffnen
                </a>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          isFullscreen ? "max-w-[95vw] h-[95vh]" : "max-w-4xl max-h-[90vh]"
        } flex flex-col p-0 gap-0`}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            {getFileIcon(category)}
            <DialogTitle className="text-base font-medium truncate max-w-[400px]">
              {fileName}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Öffnen
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
}

// Einfacher Vorschau-Button für Listen
interface FilePreviewButtonProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  extractedText?: string | null;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function FilePreviewButton({
  fileUrl,
  fileName,
  fileType,
  extractedText,
  variant = "ghost",
  size = "sm",
  className,
}: FilePreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
        title="Vorschau anzeigen"
      >
        <File className="h-4 w-4" />
        {size !== "icon" && <span className="ml-1.5">Vorschau</span>}
      </Button>

      <FilePreview
        open={isOpen}
        onOpenChange={setIsOpen}
        fileUrl={fileUrl}
        fileName={fileName}
        fileType={fileType}
        extractedText={extractedText}
      />
    </>
  );
}

export default FilePreview;
