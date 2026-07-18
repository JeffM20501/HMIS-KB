// src/pages/Landing/LandingPage.jsx
import { useState, useEffect } from "react";
import { listCategories } from "../../api/categories";
import client from "../../api/client";
import { CATEGORY_CONFIG } from "../../utils/categoryConfig";
import Header from "./components/Header.jsx";
import HeroSection from "./components/HeroSection.jsx";
import StatsSection from "./components/StatsSection.jsx";
import FeaturesSection from "./components/FeaturesSection.jsx";
import HowItWorksSection from "./components/HowItWorksSection.jsx";
import CategoriesSection from "./components/CategoriesSection.jsx";
import TestimonialsSection from "./components/TestimonialsSection.jsx";
import CTASection from "./components/CTASection.jsx";
import Footer from "./components/Footer.jsx";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total_articles: 0,
    avg_rating: 0,
    search_success_rate: 75,
    total_views: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await client.get("/stats/");
        setStats(res.data);
      } catch (error) {
        console.warn("Failed to fetch stats, using fallback values.");
        setStats({
          total_articles: 85,
          avg_rating: 4.4,
          search_success_rate: 75,
          total_views: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    listCategories()
      .then((data) => {
        const cats = data.results ?? data ?? [];
        setCategories(cats);
      })
      .catch(() => {
        setCategories([
          { name: "Getting Started", article_count: 0 },
          { name: "Patient Management", article_count: 0 },
          { name: "Clinical Modules", article_count: 0 },
          { name: "Billing & Finance", article_count: 0 },
          { name: "System Administration", article_count: 0 },
          { name: "Compliance & Security", article_count: 0 },
          { name: "Troubleshooting", article_count: 0 },
          { name: "Release Notes", article_count: 0 },
        ]);
      });
  }, []);

  const statsDisplay = [
    { value: `${stats.total_articles}+`, label: "Articles at launch" },
    { value: `${stats.search_success_rate}%`, label: "Search success rate" },
    { value: "≤ 2 wks", label: "Onboarding time" },
    { value: `${stats.avg_rating.toFixed(1)}★`, label: "User satisfaction" },
  ];

  const categoryDisplay = categories.length > 0
    ? categories.map((cat) => ({
        name: cat.name,
        count: cat.article_count || 0,
        color: CATEGORY_CONFIG[cat.name]?.color || "#696E7A",
      }))
    : Object.keys(CATEGORY_CONFIG).map((name) => ({
        name,
        count: 0,
        color: CATEGORY_CONFIG[name].color,
      }));

  return (
    <div className="font-inter bg-white">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <HeroSection />
      <StatsSection statsDisplay={statsDisplay} loading={loading} />
      <FeaturesSection />
      <HowItWorksSection />
      <CategoriesSection categoryDisplay={categoryDisplay} />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}