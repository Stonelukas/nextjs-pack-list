"use client"

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  Share2,
  QrCode,
  Copy,
  Printer,
  CheckCircle,
} from "lucide-react";
import {
  exportAsPDF,
  exportAsText,
  exportAsCSV,
  exportAsJSON,
  generateShareableLink,
  generateQRCode,
  copyToClipboard,
} from "@/lib/export-utils";
import { List, Category, Item } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface ExportDialogProps {
  list: List;
  categories: Category[];
  items: Item[];
  trigger?: React.ReactNode;
}

export function ExportDialog({
  list,
  categories,
  items,
  trigger,
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportAsPDF(list, categories, items);
      toast.success("PDF exported successfully", {
        description: "Your packing list has been downloaded as a PDF.",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Failed to export PDF. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    try {
      exportAsText(list, categories, items);
      toast.success("Text file exported successfully", {
        description: "Your packing list has been downloaded as a text file.",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Failed to export text file. Please try again.",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      exportAsCSV(list, categories, items);
      toast.success("CSV exported successfully", {
        description: "Your packing list has been downloaded as a CSV file.",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Failed to export CSV. Please try again.",
      });
    }
  };

  const handleExportJSON = () => {
    try {
      exportAsJSON(list, categories, items);
      toast.success("JSON exported successfully", {
        description: "Your packing list has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "Failed to export JSON. Please try again.",
      });
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const link = await generateShareableLink(list.id);
      setShareLink(link);
      const qrCode = await generateQRCode(link);
      setQrCodeUrl(qrCode);
    } catch (error) {
      toast.error("Failed to generate share link", {
        description: "Please try again later.",
      });
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) {
      await handleGenerateShareLink();
    }
    
    const success = await copyToClipboard(shareLink);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success("Link copied!", {
        description: "Share link has been copied to clipboard.",
      });
    } else {
      toast.error("Copy failed", {
        description: "Failed to copy link. Please copy manually.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export & Share</DialogTitle>
          <DialogDescription>
            Export your packing list in various formats or share it with others.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full h-24 flex-col gap-2"
                  variant="outline"
                >
                  <FileText className="h-8 w-8" />
                  <div>
                    <div className="font-medium">PDF</div>
                    <div className="text-xs text-muted-foreground">
                      Printable format
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleExportText}
                  className="w-full h-24 flex-col gap-2"
                  variant="outline"
                >
                  <FileText className="h-8 w-8" />
                  <div>
                    <div className="font-medium">Text</div>
                    <div className="text-xs text-muted-foreground">
                      Simple text format
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleExportCSV}
                  className="w-full h-24 flex-col gap-2"
                  variant="outline"
                >
                  <FileSpreadsheet className="h-8 w-8" />
                  <div>
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-muted-foreground">
                      Spreadsheet format
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleExportJSON}
                  className="w-full h-24 flex-col gap-2"
                  variant="outline"
                >
                  <FileJson className="h-8 w-8" />
                  <div>
                    <div className="font-medium">JSON</div>
                    <div className="text-xs text-muted-foreground">
                      Data format
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handlePrint} className="w-full" variant="secondary">
                <Printer className="mr-2 h-4 w-4" />
                Print Preview
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleGenerateShareLink}
                  disabled={!!shareLink}
                  className="w-full"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {shareLink ? "Link Generated" : "Generate Share Link"}
                </Button>

                <AnimatePresence>
                  {shareLink && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-muted rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Share Link</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyLink}
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="p-2 bg-background rounded border text-xs font-mono break-all">
                          {shareLink}
                        </div>
                      </div>

                      {qrCodeUrl && (
                        <div className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg">
                          <QrCode className="h-6 w-6 text-muted-foreground" />
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="w-48 h-48 bg-white p-2 rounded"
                          />
                          <div className="text-xs text-muted-foreground text-center">
                            Scan this QR code to access the shared list
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Share options:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• View-only access for anyone with the link</li>
                    <li>• No login required</li>
                    <li>• Link expires in 30 days</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}