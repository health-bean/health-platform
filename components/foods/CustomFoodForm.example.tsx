"use client";

import { useState } from "react";
import { CustomFoodForm } from "./CustomFoodForm";

/**
 * Example usage of CustomFoodForm component
 * 
 * This demonstrates how to integrate the CustomFoodForm into your application.
 */
export default function CustomFoodFormExample() {
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = (food: any) => {
    console.log("Custom food created:", food);
    // You can add additional logic here, such as:
    // - Closing a modal
    // - Refreshing a food list
    // - Navigating to another page
    // - Showing a toast notification
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-warm-900">
        Custom Food Form Examples
      </h1>

      {/* Example 1: Standalone Form */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-warm-800">
          Example 1: Standalone Form
        </h2>
        <CustomFoodForm
          onSuccess={(food) => {
            console.log("Food created:", food);
            alert(`Successfully created: ${food.displayName}`);
          }}
        />
      </section>

      {/* Example 2: Form with Cancel Button */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-warm-800">
          Example 2: Form with Cancel Button
        </h2>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Custom Food
          </button>
        ) : (
          <CustomFoodForm onSuccess={handleSuccess} onCancel={handleCancel} />
        )}
      </section>

      {/* Example 3: Modal Usage (Conceptual) */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-warm-800">
          Example 3: Modal Usage (Conceptual)
        </h2>
        <div className="rounded-lg border border-warm-200 bg-warm-50 p-4">
          <p className="mb-2 text-sm text-warm-700">
            To use CustomFoodForm in a modal:
          </p>
          <pre className="overflow-x-auto rounded bg-warm-800 p-3 text-xs text-warm-100">
            {`<Modal isOpen={isOpen} onClose={handleClose}>
  <CustomFoodForm
    onSuccess={(food) => {
      // Handle success
      handleClose();
      refreshFoodList();
    }}
    onCancel={handleClose}
  />
</Modal>`}
          </pre>
        </div>
      </section>

      {/* Example 4: Integration with Food Search */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-warm-800">
          Example 4: Integration with Food Search
        </h2>
        <div className="rounded-lg border border-warm-200 bg-warm-50 p-4">
          <p className="mb-2 text-sm text-warm-700">
            When no search results are found, offer custom food creation:
          </p>
          <pre className="overflow-x-auto rounded bg-warm-800 p-3 text-xs text-warm-100">
            {`// In your food search component
if (searchResults.length === 0) {
  return (
    <div>
      <p>No foods found matching "{query}"</p>
      <button onClick={() => setShowCustomForm(true)}>
        Create Custom Food
      </button>
      {showCustomForm && (
        <CustomFoodForm
          onSuccess={(food) => {
            // Add the new food to search results
            setSearchResults([food]);
            setShowCustomForm(false);
          }}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  );
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}
