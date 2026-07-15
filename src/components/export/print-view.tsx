import type { ListDocument } from "@/features/lists/types";
import { cn } from "@/lib/utils";

interface PrintViewProps {
  list: ListDocument;
  className?: string;
}

export function PrintView({ className, list }: PrintViewProps) {
  const categories = [...list.categories].sort((left, right) => left.order - right.order);
  const items = categories.flatMap((category) => [...category.items].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)));
  const packedItems = items.filter((item) => item.packed).length;
  const completionPercentage = items.length ? Math.round((packedItems / items.length) * 100) : 0;

  return (
    <section data-print-view className={cn("print-view bg-white text-[#172125]", className)}>
      <header data-print-header className="mb-6 border-b-2 border-[#172125] pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-[#607075]">Route Ledger / Packing manifest</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{list.name}</h1>
        {list.description ? <p className="mt-1 text-[#607075]">{list.description}</p> : null}
        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div><dt className="font-mono text-xs uppercase text-[#607075]">Packed</dt><dd>{packedItems} / {items.length}</dd></div>
          <div><dt className="font-mono text-xs uppercase text-[#607075]">Completion</dt><dd>{completionPercentage}%</dd></div>
          <div><dt className="font-mono text-xs uppercase text-[#607075]">Generated</dt><dd>{new Date().toLocaleDateString()}</dd></div>
        </dl>
      </header>
      <div className="space-y-4">
        {categories.map((category) => category.items.length ? (
          <section key={category._id} data-print-category className="break-inside-avoid border border-[#607075]">
            <h2 className="border-b border-[#607075] bg-[#f3f6f5] px-3 py-2 text-lg font-semibold">{category.icon ? <span className="mr-2">{category.icon}</span> : null}{category.name}</h2>
            <table className="w-full border-collapse text-sm">
              <thead><tr className="border-b border-[#607075]"><th scope="col" className="w-20 px-3 py-2 text-left">State</th><th scope="col" className="px-3 py-2 text-left">Item</th><th scope="col" className="w-20 px-3 py-2 text-right">Qty</th><th scope="col" className="w-24 px-3 py-2 text-right">Priority</th></tr></thead>
              <tbody>{category.items.map((item) => <tr key={item._id} className="border-b border-[#c8d0d1] last:border-b-0"><td className="px-3 py-2">{item.packed ? "Packed" : "Unpacked"}</td><td className={cn("px-3 py-2", item.packed && "text-[#607075]")}>{item.name}{item.description ? <span className="block text-xs text-[#607075]">{item.description}</span> : null}</td><td className="px-3 py-2 text-right font-mono">{item.quantity}</td><td className="px-3 py-2 text-right capitalize">{item.priority}</td></tr>)}</tbody>
            </table>
          </section>
        ) : null)}
      </div>
      <footer className="mt-8 flex justify-between border-t border-[#607075] pt-3 font-mono text-xs uppercase text-[#607075]"><span>Route Ledger</span><span>Operational manifest</span></footer>
    </section>
  );
}
