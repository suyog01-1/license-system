"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";

export default function ResellerDashboard() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [reseller, setReseller] = useState<{ id: number; username: string; credits: number } | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);

  // track HWID reset success by license id
  const [hwidResetStatus, setHwidResetStatus] = useState<Record<number, string>>({});

  async function fetchLicenses() {
    const res = await fetch("/api/licenses");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setLicenses(data);
      } else {
        setLicenses(data.licenses || []);
        setReseller(data.reseller || null);
      }
    }
  }

  useEffect(() => {
    fetchLicenses();
  }, []);

  function generateRandomKey() {
    setUsername(nanoid(12));
  }

  async function createLicense() {
    if (!username.trim()) {
      alert("Please enter or generate a username");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, days }),
    });
    setLoading(false);

    if (res.ok) {
      setUsername("");
      setPassword("");
      setDays("");
      fetchLicenses();
    } else if (res.status === 409) {
      alert("Username already taken.");
    } else if (res.status === 400) {
      const { error } = await res.json();
      alert(error);
    } else {
      alert("Error creating license");
    }
  }

  async function updateLicense(id: number, field: string, value?: any) {
    const res = await fetch("/api/licenses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, field, value }),
    });
    if (res.ok) fetchLicenses();
    else alert("Error updating license");
  }

  async function resetHwid(id: number) {
    const res = await fetch("/api/licenses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, field: "resetHwid" }),
    });
    if (res.ok) {
      setHwidResetStatus((prev) => ({ ...prev, [id]: "HWID reset successful" }));
      fetchLicenses();
    } else {
      setHwidResetStatus((prev) => ({ ...prev, [id]: "Failed to reset HWID" }));
    }

    // clear message after 3s
    setTimeout(() => {
      setHwidResetStatus((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }, 3000);
  }

  async function deleteLicense(id: number) {
    if (!confirm("Are you sure you want to delete this license?")) return;
    const res = await fetch("/api/licenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resellerId: reseller?.id }),
    });
    if (res.ok) fetchLicenses();
    else alert("Error deleting license");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reseller Dashboard</h1>

      {reseller && (
        <div className="bg-gray-100 p-3 rounded-md">
          <p><strong>Reseller:</strong> {reseller.username}</p>
          <p><strong>Credits:</strong> {reseller.credits}</p>
        </div>
      )}

      {/* Create License */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Username (or generate)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button
          className="!bg-indigo-600 !text-white hover:!bg-indigo-700"
          onClick={generateRandomKey}
        >
          Generate Random
        </Button>
        <Input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          placeholder="Days"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
        <Button
          className="!bg-blue-600 !text-white hover:!bg-blue-700"
          onClick={createLicense}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </div>

      {/* Licenses Table */}
      <table className="w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Key</th>
            <th className="p-2 border">Password</th>
            <th className="p-2 border">Expires</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">HWID</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((l) => {
            const expired = l.expiresAt && new Date(l.expiresAt) < new Date();
            return (
              <tr key={l.id} className="text-center">
                <td className="p-2 border">{l.id}</td>
                <td className="p-2 border font-mono">{l.username}</td>
                <td className="p-2 border">{l.password}</td>
                <td className="p-2 border">
                  {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="p-2 border">
                  {expired ? (
                    <span className="text-red-600 font-semibold">Expired</span>
                  ) : l.revoked ? (
                    <span className="text-gray-600">Revoked</span>
                  ) : l.paused ? (
                    <span className="text-yellow-600">Paused</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </td>
                <td className="p-2 border">{l.hwid || "-"}</td>
                <td className="p-2 border flex flex-col items-center gap-1">
                  {!expired && (
                    <>
                      <Button
                        className="!bg-yellow-500 !text-white hover:!bg-yellow-600"
                        onClick={() => updateLicense(l.id, "paused", !l.paused)}
                      >
                        {l.paused ? "Unpause" : "Pause"}
                      </Button>
                      <Button
                        className="!bg-gray-800 !text-white hover:!bg-gray-900"
                        onClick={() => updateLicense(l.id, "revoked", !l.revoked)}
                      >
                        {l.revoked ? "Unrevoke" : "Revoke"}
                      </Button>
                      <div className="flex flex-col items-center">
                        <Button
                          className="!bg-purple-600 !text-white hover:!bg-purple-700"
                          onClick={() => resetHwid(l.id)}
                        >
                          Reset HWID
                        </Button>
                        {hwidResetStatus[l.id] && (
                          <span className="text-xs text-green-600 mt-1">
                            {hwidResetStatus[l.id]}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  <Button
                    className="!bg-red-600 !text-white hover:!bg-red-700"
                    onClick={() => deleteLicense(l.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
