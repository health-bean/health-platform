"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/ui";
import { useSession } from "@/hooks/use-session";
import { ChevronRight } from "lucide-react";
import type { Protocol } from "@/types";

interface PhaseState {
  protocolName?: string;
  currentPhase?: {
    name: string;
    phaseOrder: number;
    totalPhases: number;
    dayNumber: number;
    daysRemaining: number | null;
    durationWeeks: number | null;
  } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProtocols, setLoadingProtocols] = useState(true);
  const [phaseState, setPhaseState] = useState<PhaseState | null>(null);
  const [advancing, setAdvancing] = useState(false);

  // Fetch available protocols
  useEffect(() => {
    async function fetchProtocols() {
      try {
        const res = await fetch("/api/protocols");
        if (res.ok) {
          const data = await res.json();
          setProtocols(data.protocols ?? []);
        }
      } catch (err) {
        console.error("Failed to load protocols:", err);
      } finally {
        setLoadingProtocols(false);
      }
    }

    fetchProtocols();
  }, []);

  // Fetch protocol phase state
  useEffect(() => {
    async function fetchPhaseState() {
      try {
        const res = await fetch("/api/protocols/state");
        if (res.ok) {
          const data = await res.json();
          if (data.states && data.states.length > 0) {
            setPhaseState(data.states[0]);
          }
        }
      } catch {
        // ignore
      }
    }
    fetchPhaseState();
  }, [saved]);

  // Set initial selection once we have user + protocols
  useEffect(() => {
    if (user && protocols.length > 0 && !selectedProtocolId) {
      const current = protocols.find(
        (p) => p.id === (user as unknown as { currentProtocolId?: string }).currentProtocolId
      );
      if (current) {
        setSelectedProtocolId(current.id);
      }
    }
  }, [user, protocols, selectedProtocolId]);

  async function handleSaveProtocol() {
    setSaving(true);
    setSaved(false);
    try {
      // Save to user profile
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProtocolId: selectedProtocolId || null }),
      });

      if (res.ok) {
        // Also initialize protocol state if the protocol has phases
        const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);
        if (selectedProtocol?.hasPhases && selectedProtocolId) {
          await fetch("/api/protocols/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ protocolId: selectedProtocolId }),
          });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save protocol:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvancePhase() {
    if (!selectedProtocolId) return;
    setAdvancing(true);
    try {
      const res = await fetch("/api/protocols/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolId: selectedProtocolId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.context) {
          setPhaseState({
            protocolName: data.context.protocolName,
            currentPhase: data.context.currentPhase,
          });
        }
      }
    } catch (err) {
      console.error("Failed to advance phase:", err);
    } finally {
      setAdvancing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);
  const phase = phaseState?.currentPhase;

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-lg font-semibold text-warm-900">Settings</h1>

      {/* Protocol section */}
      <Card header="Protocol" className="mb-4">
        {loadingProtocols ? (
          <div className="flex items-center gap-2 py-2">
            <Spinner size="sm" />
            <span className="text-sm text-warm-500">Loading protocols...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="protocol-select"
                className="text-sm font-medium text-warm-700"
              >
                Active protocol
              </label>
              <select
                id="protocol-select"
                value={selectedProtocolId}
                onChange={(e) => {
                  setSelectedProtocolId(e.target.value);
                  setSaved(false);
                }}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 min-h-[44px] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
              >
                <option value="">No protocol selected</option>
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProtocol && (
              <p className="text-sm text-warm-500">
                {selectedProtocol.description}
              </p>
            )}

            {/* Phase display */}
            {phase && (
              <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-900">
                      {phase.name}
                    </p>
                    <p className="text-xs text-teal-600">
                      Phase {phase.phaseOrder} of {phase.totalPhases}
                      {phase.durationWeeks && (
                        <> &middot; Day {phase.dayNumber} of {phase.durationWeeks * 7}</>
                      )}
                      {phase.daysRemaining !== null && phase.daysRemaining > 0 && (
                        <> &middot; {phase.daysRemaining} days remaining</>
                      )}
                    </p>
                  </div>
                  {phase.phaseOrder < (phase.totalPhases ?? 0) && (
                    <Button
                      onClick={handleAdvancePhase}
                      loading={advancing}
                      size="sm"
                      variant="secondary"
                    >
                      Next Phase
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {/* Progress bar */}
                {phase.durationWeeks && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-teal-200">
                    <div
                      className="h-1.5 rounded-full bg-teal-600 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (phase.dayNumber / (phase.durationWeeks * 7)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveProtocol}
                loading={saving}
                size="sm"
              >
                Save
              </Button>

              {saved && (
                <span className="text-sm text-green-600">
                  Protocol updated
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Account section */}
      <Card header="Account" className="mb-4">
        {user ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-warm-500">Name</p>
              <p className="text-sm font-medium text-warm-900">
                {user.firstName}
              </p>
            </div>
            <div>
              <p className="text-xs text-warm-500">Email</p>
              <p className="text-sm font-medium text-warm-900">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-warm-500">Not signed in</p>
        )}
      </Card>

      {/* Logout */}
      <Button variant="danger" onClick={handleLogout} className="w-full">
        Log Out
      </Button>
    </div>
  );
}
