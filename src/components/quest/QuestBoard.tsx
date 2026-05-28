"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocationCard } from "./LocationCard";
import { SvgDivider } from "@/components/ui/SvgDivider";
import type { Location, Submission } from "@/types/quest";

const ProgressMap = dynamic(() => import("./ProgressMap"), { ssr: false });

interface QuestBoardProps {
  locations: Location[];
  submissions: Submission[];
}

export function QuestBoard({
  locations,
  initialSubmissions,
}: {
  locations: Location[];
  initialSubmissions: Submission[];
}) {
  const [submissions, setSubmissions] =
    useState<Submission[]>(initialSubmissions);

  const getSubmission = (locationId: string) =>
    submissions.find((s) => s.locationId === locationId) ?? null;

  const handleSubmitted = (newSub: Submission) => {
    setSubmissions((prev) => {
      const without = prev.filter((s) => s.locationId !== newSub.locationId);
      return [...without, newSub];
    });
  };

  const approvedLocations = locations.filter(
    (loc) => getSubmission(loc.id)?.status === "APPROVED",
  );

  const totalCount = locations.length;
  const approvedCount = approvedLocations.length;
  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16">
      {/* Progress bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between font-[family-name:var(--font-cinzel)] text-[14px] tracking-widest text-[#868174] uppercase">
          <span>
            {approvedCount} of {totalCount} completed
          </span>
          {pendingCount > 0 && (
            <span className="text-amber-600">{pendingCount} pending</span>
          )}
        </div>
        <div className="h-px bg-[#433f37] relative overflow-hidden">
          <div
            className="h-full bg-[#d4cdbc] transition-all duration-700"
            style={{
              width: `${totalCount > 0 ? (approvedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Cards grid */}
      {locations.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-[family-name:var(--font-cinzel)] text-[#433f37] text-xs tracking-widest uppercase">
            No locations have been added yet.
          </p>
          <p className="mt-2 font-[family-name:var(--font-im-fell)] text-[#433f37] text-sm italic">
            The quest master is preparing the trials…
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              submission={getSubmission(loc.id)}
              onSubmitted={handleSubmitted}
            />
          ))}
        </div>
      )}

      {/* Summary map */}
      {approvedLocations.length > 0 && (
        <div className="mt-12 space-y-4">
          <SvgDivider />
          <div className="text-center">
            <p className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#868174] uppercase">
              Thy Conquered Grounds
            </p>
          </div>
          <ProgressMap locations={approvedLocations} totalCount={totalCount} />
        </div>
      )}
    </div>
  );
}
