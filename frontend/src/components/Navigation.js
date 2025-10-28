import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Drawer, Button, Grid, Tooltip } from "antd";
import {
  UserOutlined,
  ToolOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  MenuOutlined,
  CloseOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import * as accountSettingsService from "../services/accountSettingsService";
import AccountSettingsModal from "./AccountSettingsModal";

const { Header } = Layout;
const { useBreakpoint } = Grid;

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const screens = useBreakpoint();

  // Fetch account settings
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings"],
    queryFn: () => accountSettingsService.getAccountSettings(),
    select: (response) => response.data,
  });

  const companyName = accountSettings?.companyName || "Imad's Electrical LLC";

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith("/customers") || path === "/") return "customers";
    if (path.startsWith("/jobs")) return "jobs";
    if (path.startsWith("/employees")) return "employees";
    if (path.startsWith("/expenses")) return "expenses";
    if (path.startsWith("/reports")) return "reports";
    return "customers";
  };

  const activeTab = getActiveTab();

  const handleMenuClick = (key) => {
    navigate(`/${key}`);
    setDrawerVisible(false);
  };

  const menuItems = [
    {
      key: "customers",
      icon: <UserOutlined />,
      label: "Customers",
    },
    {
      key: "jobs",
      icon: <ToolOutlined />,
      label: "Jobs",
    },
    {
      key: "employees",
      icon: <TeamOutlined />,
      label: "Employees",
    },
    {
      key: "expenses",
      icon: <DollarOutlined />,
      label: "Expenses",
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Reports",
    },
  ];

  const isDesktop = screens.md;

  return (
    <>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isDesktop ? "0 32px" : "0 16px",
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          height: "64px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Left: Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onClick={() => navigate("/customers")}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <img
            src="/rewixx_logo.png"
            alt="Rewixx"
            style={{
              height: isDesktop ? "40px" : "32px",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            }}
          />
        </div>

        {/* Center: Navigation Tabs - Desktop Only */}
        {isDesktop && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flex: 1,
              justifyContent: "center",
              maxWidth: "600px",
            }}
          >
            {menuItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => handleMenuClick(item.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: isActive
                      ? "rgba(255, 255, 255, 0.12)"
                      : "transparent",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "500",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "18px", display: "flex" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "40%",
                        height: "2px",
                        background:
                          "linear-gradient(90deg, transparent, #60a5fa, transparent)",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Right: Company Name & Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isDesktop && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff",
                letterSpacing: "0.3px",
                whiteSpace: "nowrap",
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {companyName}
            </div>
          )}

          <Tooltip title="Account Settings">
            <Button
              type="text"
              icon={
                <SettingOutlined
                  style={{
                    fontSize: "20px",
                    color: "#fff",
                  }}
                />
              }
              onClick={() => setSettingsModalOpen(true)}
              style={{
                border: "none",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            />
          </Tooltip>

          {/* Mobile Hamburger Menu */}
          {!isDesktop && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: "24px", color: "#fff" }} />}
              onClick={() => setDrawerVisible(true)}
              style={{
                border: "none",
                background: "transparent",
              }}
            />
          )}
        </div>
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div
            style={{
              fontSize: "16px",
              color: "#1f2937",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {companyName}
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        closeIcon={<CloseOutlined style={{ fontSize: "20px" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <div
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isActive ? "#f3f4f6" : "transparent",
                  color: isActive ? "#1f2937" : "#6b7280",
                  fontWeight: isActive ? "600" : "500",
                }}
              >
                <span style={{ fontSize: "20px", display: "flex" }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: "15px" }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </Drawer>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentSettings={accountSettings}
      />
    </>
  );
};

export default Navigation;
