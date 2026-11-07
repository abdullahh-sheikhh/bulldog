import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = { title: "BullDog — cut wasted software spend", description: "Finds and cancels wasted SaaS spend, with human approval." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
