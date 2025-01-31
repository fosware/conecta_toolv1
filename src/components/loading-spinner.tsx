"use client";

export function LoadingSpinner() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
    </div>
  );
}
