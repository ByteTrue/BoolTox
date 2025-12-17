"use client";

import * as React from "react";
import { Home, Wrench, Compass, Download, Settings } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SidebarNotification } from "@/components/sidebar-notification";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "BoolTox User",
    email: "user@example.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "主要功能",
      items: [
        {
          title: "首页",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "工具箱",
          url: "/dashboard/tools",
          icon: Wrench,
        },
        {
          title: "资源导航",
          url: "/dashboard/resources",
          icon: Compass,
        },
        {
          title: "下载 Client",
          url: "/dashboard/download",
          icon: Download,
        },
      ],
    },
    {
      label: "设置",
      items: [
        {
          title: "主题设置",
          url: "/settings/appearance",
          icon: Settings,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">BoolTox</span>
                  <span className="truncate text-xs">工具箱平台</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
