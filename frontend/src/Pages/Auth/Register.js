import React, { useState, useCallback, useRef } from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../AuthContext";
import Backend from "../../Backend";
import { Link, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const debounceTimer = useRef(null);

  // Debounced email validation function
  const checkEmailAvailability = useCallback(async (email) => {
    if (!email || !email.includes("@")) {
      return Promise.resolve(); // Don't validate if email is empty or invalid format
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    return new Promise((resolve, reject) => {
      debounceTimer.current = setTimeout(async () => {
        try {
          setCheckingEmail(true);
          const response = await Backend.get("api/auth/check-email", { email });
          
          if (response.exists) {
            const errorMessage = response.isGoogleAccount
              ? "An account with this email already exists. Please sign in with Google."
              : "An account with this email already exists.";
            reject(new Error(errorMessage));
          } else {
            resolve();
          }
        } catch (error) {
          // If it's a validation error (email exists), reject with that message
          if (error.response?.data?.message) {
            reject(new Error(error.response.data.message));
          } else if (error.message && !error.message.includes("Network")) {
            reject(error);
          } else {
            // Network or other errors - don't block registration
            resolve();
          }
        } finally {
          setCheckingEmail(false);
        }
      }, 500); // Wait 500ms after user stops typing
    });
  }, []);

  const onRegister = async (values) => {
    setLoading(true);
    try {
      const result = await Backend.post("api/auth/register", {
        email: values.email,
        password: values.password,
        name: values.name,
      });
      const { token } = result;
      if (token) {
        login(token, values.email, true, values.name || null, null);
        message.success("Account created successfully! Welcome!");
        // Redirect to customers page after successful registration
        navigate("/customers", { replace: true });
      } else {
        message.error("Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errMsg =
        error.response?.data?.error || "Failed to register. Please try again.";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card
        className="w-full max-w-md shadow-lg"
        bodyStyle={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          textAlign: "center",
        }}
      >
        <div className="text-center mb-6">
          <Title level={3} style={{ marginBottom: 8 }}>
            Create an Account
          </Title>
          <Text type="secondary">
            Sign up to get started with Rewixx Cloud
          </Text>
        </div>

        <Form layout="vertical" onFinish={onRegister}>
          <Form.Item
            label="Name (Optional)"
            name="name"
            rules={[
              {
                max: 100,
                message: "Name must be less than 100 characters",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Your name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            validateStatus={checkingEmail ? "validating" : ""}
            hasFeedback={checkingEmail}
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
              {
                validator: async (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  return checkEmailAvailability(value);
                },
              },
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
            rules={[
              { required: true, message: "Please enter a password" },
              {
                min: 6,
                message: "Password must be at least 6 characters",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="At least 6 characters"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 text-center">
          <Text type="secondary">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#1890ff" }}>
              Sign in
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;

