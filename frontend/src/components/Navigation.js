import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Drawer, Button, Grid, Tooltip } from "antd";
import {
  UserOutlined,
  ToolOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MenuOutlined,
  CloseOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import * as accountSettingsService from "../services/accountSettingsService";
import AccountSettingsModal from "./AccountSettingsModal";
import { useAuth } from "../AuthContext";
import config from "../config";

const { Header, Sider } = Layout;
const { useBreakpoint } = Grid;

const Navigation = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const screens = useBreakpoint();

  const { email: authEmail, name: authName, logout, token } = useAuth();

  // Fetch account settings - include token in query key to ensure per-user caching
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token, // Only fetch when we have a token
  });

  // Show Google account name first, then account settings company name, then email
  // This ensures each user sees their own name initially
  const companyName = authName || accountSettings?.companyName || authEmail || "Rewixx Cloud";

  // Only use persisted logoUrl from account settings (do not fall back to avatar here)
  const rawLogoUrl = accountSettings?.logoUrl || null;
  const logoSrc =
    rawLogoUrl && rawLogoUrl.startsWith("http")
      ? rawLogoUrl
      : rawLogoUrl
      ? `${config.SPRING_API_BASE}${rawLogoUrl}`
      : null;

  const mergedSettings = {
    ...(accountSettings || {}),
    companyName: accountSettings?.companyName || authName || authEmail || "",
    email: accountSettings?.email || authEmail || "",
    logoUrl: rawLogoUrl,
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith("/customers") || path === "/") return "customers";
    if (path.startsWith("/jobs")) return "jobs";
    if (path.startsWith("/employees")) return "employees";
    if (path.startsWith("/expenses")) return "expenses";
    if (path.startsWith("/contracts")) return "contracts";
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
      key: "contracts",
      icon: <FileTextOutlined />,
      label: "Contracts",
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Reports",
    },
  ];

  // Breakpoints: mobile (< md), tablet (md to lg), desktop (>= lg)
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  // Calculate sidebar state based on screen size
  const getSidebarState = () => {
    if (isMobile) return { width: 64, collapsed: true, transform: 'translateX(-100%)' };
    if (isTablet) return { width: 64, collapsed: true, transform: 'translateX(0)' };
    return {
      width: sidebarCollapsed ? 64 : 200,
      collapsed: sidebarCollapsed,
      transform: 'translateX(0)'
    };
  };

  const sidebarState = getSidebarState();

  // Auto-close drawer when switching from mobile to tablet/desktop
  useEffect(() => {
    if (!isMobile && drawerVisible) {
      setDrawerVisible(false);
    }
  }, [isMobile, drawerVisible]);

  return (
    <>
      {/* Top Header - Always visible */}
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1001,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 16px" : "0 24px",
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          height: "64px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Left: Logo and Toggle (Desktop only) */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Desktop Toggle Button */}
          {isDesktop && (
            <Button
              type="text"
              icon={
                sidebarCollapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: "20px", color: "#fff" }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: "20px", color: "#fff" }} />
                )
              }
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
            />
          )}

          {/* Logo */}
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
                height: isMobile ? "32px" : "40px",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
              }}
            />
          </div>
        </div>

        {/* Right: User Avatar, Company Name & Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!isMobile && (
            <>
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Company Logo"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "999px",
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  maxWidth: "220px",
                  height: "40px",
                  lineHeight: 1.15,
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    letterSpacing: "0.3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {companyName}
                </div>
                {authEmail && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.7)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {authEmail}
                  </div>
                )}
              </div>
            </>
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

          {/* Sign Out */}
          <Tooltip title="Sign Out">
            <Button
              type="text"
              icon={
                <LogoutOutlined
                  style={{
                    fontSize: "18px",
                    color: "#f87171",
                  }}
                />
              }
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{
                border: "none",
                background: "rgba(248, 113, 113, 0.15)",
                borderRadius: "8px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(248, 113, 113, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(248, 113, 113, 0.15)";
              }}
            />
          </Tooltip>

          {/* Mobile Hamburger Menu */}
          {isMobile && (
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

      {/* Sidebar - Always rendered for smooth transitions */}
      <Sider
        collapsed={sidebarState.collapsed}
        collapsedWidth={64}
        width={200}
        style={{
          position: "fixed",
          left: 0,
          top: 64,
          bottom: 0,
          zIndex: isMobile ? -1 : 999,
          background: "#fff",
          boxShadow: isMobile ? "none" : "2px 0 8px rgba(0,0,0,0.06)",
          borderRight: isMobile ? "none" : "1px solid #f0f0f0",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: sidebarState.transform,
          opacity: isMobile ? 0 : 1,
          pointerEvents: isMobile ? "none" : "auto",
        }}
      >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              padding: "16px 8px",
              height: "100%",
            }}
          >
            {menuItems.map((item) => {
              const isActive = activeTab === item.key;
              const showLabel = isDesktop && !sidebarCollapsed;

              return (
                <Tooltip
                  key={item.key}
                  title={!showLabel ? item.label : ""}
                  placement="right"
                >
                  <div
                    onClick={() => handleMenuClick(item.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: showLabel ? "12px 16px" : "12px 0",
                      justifyContent: showLabel ? "flex-start" : "center",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      background: isActive ? "#f0f5ff" : "transparent",
                      color: isActive ? "#1890ff" : "#595959",
                      fontWeight: isActive ? "600" : "500",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "#fafafa";
                        e.currentTarget.style.color = "#262626";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#595959";
                      }
                    }}
                  >
                    <span
                      style={{
                        fontSize: "20px",
                        display: "flex",
                        minWidth: "20px",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    {showLabel && (
                      <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                        {item.label}
                      </span>
                    )}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "3px",
                          height: "60%",
                          background: "#1890ff",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </Sider>

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
        closeIcon={<CloseOutlined style={{ fontSize: "20px", color: "#1f2937" }} />}
        maskClosable={true}
        keyboard={true}
        zIndex={1002}
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
          {/* Sign Out Button in Mobile Drawer */}
          <div
            onClick={() => {
              logout();
              navigate("/");
              setDrawerVisible(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              background: "transparent",
              color: "#ef4444",
              fontWeight: "500",
              marginTop: "16px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ fontSize: "20px", display: "flex" }}>
              <LogoutOutlined />
            </span>
            <span style={{ fontSize: "15px" }}>Sign Out</span>
          </div>
        </div>
      </Drawer>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentSettings={mergedSettings}
      />
    </>
  );
};

export default Navigation;
