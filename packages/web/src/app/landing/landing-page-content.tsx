"use client";

import React from "react";
import { LandingNavbar } from "./components/navbar";
import { HeroSection } from "./components/hero-section";
import { FeaturesSection } from "./components/features-section";
import { ToolsPreview } from "./components/tools-preview";
import { ResourcesSection } from "./components/resources-section";
import { FaqSection } from "./components/faq-section";
import { LandingFooter } from "./components/footer";
import {
  LandingThemeCustomizer,
  LandingThemeCustomizerTrigger,
} from "./components/landing-theme-customizer";

export function LandingPageContent() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);

  return (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <main>
        {/* Hero Section - 产品介绍 */}
        <HeroSection />

        {/* Features Section - 核心功能 (3 个核心卡片) */}
        <FeaturesSection />

        {/* Tools Preview - 热门在线工具 */}
        <ToolsPreview />

        {/* Resources Section - 资源导航 */}
        <ResourcesSection />

        {/* FAQ Section - 常见问题 */}
        <FaqSection />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Theme Customizer */}
      <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </div>
  );
}
