"use client";
import Cookies from "js-cookie";

export async function loginAction(email, password, role) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await res.json();

  if (res.ok) {
    // Store JWT securely in cookies
    Cookies.set("token", data.token, { expires: 1, sameSite: "Strict" });

    // Redirect to the correct dashboard
    if (role === "admin") {
      window.location.href = "/dashboard/admin";
    } else if (role === "reseller") {
      window.location.href = "/dashboard/reseller";
    } else {
      window.location.href = "/";
    }
  } else {
    alert(data.error || "Login failed");
  }
}
