import { List, Category, Item } from '@/types';
import { lazyImportJsPDF, lazyImportHtmlToImage, lazyImportQRCode, lazyImportFileSaver } from './lazy-imports';

export const exportAsPDF = async (
  list: List,
  categories: Category[],
  items: Item[],
  elementRef?: React.RefObject<HTMLElement>
) => {
  const jsPDF = await lazyImportJsPDF();
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Title
  pdf.setFontSize(24);
  pdf.text(list.name, margin, yPosition);
  yPosition += 15;

  // Description
  if (list.description) {
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    const lines = pdf.splitTextToSize(list.description, pageWidth - 2 * margin);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 10;
    pdf.setTextColor(0);
  }

  // Statistics
  const totalItems = items.length;
  const packedItems = items.filter(item => item.isPacked).length;
  const completionPercentage = totalItems > 0 
    ? Math.round((packedItems / totalItems) * 100) 
    : 0;

  pdf.setFontSize(10);
  pdf.text(`Progress: ${packedItems}/${totalItems} items packed (${completionPercentage}%)`, margin, yPosition);
  yPosition += 10;

  // Categories and items
  categories.forEach(category => {
    const categoryItems = items.filter(item => item.categoryId === category.id);
    
    if (categoryItems.length === 0) return;

    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    // Category name
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(category.name, margin, yPosition);
    yPosition += 7;
    pdf.setFont(undefined, 'normal');

    // Items
    pdf.setFontSize(10);
    categoryItems.forEach(item => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      const checkbox = item.isPacked ? '☑' : '☐';
      const quantity = item.quantity > 1 ? `${item.quantity}x ` : '';
      const priority = item.priority !== 'nice-to-have' ? ` (${item.priority})` : '';
      const text = `${checkbox} ${quantity}${item.name}${priority}`;
      
      pdf.text(text, margin + 5, yPosition);
      yPosition += 5;

      if (item.description) {
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        const descLines = pdf.splitTextToSize(item.description, pageWidth - 2 * margin - 10);
        pdf.text(descLines, margin + 10, yPosition);
        yPosition += descLines.length * 4 + 2;
        pdf.setTextColor(0);
        pdf.setFontSize(10);
      }
    });

    yPosition += 5;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated on ${date}`, margin, pageHeight - 10);

  pdf.save(`${list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_packing_list.pdf`);
};

export const exportAsText = async (
  list: List,
  categories: Category[],
  items: Item[]
) => {
  let content = `${list.name}\n${'='.repeat(list.name.length)}\n\n`;
  
  if (list.description) {
    content += `${list.description}\n\n`;
  }

  // Statistics
  const totalItems = items.length;
  const packedItems = items.filter(item => item.isPacked).length;
  const completionPercentage = totalItems > 0 
    ? Math.round((packedItems / totalItems) * 100) 
    : 0;

  content += `Progress: ${packedItems}/${totalItems} items packed (${completionPercentage}%)\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  categories.forEach(category => {
    const categoryItems = items.filter(item => item.categoryId === category.id);
    
    if (categoryItems.length === 0) return;

    content += `## ${category.name}\n`;
    
    categoryItems.forEach(item => {
      const status = item.isPacked ? '[x]' : '[ ]';
      const quantity = item.quantity > 1 ? `${item.quantity}x ` : '';
      const priority = item.priority !== 'nice-to-have' ? ` (${item.priority})` : '';
      content += `${status} ${quantity}${item.name}${priority}\n`;
      
      if (item.description) {
        content += `    ${item.description}\n`;
      }
    });
    
    content += '\n';
  });
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const saveAs = await lazyImportFileSaver();
  saveAs(blob, `${list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_packing_list.txt`);
};

export const exportAsCSV = async (
  list: List,
  categories: Category[],
  items: Item[]
) => {
  const headers = ['Category', 'Item', 'Quantity', 'Priority', 'Packed', 'Description'];
  const rows = [headers];

  categories.forEach(category => {
    const categoryItems = items.filter(item => item.categoryId === category.id);
    
    categoryItems.forEach(item => {
      rows.push([
        category.name,
        item.name,
        item.quantity.toString(),
        item.priority,
        item.isPacked ? 'Yes' : 'No',
        item.description || ''
      ]);
    });
  });

  const csvContent = rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma or newline
      const escaped = cell.replace(/"/g, '""');
      return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const saveAs = await lazyImportFileSaver();
  saveAs(blob, `${list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_packing_list.csv`);
};

export const exportAsJSON = async (
  list: List,
  categories: Category[],
  items: Item[]
) => {
  const exportData = {
    list: {
      name: list.name,
      description: list.description,
      tripType: list.tripType,
      tags: list.tags,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    },
    categories: categories.map(category => ({
      name: category.name,
      icon: category.icon,
      items: items
        .filter(item => item.categoryId === category.id)
        .map(item => ({
          name: item.name,
          quantity: item.quantity,
          priority: item.priority,
          isPacked: item.isPacked,
          description: item.description,
          weight: item.weight,
          weightUnit: item.weightUnit
        }))
    })),
    statistics: {
      totalItems: items.length,
      packedItems: items.filter(item => item.isPacked).length,
      completionPercentage: items.length > 0 
        ? Math.round((items.filter(item => item.isPacked).length / items.length) * 100) 
        : 0,
      exportedAt: new Date().toISOString()
    }
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const saveAs = await lazyImportFileSaver();
  saveAs(blob, `${list.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_packing_list.json`);
};

export const generateShareableLink = async (listId: string): Promise<string> => {
  // In a real app, this would make an API call to generate a shareable link
  // For now, we'll generate a local URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/shared/${listId}`;
  return shareUrl;
};

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const QRCode = await lazyImportQRCode();
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

export const importFromJSON = (jsonString: string): {
  list: Partial<List>;
  categories: Array<Partial<Category> & { items: Array<Partial<Item>> }>;
} => {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate the structure
    if (!data.list || !data.categories) {
      throw new Error('Invalid JSON structure');
    }

    return {
      list: data.list,
      categories: data.categories
    };
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to import JSON file');
  }
};