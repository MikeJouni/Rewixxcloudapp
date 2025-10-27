import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Layout, Drawer, Button, Grid } from "antd";
import {
  UserOutlined,
  ToolOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  MenuOutlined,
  CloseOutlined
} from "@ant-design/icons";

const { Header } = Layout;
const { useBreakpoint } = Grid;

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith("/customers") || path === "/") return "customers";
    if (path.startsWith("/jobs")) return "jobs";
    if (path.startsWith("/employees")) return "employees";
    if (path.startsWith("/expenses")) return "expenses";
    if (path.startsWith("/reports")) return "reports";
    return "customers";
  };

  const handleMenuClick = (e) => {
    navigate(`/${e.key}`);
    setDrawerVisible(false);
  };

  const menuItems = [
    {
      key: "customers",
      icon: <UserOutlined style={{ fontSize: '18px' }} />,
      label: "Customers",
    },
    {
      key: "jobs",
      icon: <ToolOutlined style={{ fontSize: '18px' }} />,
      label: "Jobs",
    },
    {
      key: "employees",
      icon: <TeamOutlined style={{ fontSize: '18px' }} />,
      label: "Employees",
    },
    {
      key: "expenses",
      icon: <DollarOutlined style={{ fontSize: '18px' }} />,
      label: "Expenses",
    },
    {
      key: "reports",
      icon: <BarChartOutlined style={{ fontSize: '18px' }} />,
      label: "Reports",
    },
  ];

  const isDesktop = screens.md;

  return (
    <>
      <Header 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isDesktop ? '0 24px' : '0 16px',
          background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          height: '90px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Left: SaaS Business Logo (Rewixx) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            flex: isDesktop ? '0 0 auto' : '1',
            minWidth: '120px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onClick={() => navigate('/customers')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img 
            src="/rewixx_logo.png" 
            alt="Rewixx SaaS Platform" 
            style={{ 
              height: isDesktop ? '50px' : '40px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }} 
          />
        </div>

        {/* Center: Navigation Menu - Desktop Only */}
        {isDesktop && (
          <div style={{ display: 'flex', justifyContent: 'center', flex: '1' }}>
            <Menu
              mode="horizontal"
              selectedKeys={[getActiveTab()]}
              onClick={handleMenuClick}
              items={menuItems}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '16px',
                fontWeight: 500,
              }}
              theme="dark"
              className="modern-nav-menu"
            />
          </div>
        )}

        {/* Right: Company Name - Desktop Only */}
        {isDesktop && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            flex: '0 0 auto',
            minWidth: '200px',
            maxWidth: '240px',
            textAlign: 'right',
            padding: '8px 16px',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              letterSpacing: '0.5px',
              lineHeight: '1.4',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              Imad's Electrical LLC
            </div>
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        {!isDesktop && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: '24px', color: '#fff' }} />}
            onClick={() => setDrawerVisible(true)}
            style={{
              border: 'none',
              background: 'transparent',
            }}
          />
        )}
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '4px 0'
          }}>
            <div style={{ 
              fontSize: '16px', 
              color: '#1f2937', 
              textAlign: 'center', 
              fontWeight: '600',
              letterSpacing: '0.3px',
              lineHeight: '1.4',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              Imad's Electrical LLC
            </div>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        closeIcon={<CloseOutlined style={{ fontSize: '20px' }} />}
      >
        <Menu
          mode="vertical"
          selectedKeys={[getActiveTab()]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            border: 'none',
            fontSize: '16px',
          }}
        />
      </Drawer>

      <style jsx="true">{`
        /* Desktop Menu Styles */
        .modern-nav-menu {
          display: flex;
          justify-content: center;
        }

        .modern-nav-menu .ant-menu-item {
          height: 90px;
          line-height: 90px;
          padding: 0 20px !important;
          margin: 0 4px !important;
          border-radius: 0 !important;
          transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
          position: relative;
        }

        .modern-nav-menu .ant-menu-item:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        .modern-nav-menu .ant-menu-item-selected {
          background: rgba(255, 255, 255, 0.25) !important;
          color: #fff !important;
        }

        .modern-nav-menu .ant-menu-item-selected::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          margin: 0 auto;
          width: 70%;
          height: 3px;
          background: #fff;
          border-radius: 3px 3px 0 0;
          box-shadow: 0 -2px 8px rgba(255, 255, 255, 0.6);
        }

        .modern-nav-menu .ant-menu-item .anticon {
          margin-right: 8px;
          font-size: 18px;
        }

        .modern-nav-menu .ant-menu-title-content {
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
      `}</style>
    </>
  );
};

export default Navigation;
