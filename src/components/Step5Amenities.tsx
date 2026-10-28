"use client";

import type { ChangeEvent } from "react";
import Swal from "sweetalert2";

import Pill from "./Pill";

import type {
  PartialFormData,
  PropertyFormData,
} from "@/types/property";

/* ============================================================
   OPTIONS
============================================================ */

const AMENITIES = [
  "Service / Goods Lift",
  "Maintenance Staff",
  "Water Storage",
  "Waste Disposal",
  "Rain Water Harvesting",
  "ATM",
  "Security / Fire Alarm",
  "Near Bank",
  "Visitor Parking",
  "Security Guard",
  "Lift(s)",
];

const PROPERTY_FEATURES = [
  "Private Garden",
  "Covered Parking",
  "Open Parking",
  "Centrally Air Conditioned",
  "Power Back-up",
  "Reserved Parking",
  "Vaastu Compliant",
  "Intercom Facility",
];

const SOCIETY_FEATURES = [
  "Roof Rights",
  "Gated Society",
  "Shopping Centre",
  "Gymnasium",
  "WheelChair Accessibility",
  "DG Availability",
  "CCTV Surveillance",
  "Grade A Building",
  "Grocery Shop",
  "Swimming Pool",
  "Club house",
];

const ADDITIONAL_FEATURES = [
  "Bank Attached Property",
];

const FIRE_SAFETY = [
  "Fire Extinguisher",
  "Fire Sensors",
  "Sprinklers",
  "Fire Hose",
];

const OWNERSHIP_OPTIONS = [
  "Freehold",
  "Leasehold",
  "Co-operative society",
  "Power of Attorney",
];

const FACING_OPTIONS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

const LOCATED_NEAR = [
  "Entrance",
  "Elevator",
  "Stairs",
];

const LOCATION_ADVANTAGES = [
  "Close to Metro Station",
  "Close to School",
  "Close to Hospital",
  "Close to Market",
  "Close to Railway Station",
  "Close to Mall",
  "Close to Airport",
  "Close to Highway",
];

const BUSINESS_TYPES = [
  "Retail / Apparel",
  "Food & Beverage",
  "Electronics",
  "Grocery / Supermarket",
  "Salon / Spa",
  "Pharmacy",
  "Bank / ATM",
  "Showroom",
  "Other",
];

/* ============================================================
   LIST FIELD TYPES
============================================================ */

type ListFieldKey = Extract<
  keyof PropertyFormData,
  | "amenities"
  | "propertyFeatures"
  | "societyFeatures"
  | "additionalFeatures"
  | "fireSafety"
  | "locatedNear"
  | "locationAdvantages"
>;

/* ============================================================
   MULTI PILL GROUP
============================================================ */

interface MultiPillGroupProps {
  title: string;
  options: string[];
  selected?: string[];
  onToggle: (value: string) => void;
  prefixAll?: boolean;
}

function MultiPillGroup({
  title,
  options,
  selected = [],
  onToggle,
  prefixAll = true,
}: MultiPillGroupProps) {
  return (
    <div className="field-group">
      <label className="field-label">
        {title}
      </label>

      <div className="pill-row">
        {options.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={selected.includes(
              option
            )}
            onClick={() =>
              onToggle(option)
            }
            prefix={prefixAll}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PROPS
============================================================ */

interface Step5Props {
  data: PropertyFormData;
  update: (partial: PartialFormData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Step5Amenities({
  data,
  update,
  onSubmit,
  onBack,
}: Step5Props) {
  /* ==========================================================
     TOGGLE LIST
  ========================================================== */

  const toggleInList = (
    key: ListFieldKey,
    value: string
  ) => {
    const list = data[key] || [];

    const next = list.includes(value)
      ? list.filter(
          (item) => item !== value
        )
      : [...list, value];

    update({
      [key]: next,
    } as PartialFormData);
  };

  /* ==========================================================
     SET INPUT
  ========================================================== */

  const set =
    (key: keyof PropertyFormData) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >
    ) => {
      update({
        [key]: e.target.value,
      } as PartialFormData);
    };

  /* ==========================================================
     SET VALUE
  ========================================================== */

  const setVal = <
    K extends keyof PropertyFormData
  >(
    key: K,
    value: PropertyFormData[K]
  ) => {
    update({
      [key]: value,
    } as PartialFormData);
  };

  /* ==========================================================
     FINAL SUBMIT
     
     Since ALL fields on this page are optional,
     no required-field validation is performed.
     
     We only ask for confirmation.
  ========================================================== */

  const handleSubmit = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Submit property?",
      text: "Are you sure you want to save and submit this property listing?",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Review",
      confirmButtonColor: "#087f45",
      cancelButtonColor: "#667085",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    /*
     * Only after confirmation.
     */
    onSubmit();
  };

  return (
    <>
      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        type="button"
        className="back-link"
        onClick={onBack}
      >
        ← Back
      </button>

      {/* ======================================================
          TITLE
      ====================================================== */}

      <h1 className="page-title">
        Add amenities / unique features
      </h1>

      <p className="page-subtitle">
        These fields are used to populate USP
        &amp; caption. All fields on this page
        are optional.
      </p>

      {/* ======================================================
          AMENITIES
      ====================================================== */}

      <MultiPillGroup
        title="Amenities"
        options={AMENITIES}
        selected={data.amenities}
        onToggle={(value) =>
          toggleInList(
            "amenities",
            value
          )
        }
      />

      {/* ======================================================
          PROPERTY FEATURES
      ====================================================== */}

      <MultiPillGroup
        title="Property Features"
        options={PROPERTY_FEATURES}
        selected={
          data.propertyFeatures
        }
        onToggle={(value) =>
          toggleInList(
            "propertyFeatures",
            value
          )
        }
      />

      {/* ======================================================
          SOCIETY FEATURES
      ====================================================== */}

      <MultiPillGroup
        title="Society / Building features"
        options={SOCIETY_FEATURES}
        selected={
          data.societyFeatures
        }
        onToggle={(value) =>
          toggleInList(
            "societyFeatures",
            value
          )
        }
      />

      {/* ======================================================
          ADDITIONAL FEATURES
      ====================================================== */}

      <MultiPillGroup
        title="Additional Features"
        options={
          ADDITIONAL_FEATURES
        }
        selected={
          data.additionalFeatures
        }
        onToggle={(value) =>
          toggleInList(
            "additionalFeatures",
            value
          )
        }
      />

      {/* ======================================================
          OTHER FEATURES
      ====================================================== */}

      <div className="field-group">
        <label className="field-label">
          Other Features
        </label>

        <div className="checkbox-row">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={
                !!data.mainRoadFacing
              }
              onChange={(e) =>
                setVal(
                  "mainRoadFacing",
                  e.target.checked
                )
              }
            />

            Main Road Facing
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={
                !!data.cornerProperty
              }
              onChange={(e) =>
                setVal(
                  "cornerProperty",
                  e.target.checked
                )
              }
            />

            Corner Property
          </label>
        </div>
      </div>

      {/* ======================================================
          FIRE SAFETY
      ====================================================== */}

      <MultiPillGroup
        title="Fire safety measures include"
        options={FIRE_SAFETY}
        selected={data.fireSafety}
        onToggle={(value) =>
          toggleInList(
            "fireSafety",
            value
          )
        }
      />

      {/* ======================================================
          OWNERSHIP
      ====================================================== */}

      <div className="field-group">
        <label className="field-label">
          Ownership
        </label>

        <div className="pill-row">
          {OWNERSHIP_OPTIONS.map(
            (option) => (
              <Pill
                key={option}
                label={option}
                selected={
                  data.ownership ===
                  option
                }
                onClick={() =>
                  setVal(
                    "ownership",
                    option
                  )
                }
              />
            )
          )}
        </div>
      </div>

      {/* ======================================================
          FACING
      ====================================================== */}

      <div className="field-group">
        <label className="field-label">
          Property facing
        </label>

        <div className="pill-row">
          {FACING_OPTIONS.map(
            (option) => (
              <Pill
                key={option}
                label={option}
                selected={
                  data.propertyFacing ===
                  option
                }
                onClick={() =>
                  setVal(
                    "propertyFacing",
                    option
                  )
                }
              />
            )
          )}
        </div>
      </div>

      {/* ======================================================
          ROAD WIDTH
      ====================================================== */}

      <div className="field-group">
        <label className="field-label">
          Width of facing road
        </label>

        <div
          className="unit-input"
          style={{
            maxWidth: 320,
          }}
        >
          <input
            type="number"
            min="0"
            placeholder="Enter the width"
            value={
              data.facingRoadWidth ||
              ""
            }
            onChange={set(
              "facingRoadWidth"
            )}
          />

          <select
            value={
              data.facingRoadWidthUnit ||
              "Feet"
            }
            onChange={set(
              "facingRoadWidthUnit"
            )}
          >
            <option>Feet</option>
            <option>Meter</option>
          </select>
        </div>
      </div>

      {/* ======================================================
          LOCATED NEAR
      ====================================================== */}

      <MultiPillGroup
        title="Located Near (Optional)"
        options={LOCATED_NEAR}
        selected={
          data.locatedNear
        }
        onToggle={(value) =>
          toggleInList(
            "locatedNear",
            value
          )
        }
      />

      {/* ======================================================
          BUSINESS TYPE
      ====================================================== */}

      <div className="field-group">
        <label className="field-label">
          Suitable for business types
        </label>

        <select
          className="select-input"
          value={
            data.suitableBusinessType ||
            ""
          }
          onChange={set(
            "suitableBusinessType"
          )}
        >
          <option value="">
            Select business type
          </option>

          {BUSINESS_TYPES.map(
            (business) => (
              <option
                key={business}
              >
                {business}
              </option>
            )
          )}
        </select>
      </div>

      {/* ======================================================
          LOCATION ADVANTAGES
      ====================================================== */}

      <div className="field-group">
        <label className="field-label">
          Location Advantages{" "}
          <span className="field-hint">
            Highlight the nearby landmarks
          </span>
        </label>

        <div className="pill-row">
          {LOCATION_ADVANTAGES.map(
            (option) => (
              <Pill
                key={option}
                label={option}
                selected={(
                  data.locationAdvantages ||
                  []
                ).includes(option)}
                onClick={() =>
                  toggleInList(
                    "locationAdvantages",
                    option
                  )
                }
                prefix
              />
            )
          )}
        </div>

        <p className="helper-text">
          *Please provide correct
          information, otherwise your
          listing might get blocked.
        </p>
      </div>

      {/* ======================================================
          SUBMIT
      ====================================================== */}

      <div className="submit-area">
        <div className="submit-info">
          <span className="optional-info">
            All fields are optional
          </span>

          <span className="action-help">
            Add details to make your
            property listing more informative.
          </span>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
        >
          Save and Submit
          <span className="arrow">
            →
          </span>
        </button>
      </div>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx>{`
        .back-link {
          display: inline-flex;
          border: none;
          background: transparent;
          color: #1267b1;
          font-size: 13px;
          font-weight: 600;
          padding: 0;
          margin-bottom: 20px;
          cursor: pointer;
        }

        .back-link:hover {
          color: #087f45;
        }

        .page-title {
          margin: 0;
          color: #101828;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          margin: 8px 0 25px;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .field-group {
          width: 100%;
          margin-bottom: 24px;
        }

        .field-label {
          display: block;
          margin-bottom: 10px;
          color: #344054;
          font-size: 13px;
          font-weight: 600;
        }

        .field-hint {
          color: #98a2b3;
          font-size: 11px;
          font-weight: 500;
        }

        .pill-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
        }

        .checkbox-row {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 4px;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475467;
          font-size: 12px;
          cursor: pointer;
        }

        .checkbox-option input {
          width: 15px;
          height: 15px;
          accent-color: #087f45;
          cursor: pointer;
        }

        .unit-input {
          display: flex;
          width: 100%;
          height: 46px;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          overflow: hidden;
          background: #fff;
        }

        .unit-input:focus-within {
          border-color: #1683d8;
          box-shadow:
            0 0 0 3px
            rgba(22, 131, 216, 0.08);
        }

        .unit-input input {
          min-width: 0;
          flex: 1;
          border: none;
          outline: none;
          padding: 0 13px;
          font-size: 13px;
        }

        .unit-input select {
          width: 100px;
          border: none;
          border-left: 1px solid #e4e7ec;
          outline: none;
          background: #f9fafb;
          color: #475467;
          padding: 0 8px;
        }

        .select-input {
          width: 100%;
          height: 46px;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 0 13px;
          background: #fff;
          color: #344054;
          font-size: 13px;
          outline: none;
        }

        .select-input:focus {
          border-color: #1683d8;
          box-shadow:
            0 0 0 3px
            rgba(22, 131, 216, 0.08);
        }

        .helper-text {
          margin: 8px 0 0;
          color: #98a2b3;
          font-size: 11px;
          line-height: 1.5;
        }

        .submit-area {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 30px;
          padding-bottom: 30px;
        }

        .submit-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .optional-info {
          color: #344054;
          font-size: 12px;
          font-weight: 600;
        }

        .action-help {
          color: #98a2b3;
          font-size: 11px;
        }

        .primary-btn {
          min-width: 175px;
          min-height: 48px;
          border: none;
          border-radius: 9px;
          background: #087f45;
          color: #fff;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          box-shadow:
            0 4px 10px
            rgba(8, 127, 69, 0.18);
          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .primary-btn:hover {
          background: #066d3b;
          transform: translateY(-1px);
        }

        .primary-btn:active {
          transform: translateY(0);
        }

        .arrow {
          font-size: 17px;
        }

        @media (max-width: 700px) {
          .page-title {
            font-size: 24px;
          }

          .submit-area {
            align-items: stretch;
            flex-direction: column;
          }

          .primary-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}