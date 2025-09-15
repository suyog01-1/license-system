"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie"; // ✅ add cookies
import { Loader2, LogIn, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");

  // Admin state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  // Reseller state
  const [resellerUsername, setResellerUsername] = useState("");
  const [resellerPassword, setResellerPassword] = useState("");
  const [resellerError, setResellerError] = useState<string | null>(null);

  // Clear errors when switching tabs
  useEffect(() => {
    setAdminError(null);
    setResellerError(null);
  }, [activeTab]);

  const handleLogin = async (role: "admin" | "reseller") => {
    setLoading(true);

    try {
      const payload =
        role === "admin"
          ? { email: adminEmail, password: adminPassword, role: "admin" }
          : { username: resellerUsername, password: resellerPassword, role: "reseller" };

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (role === "admin") setAdminError(null);
        else setResellerError(null);

        if (data.token) {
          // ✅ save token in both localStorage + cookie
          localStorage.setItem("authToken", data.token);
          Cookies.set("token", data.token, { expires: 1, sameSite: "strict" });
        }

        // Redirect based on role
        window.location.href = role === "admin" ? "/dashboard/admin" : "/dashboard/reseller";
      } else if (res.status === 401) {
        const msg = data.error || "Invalid credentials. Please try again.";
        if (role === "admin") setAdminError(msg);
        else setResellerError(msg);
      } else {
        const msg = data.error || "Something went wrong. Please try again.";
        if (role === "admin") setAdminError(msg);
        else setResellerError(msg);
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg = "Failed to connect to the server.";
      if (role === "admin") setAdminError(msg);
      else setResellerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="reseller">Reseller</TabsTrigger>
        </TabsList>

        {/* ---------------- ADMIN LOGIN ---------------- */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <p className="text-sm text-gray-500">
                Login to manage your dashboard.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {adminError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  {adminError}
                </div>
              )}

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleLogin("admin")}
                disabled={loading}
              >
                {loading && activeTab === "admin" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {loading && activeTab === "admin" ? "Signing In..." : "Sign In"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ---------------- RESELLER LOGIN ---------------- */}
        <TabsContent value="reseller">
          <Card>
            <CardHeader>
              <CardTitle>Reseller Login</CardTitle>
              <p className="text-sm text-gray-500">
                Login with your reseller account.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {resellerError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  {resellerError}
                </div>
              )}

              <div>
                <Label>Username</Label>
                <Input
                  type="text"
                  placeholder="Reseller username"
                  value={resellerUsername}
                  onChange={(e) => setResellerUsername(e.target.value)}
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={resellerPassword}
                  onChange={(e) => setResellerPassword(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleLogin("reseller")}
                disabled={loading}
              >
                {loading && activeTab === "reseller" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {loading && activeTab === "reseller" ? "Signing In..." : "Sign In"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
