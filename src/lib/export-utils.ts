import type { Id } from "../../convex/_generated/dataModel";
import {
  getImportPayloadLimitError,
  MAX_IMPORT_CATEGORIES,
  MAX_IMPORT_ITEMS_PER_CATEGORY,
  MAX_IMPORT_JSON_BYTES,
  utf8ByteLength,
} from "../../convex/lib/import_limits";
import { z } from "zod";

import type { CategoryDocument, ItemDocument, ListDocument } from "@/features/lists/types";
import {
  lazyImportFileSaver,
  lazyImportHtmlToImage,
  lazyImportJsPDF,
  lazyImportQRCode,
} from "./lazy-imports";

function fileBase(name: string) {
  return name.replace(/[^a-z0-9]/gi, "_").toLocaleLowerCase();
}

function itemsForCategory(category: CategoryDocument, items: ItemDocument[]) {
  return items.filter((item) => item.categoryId === category._id);
}

export async function exportAsPDF(
  list: ListDocument,
  categories: CategoryDocument[],
  items: ItemDocument[],
) {
  const JsPDF = await lazyImportJsPDF();
  const pdf = new JsPDF("p", "mm", "a4");
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  pdf.setFontSize(24);
  pdf.text(list.name, margin, y);
  y += 12;
  if (list.description) {
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(list.description, pageWidth - margin * 2);
    pdf.text(lines, margin, y);
    y += lines.length * 5 + 8;
  }

  const packed = items.filter((item) => item.packed).length;
  const progress = items.length ? Math.round((packed / items.length) * 100) : 0;
  pdf.setFontSize(10);
  pdf.text(`Progress: ${packed}/${items.length} items packed (${progress}%)`, margin, y);
  y += 10;

  for (const category of categories) {
    const categoryItems = itemsForCategory(category, items);
    if (!categoryItems.length) continue;
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(category.name, margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    for (const item of categoryItems) {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(
        `${item.packed ? "[x]" : "[ ]"} ${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.name} (${item.priority})`,
        margin + 5,
        y,
      );
      y += 5;
    }
    y += 4;
  }

  pdf.save(`${fileBase(list.name)}_packing_list.pdf`);
}

export async function exportAsText(
  list: ListDocument,
  categories: CategoryDocument[],
  items: ItemDocument[],
) {
  let content = `${list.name}\n${"=".repeat(list.name.length)}\n\n`;
  if (list.description) content += `${list.description}\n\n`;
  for (const category of categories) {
    const categoryItems = itemsForCategory(category, items);
    if (!categoryItems.length) continue;
    content += `## ${category.name}\n`;
    for (const item of categoryItems) {
      content += `${item.packed ? "[x]" : "[ ]"} ${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.name} (${item.priority})\n`;
      if (item.description) content += `    ${item.description}\n`;
    }
    content += "\n";
  }
  const saveAs = await lazyImportFileSaver();
  saveAs(new Blob([content], { type: "text/plain;charset=utf-8" }), `${fileBase(list.name)}_packing_list.txt`);
}

export function escapeCsvCell(cell: string): string {
  let prefixEnd = 0;
  while (prefixEnd < cell.length && cell.charCodeAt(prefixEnd) <= 0x20) {
    prefixEnd += 1;
  }
  const neutralized = "=+-@".includes(cell[prefixEnd] ?? "")
    ? `'${cell}`
    : cell;
  return /[,"\n\r]/.test(neutralized)
    ? `"${neutralized.replace(/"/g, '""')}"`
    : neutralized;
}

export async function exportAsCSV(
  list: ListDocument,
  categories: CategoryDocument[],
  items: ItemDocument[],
) {
  const rows = [["Category", "Item", "Quantity", "Priority", "Packed", "Description"]];
  for (const category of categories) {
    for (const item of itemsForCategory(category, items)) {
      rows.push([category.name, item.name, String(item.quantity), item.priority, item.packed ? "Yes" : "No", item.description ?? ""]);
    }
  }
  const content = rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
  const saveAs = await lazyImportFileSaver();
  saveAs(new Blob([content], { type: "text/csv;charset=utf-8" }), `${fileBase(list.name)}_packing_list.csv`);
}

export async function exportAsJSON(
  list: ListDocument,
  categories: CategoryDocument[],
  items: ItemDocument[],
) {
  const payload = {
    version: 1,
    list: { name: list.name, description: list.description, tags: list.tags },
    categories: categories.map((category) => ({
      name: category.name,
      color: category.color,
      icon: category.icon,
      items: itemsForCategory(category, items).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        priority: item.priority,
        packed: item.packed,
        description: item.description,
        notes: item.notes,
        weight: item.weight,
        tags: item.tags,
      })),
    })),
    exportedAt: new Date().toISOString(),
  };
  const saveAs = await lazyImportFileSaver();
  saveAs(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${fileBase(list.name)}_packing_list.json`);
}

export async function exportAsImage(list: ListDocument, element: HTMLElement) {
  const htmlToImage = await lazyImportHtmlToImage();
  const dataUrl = await htmlToImage.toPng(element, { cacheBust: true, pixelRatio: 2 });
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${fileBase(list.name)}_packing_list.png`;
  anchor.click();
}

export function generateOwnerListLink(listId: Id<"lists">) {
  return `${window.location.origin}/lists/${listId}`;
}

export async function generateQRCode(text: string) {
  const QRCode = await lazyImportQRCode();
  return QRCode.toDataURL(text, { width: 256, margin: 2, color: { dark: "#000000", light: "#FFFFFF" } });
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.select();
  const success = document.execCommand("copy");
  textArea.remove();
  return success;
}

const importItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.number().int().positive("Item quantity must be a positive integer"),
  priority: z.enum(["low", "medium", "high", "essential"]),
  packed: z.boolean().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().finite().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

const importPayloadSchema = z.object({
  version: z.literal(1),
  list: z.object({
    name: z.string().trim().min(1, "List name is required"),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Category name is required"),
        color: z.string().optional(),
        icon: z.string().optional(),
        items: z
          .array(importItemSchema)
          .max(
            MAX_IMPORT_ITEMS_PER_CATEGORY,
            `A category may contain at most ${MAX_IMPORT_ITEMS_PER_CATEGORY} items`,
          ),
      }),
    )
    .max(
      MAX_IMPORT_CATEGORIES,
      `An import may contain at most ${MAX_IMPORT_CATEGORIES} categories`,
    ),
});

export type ImportedListPayload = z.infer<typeof importPayloadSchema>;

export function importFromJSON(jsonString: string): ImportedListPayload {
  if (utf8ByteLength(jsonString) > MAX_IMPORT_JSON_BYTES) {
    throw new Error(
      `Import files must be ${MAX_IMPORT_JSON_BYTES} bytes or smaller`,
    );
  }
  const payload = importPayloadSchema.parse(JSON.parse(jsonString) as unknown);
  const structuralLimitError = getImportPayloadLimitError(payload);
  if (structuralLimitError) throw new Error(structuralLimitError);
  return payload;
}
