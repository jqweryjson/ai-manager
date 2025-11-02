import type { ReactNode } from "react";
import { Layout } from "@consta/uikit/Layout";
import { WorkspaceProvider } from "@/app/providers";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <Layout direction="column" style={{ minHeight: "0", height: "100%" }}>
          <Header />
          <Layout
            className="layout-main"
            direction="row"
            style={{ flex: 1, minHeight: "0", height: "100%" }}
          >
            <Sidebar />
            <main className="layout-main__content">{children}</main>
          </Layout>
          <MobileBottomNav />
        </Layout>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};
