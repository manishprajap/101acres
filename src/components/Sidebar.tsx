"use client";

import type { PropertyFormData } from "@/types/property";

interface Step {
  id: number;
  title: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Basic Details" },
  { id: 2, title: "Location Details" },
  { id: 3, title: "Property Profile" },
  { id: 4, title: "Photos, Videos & Voice-over" },
  { id: 5, title: "Amenities section" },
];

function summaryFor(stepId: number, data: PropertyFormData): string | null {
  if (stepId === 1) {
    if (!data.propertyType) return null;
    return `${data.retailSpaceType || data.propertyType} for ${
      data.lookingTo === "rent" ? "Rent" : "Sale"
    }`;
  }
  if (stepId === 2) {
    if (!data.locality && !data.city) return null;
    return [data.locality, data.city].filter(Boolean).join(", ");
  }
  if (stepId === 3) {
    if (!data.carpetArea) return null;
    return `${data.carpetArea} ${data.carpetAreaUnit || "sq.ft."} Carpet Area`;
  }
  if (stepId === 4) {
    if (!data.photos || data.photos.length === 0) return "No Photos Uploaded";
    return `${data.photos.length} photo(s) added`;
  }
  return null;
}

interface SidebarProps {
  currentStep: number;
  data: PropertyFormData;
  onEditStep: (step: number) => void;
  scorePercent: number;
}

export default function Sidebar({
  currentStep,
  data,
  onEditStep,
  scorePercent,
}: SidebarProps) {
  return (
    <>
      <div className="sidebar">
        {STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          const summary = summaryFor(step.id, data);
          return (
            <div className="step-item" key={step.id}>
              <div
                className={`step-dot${active ? " active" : ""}${
                  done ? " done" : ""
                }`}
              >
                {done ? "✓" : active ? "●" : ""}
              </div>
              <div>
                <div className="step-title">{step.title}</div>
                <div className="step-sub">
                  {done && summary ? (
                    <>
                      {summary}
                      <span className="edit-link" onClick={() => onEditStep(step.id)}>
                        Edit
                      </span>
                    </>
                  ) : (
                    `Step ${step.id}`
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="score-card"
        style={{ "--pct": scorePercent } as React.CSSProperties}
      >
        <div
          className="score-ring"
          style={{ "--pct": scorePercent } as React.CSSProperties}
        >
          <div className="score-ring-inner">{scorePercent}%</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Property Score</div>
          <div style={{ fontSize: 12, color: "#8a93a0" }}>
            Better your property score, greater your visibility
          </div>
        </div>
      </div>
    </>
  );
}
