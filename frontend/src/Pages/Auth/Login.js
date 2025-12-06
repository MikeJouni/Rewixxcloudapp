import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Checkbox, Typography, message } from "antd";
import { GoogleOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useAuth } from "../../AuthContext";
import config from "../../config";
import Backend from "../../Backend";

const { Title, Text } = Typography;

// Detect if device is mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

const Login = () => {
  const { login } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);

  const processGoogleAuth = async (idToken) => {
    if (!idToken) {
      message.error("Google login failed. No token received.");
      setLoadingGoogle(false);
      return;
    }

    // Decode ID token payload to get email, name, picture
    let email = null;
    let name = null;
    let picture = null;
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        email = payload.email || null;
        name = payload.name || null;
        picture = payload.picture || null;
      }
    } catch (e) {
      console.warn("Failed to decode Google ID token payload:", e);
    }

    try {
      const result = await Backend.post("api/auth/google", { idToken });
      const { token, isNewUser, defaultPassword } = result;
      if (token) {
        // Clear localStorage and cache before logging in to ensure clean state
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("auth_name");
        localStorage.removeItem("auth_avatar");
        if (window.queryClient) {
          window.queryClient.clear();
          window.queryClient.removeQueries();
        }

        // Store token and basic profile in auth context
        login(token, email, true, name, picture);
        if (isNewUser && defaultPassword) {
          message.success(
            `Account created. Your default password is: ${defaultPassword}. Please store it safely.`
          );
        } else {
          message.success("Signed in with Google.");
        }
      } else {
        message.error("Failed to sign in with Google.");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      const errMsg =
        error.response?.data?.error || "Failed to sign in with Google. Please try again.";
      message.error(errMsg);
      throw error;
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    setLoadingGoogle(true);
    const idToken = response.credential;
    await processGoogleAuth(idToken);
  };

  const handleGoogleRedirectCallback = async () => {
    setLoadingGoogle(true);
    try {
      // Google redirect callback - credential is in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const credential = urlParams.get("credential");

      if (!credential) {
        message.error("Google login failed. No credential received.");
        setLoadingGoogle(false);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      await processGoogleAuth(credential);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Google redirect callback error:", error);
      message.error("Failed to sign in with Google. Please try again.");
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    // Check if we're handling a redirect callback from Google (if redirect mode was used)
    const urlParams = new URLSearchParams(window.location.search);
    const credential = urlParams.get("credential");

    if (credential) {
      // Handle redirect callback (though we're not using redirect mode anymore)
      handleGoogleRedirectCallback();
      return;
    }

    // Load Google Identity Services script and render the official button
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // Always use popup mode - it works better cross-platform and doesn't require redirect URI registration
        window.google.accounts.id.initialize({
          client_id: config.GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          ux_mode: "popup",
        });

        const buttonDiv = document.getElementById("googleSignInDiv");
        if (buttonDiv) {
          // Clear any existing content
          buttonDiv.innerHTML = "";

          // Render button with fixed width for consistency across dev/prod
          // The CSS flexbox will center it properly
          try {
            window.google.accounts.id.renderButton(buttonDiv, {
              type: "standard",
              theme: "outline",
              text: "continue_with",
              shape: "rectangular",
              size: "large",
              width: 352, // Fixed width that works well in the card
              locale: "en",
            });
            setGoogleButtonReady(true);
          } catch (error) {
            console.error("Error rendering Google button:", error);
            setGoogleButtonReady(true);
          }
        }
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const onEmailLogin = async (values) => {
    setLoadingEmail(true);
    try {
      const result = await Backend.post("api/auth/login", {
        email: values.email,
        password: values.password,
        rememberMe: values.remember,
      });
      const { token } = result;
      if (token) {
        // For email login we only know email at this point
        login(token, values.email, values.remember, null, null);
        message.success("Signed in successfully.");
      } else {
        message.error("Login failed.");
      }
    } catch (error) {
      console.error("Email login error:", error);
      const errMsg =
        error.response?.data?.error || "Failed to sign in. Please check your credentials.";
      message.error(errMsg);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <Title level={3} style={{ marginBottom: 8 }}>
            Welcome to Rewixx Cloud
          </Title>
          <Text type="secondary">
            Sign in with Google or use your email and default password.
          </Text>
        </div>

        {/* Google Sign-In Button will be rendered into this div by Google Identity Services */}
        <div
          id="googleSignInDiv"
          className="google-signin-container"
        />

        {/* Add CSS to ensure button is full width and centered */}
        <style>{`
          .google-signin-container {
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            box-sizing: border-box !important;
            margin-bottom: 16px !important;
          }
          .google-signin-container > div {
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
          }
          .google-signin-container > div > div {
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
          }
        `}</style>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-2 text-xs text-gray-400 uppercase">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Form layout="vertical" onFinish={onEmailLogin}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="you@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Your password"
              size="large"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" initialValue={true}>
            <Checkbox>Remember me on this device</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loadingEmail}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-2 text-xs text-gray-500">
          First time with Google? We'll create your account and show you a default password you
          can save for email login later.
        </div>
      </Card>
    </div>
  );
};

export default Login;
