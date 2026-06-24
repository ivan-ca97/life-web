"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Apple,
  Weight,
  Ruler,
  BarChart3,
  Target,
  CalendarDays,
  Share2,
  Users,
  UserCog,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth/context";

const navItems = [
  { label: "Resumen", href: "/resumen", icon: LayoutDashboard },
  { label: "Calendario", href: "/calendario", icon: CalendarDays },
  { label: "Comidas", href: "/comidas", icon: UtensilsCrossed },
  { label: "Ejercicios", href: "/ejercicios", icon: Dumbbell },
  { label: "Alimentos", href: "/alimentos", icon: Apple },
  { label: "Peso", href: "/peso", icon: Weight },
  { label: "Medidas", href: "/medidas", icon: Ruler },
  { label: "Estadisticas", href: "/estadisticas", icon: BarChart3 },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Compartir", href: "/compartir", icon: Share2 },
  { label: "Perfil", href: "/perfil", icon: UserCog },
  { label: "Usuarios", href: "/usuarios", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="text-lg font-semibold">Life</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span>Cambiar tema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut className="size-4" />
              <span>Cerrar sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
