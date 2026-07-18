// src/pages/Settings/SettingsPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { TABS } from "./constants.js";
import ProfileTab from "./components/ProfileTab.jsx";
import PasswordTab from "./components/PasswordTab.jsx";
import NotificationsTab from "./components/NotificationsTab.jsx";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("profile");

  // Sync activeTab with URL query param
  useEffect(() => {
    if (tabParam && ["profile", "password", "notifications"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#696E7A" }}>Manage your account, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: active ? "#FDEEF0" : "transparent",
                  color: active ? "#F22F46" : "#455A77",
                }}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </nav>

        <div>
          {activeTab === "profile" && <ProfileTab user={user} refreshUser={refreshUser} />}
          {activeTab === "password" && <PasswordTab user={user} />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}