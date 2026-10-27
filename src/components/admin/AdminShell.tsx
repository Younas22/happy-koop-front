"use client";

import {
  ChevronLeft,
  CreditCard,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Menu,
  Package,
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Star,
  Users,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { DrawerTitle } from "@/components/ui/Drawer";
import { cn } from "@/lib/utils/cn";

/**
 * Admin shell: collapsible sidebar on desktop, drawer on mobile.
 *
 * Deliberately distinct from the storefront chrome so there is no doubt about
 * which surface you are on.
 *
 * The notice in the sidebar footer is not decoration: a navigation item that
 * is hidden is NOT an access control. Every admin request is authorized
 * server-side by the API (Sanctum abilities + an admin middleware + a Policy),
 * so a user who reaches a screen they should not see still cannot act.
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
}

const GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    heading: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/messages", label: "Messages", icon: Inbox },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", icon: FileText },
      {
        href: "/admin/home-sections",
        label: "Home sections",
        icon: LayoutTemplate,
      },
    ],
  },
  {
    heading: "Configuration",
    items: [
      {
        href: "/admin/settings/store",
        label: "Store settings",
        icon: Settings,
      },
      { href: "/admin/settings/navigation", label: "Navigation", icon: Menu },
      { href: "/admin/settings/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/settings/email", label: "Email", icon: Mail },
      { href: "/admin/users", label: "Admin users", icon: UserCog },
      { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText },
    ],
  },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.heading}>
          {!collapsed ? (
            <p className="label-eyebrow mb-1.5 px-3">{group.heading}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const current = isCurrent(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex min-h-10 items-center gap-2.5 rounded-md px-3 text-sm transition-colors",
                      // A 3px marker on the inline-start edge. It survives the
                      // collapse to icons, where the label is gone and the
                      // background tint alone is easy to miss.
                      "before:absolute before:inset-y-1.5 before:-left-px before:w-[3px] before:rounded-full before:bg-brand before:opacity-0 before:transition-opacity",
                      collapsed && "justify-center px-0",
                      current
                        ? "bg-brand-surface font-semibold text-brand-active before:opacity-100"
                        : "font-medium text-ink-muted hover:bg-sunken hover:text-ink",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : null}
                    {collapsed ? (
                      <span className="sr-only">{item.label}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AuthorizationNotice({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-sunken p-3 text-xs text-ink-muted",
        compact && "text-2xs",
      )}
    >
      <p className="flex items-center gap-1.5 font-semibold text-ink">
        <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
        Navigation is not access control
      </p>
      <p className="mt-1">
        Hiding a link does not protect anything. The API authorizes every admin
        request on the server, so permissions are enforced there - not by what
        this menu shows.
      </p>
    </div>
  );
}

export function AdminShell({
  viewerName,
  viewerEmail,
  children,
}: {
  viewerName: string;
  viewerEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Admin top bar - visually distinct from the storefront header. */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface shadow-xs">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Open admin menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </DrawerTrigger>
            <DrawerContent side="left">
              <DrawerHeader>
                <DrawerTitle className="text-base font-semibold text-ink">
                  Admin
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto p-3">
                <NavList
                  pathname={pathname}
                  collapsed={false}
                  onNavigate={() => setDrawerOpen(false)}
                />
                <div className="mt-5">
                  <AuthorizationNotice />
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <ChevronLeft
              className={cn(
                "size-5 transition-transform",
                collapsed && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Button>

          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight text-ink"
          >
            <span className="flex size-6 items-center justify-center rounded-sm bg-brand text-brand-ink">
              <LayoutDashboard className="size-3.5" aria-hidden="true" />
            </span>
            Store admin
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {/* Identity of the signed-in administrator, so it is never
                ambiguous whose session is acting. */}
            <span className="hidden text-right text-xs leading-tight sm:block">
              <span className="block font-medium text-ink">{viewerName}</span>
              <span className="block text-ink-subtle">{viewerEmail}</span>
            </span>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">View store</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-line bg-surface transition-[width] duration-200 ease-(--ease-out-soft) lg:block",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto p-3">
            <NavList pathname={pathname} collapsed={collapsed} />
            {!collapsed ? (
              <div className="mt-auto pt-5">
                <AuthorizationNotice />
              </div>
            ) : null}
          </div>
        </aside>

        {/* The root layout's skip link targets `#main`; the admin renders
            its own, because the storefront's is in the other route group. */}
        <main id="main" className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
