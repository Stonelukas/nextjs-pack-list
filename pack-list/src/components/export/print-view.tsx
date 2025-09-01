"use client"

import { List, Category, Item } from "@/types";
import { cn } from "@/lib/utils";

interface PrintViewProps {
  list: List;
  categories: Category[];
  items: Item[];
  className?: string;
}

export function PrintView({
  list,
  categories,
  items,
  className,
}: PrintViewProps) {
  const totalItems = items.length;
  const packedItems = items.filter(item => item.isPacked).length;
  const completionPercentage = totalItems > 0 
    ? Math.round((packedItems / totalItems) * 100) 
    : 0;

  return (
    <div className={cn("print-view bg-white text-black", className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{list.name}</h1>
        {list.description && (
          <p className="text-gray-600">{list.description}</p>
        )}
        <div className="mt-4 text-sm text-gray-500">
          <div>Trip Type: {list.tripType || "General"}</div>
          <div>Progress: {packedItems}/{totalItems} items packed ({completionPercentage}%)</div>
          <div>Generated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Categories and Items */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = items.filter(
            (item) => item.categoryId === category.id
          );

          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="break-inside-avoid">
              <h2 className="text-xl font-semibold mb-3 border-b pb-1">
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </h2>
              
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 pl-4"
                  >
                    <span className="text-lg mt-0.5">
                      {item.isPacked ? "☑" : "☐"}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.quantity > 1 && (
                          <span className="font-medium">{item.quantity}x</span>
                        )}
                        <span className={cn(
                          item.isPacked && "line-through text-gray-500"
                        )}>
                          {item.name}
                        </span>
                        {item.priority !== "nice-to-have" && (
                          <span className="text-xs text-gray-500 italic">
                            ({item.priority})
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Packing List Assistant</span>
          <span>Page 1</span>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .print-view {
            font-size: 12pt;
            line-height: 1.5;
            color: black !important;
            background: white !important;
          }
          
          .print-view h1 {
            font-size: 24pt;
            margin-bottom: 12pt;
          }
          
          .print-view h2 {
            font-size: 16pt;
            margin-top: 16pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
          }
          
          .print-view .break-inside-avoid {
            page-break-inside: avoid;
          }
          
          .print-view * {
            color: black !important;
            background: white !important;
          }
          
          .print-view a {
            text-decoration: none !important;
          }
        }
      `}</style>
    </div>
  );
}