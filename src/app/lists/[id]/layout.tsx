import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packing List",
  description: "View and edit your packing list",
};

export default function ListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      {children}
    </div>
  );
}
