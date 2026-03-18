"use client";

import { useState } from "react";
import { StartReintroductionModal } from "./StartReintroductionModal";
import { Button } from "@/components/ui/button";

/**
 * Example usage of StartReintroductionModal component
 * 
 * This component demonstrates how to integrate the modal into your application.
 */
export function StartReintroductionModalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In a real application, you would get this from the user's session/context
  const userProtocolId = "example-protocol-id";

  const handleSuccess = () => {
    console.log("Reintroduction started successfully!");
    // Refresh data, show notification, etc.
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">StartReintroductionModal Example</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-warm-600">
          Click the button below to open the reintroduction modal.
        </p>
        
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Start Reintroduction
        </Button>
      </div>

      <StartReintroductionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        protocolId={userProtocolId}
      />

      <div className="mt-6 rounded-lg border border-warm-200 bg-warm-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-warm-900">
          Component Features
        </h3>
        <ul className="space-y-1 text-sm text-warm-600">
          <li>• Fetches eliminated foods from the recommendations API</li>
          <li>• Displays food selection dropdown with category information</li>
          <li>• Shows detailed 7-day reintroduction protocol instructions</li>
          <li>• Validates that no active reintroduction exists</li>
          <li>• Validates that the food hasn't been tested recently (14 days)</li>
          <li>• Handles API errors with user-friendly messages</li>
          <li>• Shows success confirmation before closing</li>
          <li>• Prevents closing during submission</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Example: Integration in a page component
 */
export function ReintroductionsPageExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reintroductions, setReintroductions] = useState([]);

  const refreshReintroductions = async () => {
    // Fetch updated reintroductions list
    const response = await fetch("/api/reintroductions");
    const data = await response.json();
    setReintroductions(data.reintroductions);
  };

  const handleReintroductionStarted = () => {
    // Refresh the list after starting a new reintroduction
    refreshReintroductions();
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-900">
          Food Reintroductions
        </h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Start New Reintroduction
        </Button>
      </div>

      {/* Reintroductions list would go here */}
      <div className="space-y-4">
        {reintroductions.length === 0 ? (
          <div className="rounded-lg border border-warm-200 bg-warm-50 p-8 text-center">
            <p className="text-sm text-warm-600">
              No reintroductions yet. Start your first one!
            </p>
          </div>
        ) : (
          <div>
            {/* Render reintroduction cards */}
          </div>
        )}
      </div>

      <StartReintroductionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReintroductionStarted}
        protocolId="user-protocol-id"
      />
    </div>
  );
}
