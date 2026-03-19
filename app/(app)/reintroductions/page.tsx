"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { ReintroductionCard } from "@/components/reintroductions/ReintroductionCard";
import { ReintroductionHistory } from "@/components/reintroductions/ReintroductionHistory";
import { ReintroductionDetail } from "@/components/reintroductions/ReintroductionDetail";
import { ReintroductionRecommendations } from "@/components/reintroductions/ReintroductionRecommendations";
import { StartReintroductionModal } from "@/components/reintroductions/StartReintroductionModal";
import type { ReintroductionTrial } from "@/types";

type ViewMode = "overview" | "detail" | "recommendations";

export default function ReintroductionsPage() {
  const [activeReintroduction, setActiveReintroduction] = useState<ReintroductionTrial | null>(null);
  const [selectedReintroduction, setSelectedReintroduction] = useState<ReintroductionTrial | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's protocol
      const userRes = await fetch("/api/users/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setProtocolId(userData.user?.currentProtocolId || null);
      }

      // Fetch active reintroduction
      const reintroRes = await fetch("/api/reintroductions");
      if (reintroRes.ok) {
        const reintroData = await reintroRes.json();
        const active = reintroData.reintroductions?.find(
          (r: ReintroductionTrial) => r.status === "active"
        );
        setActiveReintroduction(active || null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (reintroduction: ReintroductionTrial) => {
    setSelectedReintroduction(reintroduction);
    setViewMode("detail");
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setSelectedReintroduction(null);
  };

  const handleStartReintroduction = () => {
    if (!protocolId) {
      alert("Please select a protocol first in your settings.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchData(); // Refresh data
  };

  const handleStopReintroduction = async () => {
    if (!activeReintroduction) return;

    if (!confirm("Are you sure you want to stop this reintroduction?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reintroductions/${activeReintroduction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to stop reintroduction");
      }
    } catch (error) {
      console.error("Error stopping reintroduction:", error);
      alert("Failed to stop reintroduction");
    }
  };

  const handleMarkPassed = async () => {
    if (!selectedReintroduction) return;

    try {
      const response = await fetch(`/api/reintroductions/${selectedReintroduction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_passed" }),
      });

      if (response.ok) {
        handleBackToOverview();
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to mark as passed");
      }
    } catch (error) {
      console.error("Error marking as passed:", error);
      alert("Failed to mark as passed");
    }
  };

  const handleMarkFailed = async () => {
    if (!selectedReintroduction) return;

    try {
      const response = await fetch(`/api/reintroductions/${selectedReintroduction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_failed" }),
      });

      if (response.ok) {
        handleBackToOverview();
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to mark as failed");
      }
    } catch (error) {
      console.error("Error marking as failed:", error);
      alert("Failed to mark as failed");
    }
  };

  const handleSelectRecommendedFood = () => {
    // This would open the modal with the food pre-selected
    // For now, just open the modal
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        {viewMode !== "overview" && (
          <button
            onClick={handleBackToOverview}
            className="mb-4 flex items-center gap-2 text-sm text-warm-600 hover:text-warm-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </button>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-warm-900">
              {viewMode === "overview" && "Reintroductions"}
              {viewMode === "detail" && "Reintroduction Details"}
              {viewMode === "recommendations" && "Recommended Foods"}
            </h1>
            <p className="mt-2 text-sm text-warm-600">
              {viewMode === "overview" && "Track your food reintroduction trials"}
              {viewMode === "detail" && "View detailed results and analysis"}
              {viewMode === "recommendations" && "Foods ready for reintroduction"}
            </p>
          </div>
          {viewMode === "overview" && (
            <div className="flex gap-3">
              <Button
                onClick={() => setViewMode("recommendations")}
              >
                View Recommendations
              </Button>
              <Button
                onClick={handleStartReintroduction}
                disabled={!!activeReintroduction || !protocolId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Start New
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === "overview" && (
        <div className="space-y-8">
          {/* Active Reintroduction */}
          {activeReintroduction && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-warm-900">Active Reintroduction</h2>
              <ReintroductionCard
                reintroduction={activeReintroduction}
                onStop={handleStopReintroduction}
                onViewDetails={() => handleViewDetails(activeReintroduction)}
              />
            </div>
          )}

          {/* History */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-warm-900">History</h2>
            <ReintroductionHistory onViewDetails={handleViewDetails} />
          </div>
        </div>
      )}

      {viewMode === "detail" && selectedReintroduction && (
        <ReintroductionDetail
          reintroductionId={selectedReintroduction.id}
          onClose={handleBackToOverview}
          onMarkPassed={handleMarkPassed}
          onMarkFailed={handleMarkFailed}
        />
      )}

      {viewMode === "recommendations" && protocolId && (
        <ReintroductionRecommendations
          protocolId={protocolId}
          onSelectFood={handleSelectRecommendedFood}
        />
      )}

      {/* Start Reintroduction Modal */}
      {protocolId && (
        <StartReintroductionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          protocolId={protocolId}
        />
      )}
    </div>
  );
}
