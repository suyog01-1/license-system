// app/dashboard/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // lowercase 'button' to match your filesystem
import { Input } from "@/components/ui/input";

type License = any;
type Reseller = { id: number; username: string; credits: number; _count?: { licenses: number } };

export default function AdminDashboard() {
  // tabs: "licenses" | "resellers"
  const [activeTab, setActiveTab] = useState<"licenses" | "resellers">("licenses");

  // licenses (admin view)
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(true);

  // resellers
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loadingResellers, setLoadingResellers] = useState(false);

  // create license fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // reseller creation fields
  const [newResellerName, setNewResellerName] = useState("");
  const [newResellerPass, setNewResellerPass] = useState("");
  const [newResellerCredits, setNewResellerCredits] = useState("0");

  // UI messages
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // view reseller's licenses
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [selectedLicenses, setSelectedLicenses] = useState<License[] | null>(null);
  const [loadingSelectedLicenses, setLoadingSelectedLicenses] = useState(false);

  // ------------------- Fetch functions -------------------
  async function fetchLicenses() {
    setLoadingLicenses(true);
    try {
      const res = await fetch("/api/licenses", { credentials: "include" });
      if (!res.ok) {
        setMessage("Unauthorized. Please log in.");
        setLicenses([]);
        return;
      }
      const data = await res.json();
      // admin should get an array
      setLicenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessage("Error fetching licenses.");
    } finally {
      setLoadingLicenses(false);
    }
  }

  async function fetchResellers() {
    setLoadingResellers(true);
    try {
      const res = await fetch("/api/resellers", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err?.error || "Failed to fetch resellers");
        setResellers([]);
        return;
      }
      const data = await res.json();
      setResellers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessage("Error fetching resellers.");
    } finally {
      setLoadingResellers(false);
    }
  }

  useEffect(() => {
    // load licenses by default
    fetchLicenses();
    fetchResellers();
  }, []);

  // ------------------- License actions -------------------
  async function createLicense() {
    if (!username || !password || (!days && !expiryDate)) {
      setMessage("Please fill in all required fields.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          days: days || null,
          expiresAt: expiryDate || null,
          role: "user",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Failed to create license");
        return;
      }

      setMessage("License created successfully!");
      setLicenses((p) => [data, ...p]);
      setUsername("");
      setPassword("");
      setDays("");
      setExpiryDate("");
    } catch (err) {
      console.error(err);
      setMessage("Error creating license.");
    } finally {
      setBusy(false);
    }
  }

  async function updateLicense(id: number, field: string, value?: any) {
    setBusy(true);
    try {
      const res = await fetch("/api/licenses", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Failed to update license");
        return;
      }

      setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
      // if viewing selected reseller's licenses, refresh them too
      if (selectedReseller) await viewResellerLicenses(selectedReseller.id);
      setMessage("License updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Error updating license.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteLicense(id: number) {
    if (!confirm("Are you sure you want to delete this license?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/licenses", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err?.error || "Failed to delete");
        return;
      }
      setLicenses((prev) => prev.filter((l) => l.id !== id));
      if (selectedReseller) await viewResellerLicenses(selectedReseller.id);
      setMessage("License deleted.");
    } catch (err) {
      console.error(err);
      setMessage("Error deleting license.");
    } finally {
      setBusy(false);
    }
  }

  // ------------------- Reseller actions -------------------
  async function createReseller() {
    if (!newResellerName || !newResellerPass) {
      setMessage("Reseller username & password required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/resellers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newResellerName,
          password: newResellerPass,
          credits: Number(newResellerCredits || 0),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Failed to create reseller.");
        return;
      }
      setMessage("Reseller created.");
      setNewResellerName("");
      setNewResellerPass("");
      setNewResellerCredits("0");
      fetchResellers();
    } catch (err) {
      console.error(err);
      setMessage("Error creating reseller.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReseller(id: number) {
    if (!confirm("Delete reseller and all their licenses? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/resellers", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Failed to delete reseller.");
        return;
      }
      setMessage("Reseller deleted.");
      fetchResellers();
      // if we were viewing their licenses, clear view
      if (selectedReseller?.id === id) {
        setSelectedReseller(null);
        setSelectedLicenses(null);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error deleting reseller.");
    } finally {
      setBusy(false);
    }
  }

  async function editResellerCredits(id: number, credits: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/resellers/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Failed to update credits.");
        return;
      }
      setMessage("Credits updated.");
      fetchResellers();
      if (selectedReseller && selectedReseller.id === id) {
        setSelectedReseller((s) => (s ? { ...s, credits } : s));
      }
    } catch (err) {
      console.error(err);
      setMessage("Error updating credits.");
    } finally {
      setBusy(false);
    }
  }

  async function pauseAllForReseller(id: number, pause: boolean) {
    if (!confirm(`${pause ? "Pause" : "Unpause"} all keys for this reseller?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/resellers/pauseAll", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resellerId: id, pause }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Failed to update licenses.");
        return;
      }
      setMessage(data?.message || "Updated licenses.");
      // refresh lists
      fetchResellers();
      fetchLicenses();
      if (selectedReseller) viewResellerLicenses(selectedReseller.id);
    } catch (err) {
      console.error(err);
      setMessage("Error pausing licenses.");
    } finally {
      setBusy(false);
    }
  }

  // fetch reseller and show licenses
  async function viewResellerLicenses(id: number) {
    setLoadingSelectedLicenses(true);
    try {
      const res = await fetch(`/api/resellers/${id}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err?.error || "Failed to fetch reseller licenses");
        setSelectedLicenses([]);
        setSelectedReseller(null);
        return;
      }
      const data = await res.json();
      // data includes reseller + licenses (based on earlier server implementation)
      // but our /api/resellers/[id] returns {id, username, credits, licenses}
      setSelectedReseller({ id: data.id, username: data.username, credits: data.credits });
      setSelectedLicenses(Array.isArray(data.licenses) ? data.licenses : []);
      // switch to licenses tab and show the selected set
      setActiveTab("licenses");
      // also set main licenses to show the selected set so UI uses same table rendering
      setLicenses(Array.isArray(data.licenses) ? data.licenses : []);
    } catch (err) {
      console.error(err);
      setMessage("Error fetching reseller licenses.");
    } finally {
      setLoadingSelectedLicenses(false);
    }
  }

  // ------------------- Render -------------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="flex gap-2 items-center mb-4">
        <Button
          className={`!bg-slate-700 !text-white ${activeTab === "licenses" ? "opacity-100" : "opacity-80"}`}
          onClick={() => setActiveTab("licenses")}
        >
          Licenses
        </Button>
        <Button
          className={`!bg-slate-700 !text-white ${activeTab === "resellers" ? "opacity-100" : "opacity-80"}`}
          onClick={() => setActiveTab("resellers")}
        >
          Resellers
        </Button>

        <div className="ml-auto text-sm text-gray-600">{message}</div>
      </div>

      {activeTab === "licenses" && (
        <div>
          {/* Create License */}
          <div className="p-4 mb-6 border rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create License</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} />
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
            <Button onClick={createLicense} className="mt-4 !bg-green-600 !text-white">
              Create
            </Button>

            {/* If selectedReseller is set, show a small badge so admin knows filters are active */}
            {selectedReseller && (
              <div className="mt-3 text-sm">
                Viewing licenses for reseller: <strong>{selectedReseller.username}</strong>{" "}
                <Button onClick={() => { setSelectedReseller(null); fetchLicenses(); }} className="ml-2 !bg-gray-300 !text-black">
                  Clear view
                </Button>
              </div>
            )}
          </div>

          {/* Licenses Table */}
          <div className="border rounded-lg shadow overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Expires At</th>
                  <th className="p-2 border">Paused</th>
                  <th className="p-2 border">Revoked</th>
                  <th className="p-2 border">Expired</th>
                  <th className="p-2 border">HWID</th>
                  <th className="p-2 border">Created By</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingLicenses ? (
                  <tr><td colSpan={8} className="text-center p-4">Loading...</td></tr>
                ) : licenses.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-4">No licenses found.</td></tr>
                ) : (
                  licenses.map((license: any) => (
                    <tr key={license.id}>
                      <td className="p-2 border">{license.username}</td>
                      <td className="p-2 border">{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "—"}</td>

                      <td className="p-2 border">
                        {license.paused ? "Yes" : "No"}{" "}
                        {!license.expired && (
                          <Button className="ml-2 !bg-yellow-500 !text-white" onClick={() => updateLicense(license.id, "paused", !license.paused)}>Toggle</Button>
                        )}
                      </td>

                      <td className="p-2 border">
                        {license.revoked ? "Yes" : "No"}{" "}
                        {!license.expired && (
                          <Button className="ml-2 !bg-orange-500 !text-white" onClick={() => updateLicense(license.id, "revoked", !license.revoked)}>Toggle</Button>
                        )}
                      </td>

                      <td className="p-2 border">{license.expired ? <span className="text-red-600 font-semibold">Expired</span> : "Active"}</td>

                      <td className="p-2 border">
                        {license.hwid || "—"}{" "}
                        {!license.expired && <Button className="ml-2 !bg-purple-600 !text-white" onClick={() => updateLicense(license.id, "resetHwid")}>Reset</Button>}
                      </td>

                      <td className="p-2 border">{license.createdBy}</td>

                      <td className="p-2 border">
                        <Button className="!bg-red-600 !text-white" onClick={() => deleteLicense(license.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "resellers" && (
        <div>
          {/* Create reseller */}
          <div className="p-4 mb-6 border rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Reseller</h2>
            <div className="flex gap-2 flex-wrap">
              <Input placeholder="Username" value={newResellerName} onChange={(e) => setNewResellerName(e.target.value)} />
              <Input placeholder="Password" value={newResellerPass} onChange={(e) => setNewResellerPass(e.target.value)} />
              <Input placeholder="Credits" value={newResellerCredits} onChange={(e) => setNewResellerCredits(e.target.value)} />
              <Button onClick={createReseller} className="!bg-blue-600 !text-white">Create Reseller</Button>
              <Button onClick={() => fetchResellers()} className="!bg-gray-300 !text-black">Refresh</Button>
            </div>
          </div>

          {/* Resellers table */}
          <div className="border rounded-lg shadow overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Credits</th>
                  <th className="p-2 border">License Count</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingResellers ? (
                  <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
                ) : resellers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-4">No resellers found.</td></tr>
                ) : (
                  resellers.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 border">{r.id}</td>
                      <td className="p-2 border">{r.username}</td>
                      <td className="p-2 border">
                        <InlineCreditsEditor
                          id={r.id}
                          initial={r.credits}
                          onSave={(newCredits) => editResellerCredits(r.id, newCredits)}
                        />
                      </td>
                      <td className="p-2 border">{r._count?.licenses ?? "-"}</td>
                      <td className="p-2 border flex gap-2">
                        <Button className="!bg-indigo-600 !text-white" onClick={() => viewResellerLicenses(r.id)}>View Licenses</Button>
                        <Button className="!bg-yellow-500 !text-white" onClick={() => pauseAllForReseller(r.id, true)}>Pause All</Button>
                        <Button className="!bg-green-500 !text-white" onClick={() => pauseAllForReseller(r.id, false)}>Unpause All</Button>
                        <Button className="!bg-red-600 !text-white" onClick={() => deleteReseller(r.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected reseller license viewer (if any) */}
      {selectedReseller && (
        <div className="mt-6 border rounded p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <strong>Reseller:</strong> {selectedReseller.username} — <strong>Credits:</strong> {selectedReseller.credits}
            </div>
            <div>
              <Button className="!bg-gray-300 !text-black mr-2" onClick={() => { setSelectedReseller(null); setSelectedLicenses(null); fetchLicenses(); }}>
                Close
              </Button>
              <Button className="!bg-gray-300 !text-black" onClick={() => viewResellerLicenses(selectedReseller.id)}>
                Refresh
              </Button>
            </div>
          </div>

          {loadingSelectedLicenses ? <div>Loading reseller licenses...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr className="bg-white"><th className="p-2 border">Key</th><th className="p-2 border">Expires</th><th className="p-2 border">Status</th><th className="p-2 border">Actions</th></tr></thead>
                <tbody>
                  {selectedLicenses && selectedLicenses.length ? selectedLicenses.map((l: any) => (
                    <tr key={l.id}>
                      <td className="p-2 border">{l.username}</td>
                      <td className="p-2 border">{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : "—"}</td>
                      <td className="p-2 border">{l.revoked ? "Revoked" : l.paused ? "Paused" : l.expired ? "Expired" : "Active"}</td>
                      <td className="p-2 border flex gap-2">
                        {!l.expired && <Button className="!bg-yellow-500 !text-white" onClick={() => updateLicense(l.id, "paused", !l.paused)}>{l.paused ? "Unpause" : "Pause"}</Button>}
                        {!l.expired && <Button className="!bg-orange-500 !text-white" onClick={() => updateLicense(l.id, "revoked", !l.revoked)}>{l.revoked ? "Unrevoke" : "Revoke"}</Button>}
                        <Button className="!bg-purple-600 !text-white" onClick={() => updateLicense(l.id, "resetHwid")}>Reset HWID</Button>
                        <Button className="!bg-red-600 !text-white" onClick={() => deleteLicense(l.id)}>Delete</Button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={4} className="p-3 text-center">No licenses for this reseller</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * InlineCreditsEditor
 * small local component to edit credits inline
 */
function InlineCreditsEditor({ id, initial, onSave }: { id: number; initial: number; onSave: (n: number) => Promise<any> | void }) {
  const [val, setVal] = useState(String(initial));
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = Number(val || 0);
    if (isNaN(n) || n < 0) {
      alert("Invalid credits");
      return;
    }
    setSaving(true);
    try {
      await onSave(n);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input className="border p-1 w-20 text-sm" value={val} onChange={(e) => setVal(e.target.value)} />
      <Button className="!bg-green-600 !text-white text-sm" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
