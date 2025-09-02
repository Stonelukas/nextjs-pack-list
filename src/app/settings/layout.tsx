import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Pack List settings and preferences",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {children}
    </div>
  );
}
