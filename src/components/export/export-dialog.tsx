import { useState } from "react";
import {
  CheckCircle,
  Copy,
  Download,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
  QrCode,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CategoryDocument,
  ItemDocument,
  ListDocument,
} from "@/features/lists/types";
import {
  copyToClipboard,
  exportAsCSV,
  exportAsImage,
  exportAsJSON,
  exportAsPDF,
  exportAsText,
  generateOwnerListLink,
  generateQRCode,
} from "@/lib/export-utils";

interface ExportDialogProps {
  list: ListDocument;
  categories: CategoryDocument[];
  items: ItemDocument[];
  trigger?: React.ReactNode;
}

export function ExportDialog({
  list,
  categories,
  items,
  trigger,
}: ExportDialogProps) {
  const [busy, setBusy] = useState(false);
  const [ownerLink, setOwnerLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const runExport = async (label: string, action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      toast.success(`${label} exported successfully`);
    } catch {
      toast.error(`Failed to export ${label}`);
    } finally {
      setBusy(false);
    }
  };

  const generateLink = async () => {
    const link = generateOwnerListLink(list._id);
    setOwnerLink(link);
    setQrCodeUrl(await generateQRCode(link));
  };

  const copyLink = async () => {
    const link = ownerLink || generateOwnerListLink(list._id);
    if (!ownerLink) setOwnerLink(link);
    if (await copyToClipboard(link)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportButtons = [
    {
      label: "PDF",
      icon: FileText,
      action: () => exportAsPDF(list, categories, items),
    },
    {
      label: "Text",
      icon: FileText,
      action: () => exportAsText(list, categories, items),
    },
    {
      label: "CSV",
      icon: FileSpreadsheet,
      action: () => exportAsCSV(list, categories, items),
    },
    {
      label: "JSON",
      icon: FileJson,
      action: () => exportAsJSON(list, categories, items),
    },
    {
      label: "Image",
      icon: FileImage,
      action: async () => {
        const element = document.querySelector<HTMLElement>("[data-list-detail]");
        if (!element) throw new Error("List view unavailable");
        await exportAsImage(list, element);
      },
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" data-export-trigger>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export and open elsewhere</DialogTitle>
          <DialogDescription>
            Download or print the list, or create an owner-only device link.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="device">Open on another device</TabsTrigger>
          </TabsList>
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {exportButtons.map(({ action, icon: Icon, label }) => (
                <Button
                  key={label}
                  variant="outline"
                  className="h-24 flex-col"
                  disabled={busy}
                  onClick={() => void runExport(label, action)}
                >
                  <Icon className="mb-2 h-7 w-7" />
                  {label}
                </Button>
              ))}
            </div>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </TabsContent>
          <TabsContent value="device" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This URL only works for someone signed in to the same account that owns
              the list. It does not grant access to another user.
            </p>
            <Button
              className="w-full"
              onClick={() => void generateLink()}
              disabled={Boolean(ownerLink)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {ownerLink ? "Device link generated" : "Generate device link and QR code"}
            </Button>
            {ownerLink ? (
              <div className="space-y-4 rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-xs">
                    {ownerLink}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => void copyLink()}>
                    {copied ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                {qrCodeUrl ? (
                  <div className="flex flex-col items-center">
                    <QrCode className="mb-2 h-5 w-5" />
                    <img
                      src={qrCodeUrl}
                      alt="QR code for the owner-only list URL"
                      className="h-48 w-48 rounded bg-white p-2"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
