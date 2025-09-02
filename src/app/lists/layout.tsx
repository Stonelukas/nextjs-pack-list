import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packing Lists",
  description: "Manage and organize your packing lists",
};

export default function ListsLayout({
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
