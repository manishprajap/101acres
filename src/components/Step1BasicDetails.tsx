"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import Pill from "./Pill";

import type {
  PartialFormData,
  PropertyFormData,
} from "@/types/property";

/* ============================================================
   OPTIONS
============================================================ */

const RESIDENTIAL_TYPES = [
  "Flat/Apartment",
  "Independent House / Villa",
  "Builder Floor",
  "Plot / Land",
  "1 RK/ Studio Apartment",
  "Serviced Apartment",
  "Farmhouse",
  "Other",
];

const COMMERCIAL_TYPES = [
  "Office",
  "Retail",
  "Plot / Land",
  "Storage",
  "Industry",
  "Hospitality",
  "Other",
];

const RETAIL_SPACE_TYPES = [
  "Commercial Shops",
  "Commercial Showrooms",
];

const LOCATED_INSIDE = [
  "Mall",
  "Commercial Project",
  "Residential Project",
  "Retail Complex/Building",
  "Market / High Street",
  "Others",
];

const INITIAL_VISIBLE_COUNT = 4;

/* ============================================================
   EXPANDABLE PILL GROUP
============================================================ */

interface ExpandablePillGroupProps {
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
  initialVisible?: number;
}

function ExpandablePillGroup({
  options,
  selected,
  onSelect,
  initialVisible = INITIAL_VISIBLE_COUNT,
}: ExpandablePillGroupProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [options]);

  const hasMore =
    options.length > initialVisible;

  const visibleOptions = expanded
    ? options
    : options.slice(0, initialVisible);

  return (
    <div className="pill-container">
      {visibleOptions.map((type) => (
        <Pill
          key={type}
          label={type}
          selected={selected === type}
          onClick={() => onSelect(type)}
        />
      ))}

      {hasMore && (
        <button
          type="button"
          className="view-more-toggle"
          onClick={() =>
            setExpanded((current) => !current)
          }
        >
          {expanded
            ? "View less"
            : `View more (+${
                options.length - initialVisible
              })`}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   REVEAL SECTION
============================================================ */

function RevealSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="reveal-section">
      {children}
    </div>
  );
}

/* ============================================================
   PROPS
============================================================ */

interface Step1Props {
  data: PropertyFormData;

  update: (
    partial: PartialFormData
  ) => void;

  onContinue: () => void;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Step1BasicDetails({
  data,
  update,
  onContinue,
}: Step1Props) {
  const set = <
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
     CATEGORY CHANGE
  ========================================================== */

  const setCategory = (
    category:
      | "Residential"
      | "Commercial"
  ) => {
    if (
      data.propertyCategory === category
    ) {
      return;
    }

    update({
      propertyCategory: category,
      propertyType: undefined,
      retailSpaceType: undefined,
      locatedInside: undefined,
    } as PartialFormData);
  };

  /* ==========================================================
     PROPERTY TYPE OPTIONS
  ========================================================== */

  const propertyTypeOptions =
    data.propertyCategory === "Residential"
      ? RESIDENTIAL_TYPES
      : COMMERCIAL_TYPES;

  /* ==========================================================
     VALIDATE STEP 1
  ========================================================== */

  const validateStep1 = (): boolean => {
    /* --------------------------------------------------------
       1. LOOKING TO
    -------------------------------------------------------- */

    if (!data.lookingTo) {
      Swal.fire({
        icon: "warning",
        title: "Required field",
        text: "Please select whether you want to Sell or Rent / Lease.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* --------------------------------------------------------
       2. PROPERTY CATEGORY
    -------------------------------------------------------- */

    if (!data.propertyCategory) {
      Swal.fire({
        icon: "warning",
        title: "Property category required",
        text: "Please select Residential or Commercial.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* --------------------------------------------------------
       3. PROPERTY TYPE
    -------------------------------------------------------- */

    if (!data.propertyType) {
      Swal.fire({
        icon: "warning",
        title: "Property type required",
        text: "Please select your property type.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* --------------------------------------------------------
       4. RETAIL SPACE TYPE
    -------------------------------------------------------- */

    if (
      data.propertyType === "Retail" &&
      !data.retailSpaceType
    ) {
      Swal.fire({
        icon: "warning",
        title: "Retail space type required",
        text: "Please select the type of retail space.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* --------------------------------------------------------
       5. LOCATED INSIDE
    -------------------------------------------------------- */

    if (
      data.retailSpaceType ===
        "Commercial Shops" &&
      !data.locatedInside
    ) {
      Swal.fire({
        icon: "warning",
        title: "Location type required",
        text: "Please select where your shop is located.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    return true;
  };

  /* ==========================================================
     CONTINUE
  ========================================================== */

  const handleContinue = () => {
    const isValid = validateStep1();

    if (!isValid) {
      // IMPORTANT:
      // Do not move to next step.
      return;
    }

    // Only redirect/change step after
    // all required fields are completed.
    onContinue();
  };

  return (
    <div className="step-container">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="step-header">

        <div className="step-badge">
          Step 1
        </div>

        <div className="header-content">
          <h1 className="page-title">
            Fill out basic details
          </h1>

          <p className="page-subtitle">
            Tell us a little about your
            property to get started.
          </p>
        </div>

      </div>

      {/* ======================================================
          LOOKING TO
      ====================================================== */}

      <section className="form-section">

        <div className="section-heading">

          <span className="section-number">
            01
          </span>

          <div>
            <label className="field-label">
              I&apos;m looking to
              <span className="required-star">
                *
              </span>
            </label>

            <p className="field-help">
              Choose what you want to do
              with this property.
            </p>
          </div>

        </div>

        <div className="pill-container">

          <Pill
            label="Sell"
            selected={
              data.lookingTo === "sell"
            }
            onClick={() =>
              set(
                "lookingTo",
                "sell"
              )
            }
          />

          <Pill
            label="Rent / Lease"
            selected={
              data.lookingTo === "rent"
            }
            onClick={() =>
              set(
                "lookingTo",
                "rent"
              )
            }
          />

        </div>

      </section>

      {/* ======================================================
          PROPERTY CATEGORY
      ====================================================== */}

      {data.lookingTo && (
        <RevealSection>

          <section className="form-section">

            <div className="section-heading">

              <span className="section-number">
                02
              </span>

              <div>

                <label className="field-label">
                  What kind of property
                  do you have?
                  <span className="required-star">
                    *
                  </span>
                </label>

                <p className="field-help">
                  Select residential or
                  commercial.
                </p>

              </div>

            </div>

            {/* CATEGORY CARDS */}

            <div className="category-grid">

              {/* RESIDENTIAL */}

              <label
                className={`category-card ${
                  data.propertyCategory ===
                  "Residential"
                    ? "active"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="propertyCategory"
                  checked={
                    data.propertyCategory ===
                    "Residential"
                  }
                  onChange={() =>
                    setCategory(
                      "Residential"
                    )
                  }
                />

                <span className="radio-circle">
                  <span />
                </span>

                <span className="category-content">

                  <strong>
                    Residential
                  </strong>

                  <small>
                    Homes, flats, villas
                  </small>

                </span>

              </label>

              {/* COMMERCIAL */}

              <label
                className={`category-card ${
                  data.propertyCategory ===
                  "Commercial"
                    ? "active"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="propertyCategory"
                  checked={
                    data.propertyCategory ===
                    "Commercial"
                  }
                  onChange={() =>
                    setCategory(
                      "Commercial"
                    )
                  }
                />

                <span className="radio-circle">
                  <span />
                </span>

                <span className="category-content">

                  <strong>
                    Commercial
                  </strong>

                  <small>
                    Shops, offices, land
                  </small>

                </span>

              </label>

            </div>

            {/* =================================================
                PROPERTY TYPE
            ================================================= */}

            {data.propertyCategory && (
              <RevealSection>

                <div className="sub-section">

                  <label className="field-label">
                    Select property type
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <p className="field-help">
                    Choose the type that
                    best describes your
                    property.
                  </p>

                  <div className="property-types">

                    <ExpandablePillGroup
                      options={
                        propertyTypeOptions
                      }
                      selected={
                        data.propertyType
                      }
                      onSelect={(
                        value
                      ) =>
                        set(
                          "propertyType",
                          value
                        )
                      }
                    />

                  </div>

                </div>

              </RevealSection>
            )}

          </section>

        </RevealSection>
      )}

      {/* ======================================================
          RETAIL SPACE TYPE
      ====================================================== */}

      {data.propertyType ===
        "Retail" && (
        <RevealSection>

          <section className="form-section">

            <div className="section-heading">

              <span className="section-number">
                03
              </span>

              <div>

                <label className="field-label">
                  What type of retail
                  space do you have?
                  <span className="required-star">
                    *
                  </span>
                </label>

                <p className="field-help">
                  Select the closest
                  match.
                </p>

              </div>

            </div>

            <div className="pill-container">

              {RETAIL_SPACE_TYPES.map(
                (type) => (
                  <Pill
                    key={type}
                    label={type}
                    selected={
                      data.retailSpaceType ===
                      type
                    }
                    onClick={() =>
                      set(
                        "retailSpaceType",
                        type
                      )
                    }
                  />
                )
              )}

            </div>

          </section>

        </RevealSection>
      )}

      {/* ======================================================
          LOCATED INSIDE
      ====================================================== */}

      {data.retailSpaceType ===
        "Commercial Shops" && (
        <RevealSection>

          <section className="form-section">

            <div className="section-heading">

              <span className="section-number">
                04
              </span>

              <div>

                <label className="field-label">
                  Your shop is located
                  inside
                  <span className="required-star">
                    *
                  </span>
                </label>

                <p className="field-help">
                  Select the location
                  type.
                </p>

              </div>

            </div>

            <div className="pill-container">

              {LOCATED_INSIDE.map(
                (type) => (
                  <Pill
                    key={type}
                    label={type}
                    selected={
                      data.locatedInside ===
                      type
                    }
                    onClick={() =>
                      set(
                        "locatedInside",
                        type
                      )
                    }
                  />
                )
              )}

            </div>

          </section>

        </RevealSection>
      )}

      {/* ======================================================
          ACTION
      ====================================================== */}

      <div className="action-area">

        <div className="action-copy">

          <span className="required-text">
            * Required fields
          </span>

          <span className="action-help">
            Complete the required
            details to continue.
          </span>

        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleContinue}
        >
          Continue

          <span className="arrow">
            →
          </span>
        </button>

      </div>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx>{`
        .step-container {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0 0 50px;
          box-sizing: border-box;
        }

        .step-header {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 26px;
        }

        .step-badge {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #eaf5ee;
          color: #087f45;
          font-size: 12px;
          font-weight: 700;
        }

        .header-content {
          min-width: 0;
        }

        .page-title {
          margin: 0;
          color: #101828;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.6px;
        }

        .page-subtitle {
          margin: 7px 0 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .form-section {
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
          border: 1px solid #e5eaf0;
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 17px;
          box-shadow:
            0 2px 8px
            rgba(16, 24, 40, 0.025);
        }

        .section-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-bottom: 18px;
        }

        .section-number {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f2f7ff;
          color: #1769aa;
          font-size: 11px;
          font-weight: 700;
        }

        .field-label {
          display: block;
          color: #172033;
          font-size: 15px;
          line-height: 1.4;
          font-weight: 650;
        }

        .required-star {
          color: #d92d20;
          margin-left: 4px;
          font-weight: 700;
        }

        .field-help {
          margin: 4px 0 0;
          color: #8a94a6;
          font-size: 12px;
          line-height: 1.45;
        }

        .pill-container {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .property-types {
          margin-top: 15px;
        }

        .view-more-toggle {
          border: 1px solid #d6e3f3;
          background: #f7fbff;
          color: #1267b1;
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease;
        }

        .view-more-toggle:hover {
          background: #edf6ff;
          border-color: #b9d5f1;
        }

        .category-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(240px, 1fr)
            );
          gap: 14px;
          width: 100%;
        }

        .category-card {
          position: relative;
          width: 100%;
          min-height: 82px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border: 1.5px solid #e1e6ed;
          border-radius: 13px;
          background: #ffffff;
          cursor: pointer;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .category-card:hover {
          border-color: #a9c9e8;
          background: #fbfdff;
          transform: translateY(-1px);
        }

        .category-card.active {
          border-color: #1683d8;
          background: #f5faff;
          box-shadow:
            0 0 0 3px
            rgba(
              22,
              131,
              216,
              0.08
            );
        }

        .category-card input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .radio-circle {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          border: 1.5px solid #b8c1cd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }

        .category-card.active
          .radio-circle {
          border-color: #1683d8;
        }

        .category-card.active
          .radio-circle span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #1683d8;
        }

        .category-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .category-content strong {
          color: #172033;
          font-size: 14px;
          font-weight: 650;
        }

        .category-content small {
          color: #8993a4;
          font-size: 11px;
          line-height: 1.4;
        }

        .sub-section {
          width: 100%;
          margin-top: 24px;
          padding-top: 21px;
          border-top:
            1px dashed #e2e7ed;
        }

        .reveal-section {
          animation:
            stepFadeIn
            0.25s
            ease-out;
        }

        @keyframes stepFadeIn {
          from {
            opacity: 0;
            transform:
              translateY(7px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .action-area {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 24px;
          padding: 4px 0;
        }

        .action-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .required-text {
          color: #344054;
          font-size: 13px;
          font-weight: 600;
        }

        .action-help {
          color: #98a2b3;
          font-size: 11px;
        }

        .primary-btn {
          min-width: 145px;
          height: 48px;
          border: none;
          border-radius: 9px;
          background: #087f45;
          color: #ffffff;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow:
            0 4px 10px
            rgba(
              8,
              127,
              69,
              0.18
            );
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .primary-btn:hover {
          background: #066d3b;
          transform:
            translateY(-1px);
          box-shadow:
            0 6px 14px
            rgba(
              8,
              127,
              69,
              0.22
            );
        }

        .primary-btn:active {
          transform:
            translateY(0);
        }

        .arrow {
          font-size: 17px;
          line-height: 1;
        }

        @media (max-width: 1000px) {
          .form-section {
            padding: 22px;
          }

          .category-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(180px, 1fr)
              );
          }
        }

        @media (max-width: 760px) {
          .step-container {
            padding: 0 0 30px;
          }

          .step-header {
            margin-bottom: 20px;
          }

          .page-title {
            font-size: 24px;
          }

          .page-subtitle {
            font-size: 13px;
          }

          .form-section {
            padding: 18px;
            border-radius: 13px;
            margin-bottom: 12px;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }

          .action-area {
            align-items: stretch;
            flex-direction: column;
          }

          .primary-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}