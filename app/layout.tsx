import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "BullDog: cut wasted software spend",
  description: "Finds and cancels wasted SaaS spend, with human approval.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav>{children}</Nav>
      </body>
    </html>
  );
}
