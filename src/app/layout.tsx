import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oral Practice — O-Level English 1184 Paper 4",
  description:
    "Practise the Planned Response and Spoken Interaction for GCE O-Level English (1184) Paper 4, with an AI examiner and instant feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
