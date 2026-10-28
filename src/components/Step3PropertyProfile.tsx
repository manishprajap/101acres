"use client";

import type { ChangeEvent } from "react";
import Swal from "sweetalert2";

import Pill from "./Pill";

import type {
  PartialFormData,
  PropertyFormData,
} from "@/types/property";

const AGE_OPTIONS = [
  "0-1 years",
  "1-5 years",
  "5-10 years",
  "10+ years",
];

/* ============================================================
   PRICE FORMATTER
============================================================ */

function numberToIndianWords(
  numStr?: string
): string {
  if (!numStr) return "";

  const n = Number(numStr);

  if (Number.isNaN(n)) return "";

  return `₹ ${n.toLocaleString("en-IN")}`;
}

/* ============================================================
   PROPS
============================================================ */

interface Step3Props {
  data: PropertyFormData;
  update: (partial: PartialFormData) => void;
  onContinue: () => void;
  onBack: () => void;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Step3PropertyProfile({
  data,
  update,
  onContinue,
  onBack,
}: Step3Props) {
  /* ==========================================================
     NORMAL INPUT SETTER
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
     VALUE SETTER
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
     VALIDATION
  ========================================================== */

  const validateStep3 = (): boolean => {
    const carpetArea =
      data.carpetArea?.toString().trim() || "";

    const expectedPrice =
      data.expectedPrice?.toString().trim() || "";

    const currentRent =
      data.currentRent?.toString().trim() || "";

    const leaseTenure =
      data.leaseTenure?.toString().trim() || "";

    const expectedReturns =
      data.expectedReturns?.toString().trim() || "";

    /* ========================================================
       1. CARPET AREA
    ======================================================== */

    if (!carpetArea) {
      Swal.fire({
        icon: "warning",
        title: "Carpet area is required",
        text: "Please enter the carpet area of your property.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    if (Number(carpetArea) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid carpet area",
        text: "Carpet area must be greater than 0.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       2. WASHROOM
    ======================================================== */

    if (!data.washroom) {
      Swal.fire({
        icon: "warning",
        title: "Washroom details required",
        text: "Please select the washroom availability.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       3. PARKING
    ======================================================== */

    if (!data.parking) {
      Swal.fire({
        icon: "warning",
        title: "Parking details required",
        text: "Please select the parking type.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       4. AVAILABILITY
    ======================================================== */

    if (!data.availability) {
      Swal.fire({
        icon: "warning",
        title: "Availability status required",
        text: "Please select the availability status of your property.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       5. PROPERTY AGE
    ======================================================== */

    if (!data.propertyAge) {
      Swal.fire({
        icon: "warning",
        title: "Property age required",
        text: "Please select the age of your property.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       6. EXPECTED PRICE
    ======================================================== */

    if (!expectedPrice) {
      Swal.fire({
        icon: "warning",
        title: "Expected price required",
        text: "Please enter the expected price of your property.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    if (Number(expectedPrice) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid expected price",
        text: "Expected price must be greater than 0.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       7. PRE-LEASED / PRE-RENTED
    ======================================================== */

    if (!data.preLeased) {
      Swal.fire({
        icon: "warning",
        title: "Please select an option",
        text: "Please specify whether the property is Pre-leased / Pre-rented.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    /* ========================================================
       8. PRE-LEASED DETAILS
       
       Only required when user selects YES.
    ======================================================== */

    if (data.preLeased === "Yes") {
      if (!currentRent) {
        Swal.fire({
          icon: "warning",
          title: "Current rent is required",
          text: "Please enter the current monthly rent.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#087f45",
        });

        return false;
      }

      if (Number(currentRent) <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid current rent",
          text: "Current rent must be greater than 0.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#087f45",
        });

        return false;
      }

      if (!leaseTenure) {
        Swal.fire({
          icon: "warning",
          title: "Lease tenure is required",
          text: "Please enter the lease tenure in years.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#087f45",
        });

        return false;
      }

      if (Number(leaseTenure) <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid lease tenure",
          text: "Lease tenure must be greater than 0.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#087f45",
        });

        return false;
      }
    }

    /* ========================================================
       9. EXPECTED ANNUAL RETURNS
    ======================================================== */

    if (!expectedReturns) {
      Swal.fire({
        icon: "warning",
        title: "Expected annual returns required",
        text: "Please enter the expected annual returns.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    if (
      Number(expectedReturns) < 0 ||
      Number(expectedReturns) > 100
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid annual returns",
        text: "Expected annual returns should be between 0% and 100%.",
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
    const isValid = validateStep3();

    /*
     * IMPORTANT:
     * Do not move to Step 4 if validation fails.
     */
    if (!isValid) {
      return;
    }

    /*
     * Only after every required field
     * has passed validation.
     */
    onContinue();
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
          PAGE TITLE
      ====================================================== */}

      <h1 className="page-title">
        Tell us about your property
      </h1>

      <p className="page-subtitle">
        Add important details about your property
        to help buyers understand it better.
      </p>

      {/* ======================================================
          AREA DETAILS
      ====================================================== */}

      <div className="section-title">
        Add Area Details

        <span className="required-badge">
          Required
        </span>
      </div>

      <div className="field-group">
        <div
          className="unit-input"
          style={{ maxWidth: 320 }}
        >
          <input
            type="number"
            min="1"
            placeholder="Carpet Area *"
            value={data.carpetArea || ""}
            onChange={set("carpetArea")}
          />

          <select
            value={
              data.carpetAreaUnit ||
              "sq.ft."
            }
            onChange={set(
              "carpetAreaUnit"
            )}
          >
            <option>sq.ft.</option>
            <option>sq.m.</option>
            <option>sq.yd.</option>
          </select>
        </div>

        <p className="field-help">
          Carpet area is mandatory.
        </p>
      </div>

      {/* ======================================================
          WASHROOM
      ====================================================== */}

      <div className="section-title">
        Washroom details
        <span className="required-star">
          *
        </span>
      </div>

      <div className="field-group pill-row">
        <Pill
          label="Private washrooms"
          selected={
            data.washroom ===
            "Private washrooms"
          }
          onClick={() =>
            setVal(
              "washroom",
              "Private washrooms"
            )
          }
        />

        <Pill
          label="Public washrooms"
          selected={
            data.washroom ===
            "Public washrooms"
          }
          onClick={() =>
            setVal(
              "washroom",
              "Public washrooms"
            )
          }
          prefix
        />

        <Pill
          label="Not Available"
          selected={
            data.washroom ===
            "Not Available"
          }
          onClick={() =>
            setVal(
              "washroom",
              "Not Available"
            )
          }
        />
      </div>

      {/* ======================================================
          FLOOR DETAILS
      ====================================================== */}

      <div className="section-title">
        Floor Details

        <span className="field-hint">
          (Optional)
        </span>
      </div>

      <div className="field-group two-col">
        <div className="input-with-label">
          <label>Total Floors</label>

          <input
            type="number"
            min="0"
            value={
              data.totalFloors || ""
            }
            onChange={set(
              "totalFloors"
            )}
          />
        </div>

        <div className="input-with-label">
          <label>
            Property on floor
          </label>

          <select
            value={
              data.propertyOnFloor ||
              ""
            }
            onChange={set(
              "propertyOnFloor"
            )}
          >
            <option value="">
              Select
            </option>

            <option>
              Basement
            </option>

            <option>
              Ground
            </option>

            <option>1st</option>
            <option>2nd</option>
            <option>3rd</option>

            <option>
              Above 3rd
            </option>
          </select>
        </div>
      </div>

      {/* ======================================================
          PARKING
      ====================================================== */}

      <div className="section-title">
        Parking Type
        <span className="required-star">
          *
        </span>
      </div>

      <div className="field-group pill-row">
        <Pill
          label="Private Parking"
          selected={
            data.parking ===
            "Private Parking"
          }
          onClick={() =>
            setVal(
              "parking",
              "Private Parking"
            )
          }
        />

        <Pill
          label="Public Parking"
          selected={
            data.parking ===
            "Public Parking"
          }
          onClick={() =>
            setVal(
              "parking",
              "Public Parking"
            )
          }
          prefix
        />

        <Pill
          label="Multilevel Parking"
          selected={
            data.parking ===
            "Multilevel Parking"
          }
          onClick={() =>
            setVal(
              "parking",
              "Multilevel Parking"
            )
          }
          prefix
        />

        <Pill
          label="Not Available"
          selected={
            data.parking ===
            "Not Available"
          }
          onClick={() =>
            setVal(
              "parking",
              "Not Available"
            )
          }
        />
      </div>

      {/* ======================================================
          AVAILABILITY
      ====================================================== */}

      <div className="section-title">
        Availability Status
        <span className="required-star">
          *
        </span>
      </div>

      <div className="field-group pill-row">
        <Pill
          label="Ready to move"
          selected={
            data.availability ===
            "Ready to move"
          }
          onClick={() =>
            setVal(
              "availability",
              "Ready to move"
            )
          }
        />

        <Pill
          label="Under construction"
          selected={
            data.availability ===
            "Under construction"
          }
          onClick={() =>
            setVal(
              "availability",
              "Under construction"
            )
          }
        />
      </div>

      {/* ======================================================
          PROPERTY AGE
      ====================================================== */}

      <div className="section-title">
        Age of property
        <span className="required-star">
          *
        </span>
      </div>

      <div className="field-group pill-row">
        {AGE_OPTIONS.map((age) => (
          <Pill
            key={age}
            label={age}
            selected={
              data.propertyAge === age
            }
            onClick={() =>
              setVal(
                "propertyAge",
                age
              )
            }
          />
        ))}
      </div>

      {/* ======================================================
          SHOP FACADE
      ====================================================== */}

      <div className="section-title">
        Shop facade size

        <span className="field-hint">
          (Optional)
        </span>
      </div>

      <p className="description-text">
        Shop - front related details
      </p>

      <div className="field-group two-col">
        <div className="unit-input">
          <input
            type="number"
            placeholder="Entrance width"
            value={
              data.entranceWidth ||
              ""
            }
            onChange={set(
              "entranceWidth"
            )}
          />

          <select
            value={
              data.entranceWidthUnit ||
              "ft."
            }
            onChange={set(
              "entranceWidthUnit"
            )}
          >
            <option>ft.</option>
            <option>m.</option>
          </select>
        </div>

        <div className="unit-input">
          <input
            type="number"
            placeholder="Ceiling Height"
            value={
              data.ceilingHeight ||
              ""
            }
            onChange={set(
              "ceilingHeight"
            )}
          />

          <select
            value={
              data.ceilingHeightUnit ||
              "ft."
            }
            onChange={set(
              "ceilingHeightUnit"
            )}
          >
            <option>ft.</option>
            <option>m.</option>
          </select>
        </div>
      </div>

      {/* ======================================================
          PRICE
      ====================================================== */}

      <div className="section-title">
        Price Details
      </div>

      <div className="field-group two-col">
        <div className="input-with-label">
          <label>
            ₹ Expected Price
            <span className="required-star">
              *
            </span>
          </label>

          <input
            type="number"
            min="1"
            value={
              data.expectedPrice ||
              ""
            }
            onChange={set(
              "expectedPrice"
            )}
          />
        </div>

        <div className="input-with-label">
          <label>
            ₹ Price per sq.ft.
          </label>

          <input
            type="text"
            value={
              data.pricePerSqft ||
              ""
            }
            readOnly
          />
        </div>
      </div>

      {data.expectedPrice && (
        <p className="helper-text">
          {numberToIndianWords(
            data.expectedPrice
          )}
        </p>
      )}

      <div className="checkbox-row">
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={
              !!data.taxExcluded
            }
            onChange={(e) =>
              setVal(
                "taxExcluded",
                e.target.checked
              )
            }
          />

          Tax and Govt. charges excluded
        </label>

        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={
              !!data.priceNegotiable
            }
            onChange={(e) =>
              setVal(
                "priceNegotiable",
                e.target.checked
              )
            }
          />

          Price Negotiable
        </label>
      </div>

      {/* ======================================================
          OPTIONAL PRICE DETAILS
      ====================================================== */}

      <div
        className="field-group two-col"
        style={{ marginTop: 16 }}
      >
        <div className="input-with-label">
          <label>
            Maintenance (Optional)
          </label>

          <input
            type="number"
            value={
              data.maintenance ||
              ""
            }
            onChange={set(
              "maintenance"
            )}
          />
        </div>

        <div className="input-with-label">
          <label>
            Booking Amount (Optional)
          </label>

          <input
            type="number"
            value={
              data.bookingAmount ||
              ""
            }
            onChange={set(
              "bookingAmount"
            )}
          />
        </div>
      </div>

      {/* ======================================================
          PRE LEASED
      ====================================================== */}

      <div className="section-title">
        Is it Pre-leased / Pre-Rented?
        <span className="required-star">
          *
        </span>
      </div>

      <p className="description-text">
        For properties that are already
        rented out.
      </p>

      <div className="field-group pill-row">
        <Pill
          label="Yes"
          selected={
            data.preLeased === "Yes"
          }
          onClick={() =>
            setVal(
              "preLeased",
              "Yes"
            )
          }
        />

        <Pill
          label="No"
          selected={
            data.preLeased === "No"
          }
          onClick={() =>
            setVal(
              "preLeased",
              "No"
            )
          }
        />
      </div>

      {/* ======================================================
          PRE LEASED DETAILS
      ====================================================== */}

      {data.preLeased === "Yes" && (
        <>
          <div className="section-title">
            Pre-leased / Pre-Rented
            Details
          </div>

          <div className="field-group">
            <div
              className="input-with-label"
              style={{
                marginBottom: 14,
              }}
            >
              <label>
                ₹ Current rent per month
                <span className="required-star">
                  *
                </span>
              </label>

              <input
                type="number"
                min="1"
                value={
                  data.currentRent ||
                  ""
                }
                onChange={set(
                  "currentRent"
                )}
              />
            </div>

            <div
              className="input-with-label"
              style={{
                marginBottom: 14,
              }}
            >
              <label>
                Lease tenure in years
                <span className="required-star">
                  *
                </span>
              </label>

              <input
                type="number"
                min="1"
                value={
                  data.leaseTenure ||
                  ""
                }
                onChange={set(
                  "leaseTenure"
                )}
              />
            </div>

            <div
              className="input-with-label"
              style={{
                marginBottom: 14,
              }}
            >
              <label>
                Annual rent increase
                in % (Optional)
              </label>

              <input
                type="number"
                value={
                  data.annualRentIncrease ||
                  ""
                }
                onChange={set(
                  "annualRentIncrease"
                )}
              />
            </div>

            <div className="input-with-label">
              <label>
                Leased to - Business Type
                (Optional)
              </label>

              <input
                type="text"
                value={
                  data.leasedToType ||
                  ""
                }
                onChange={set(
                  "leasedToType"
                )}
              />
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          EXPECTED RETURNS
      ====================================================== */}

      <div className="section-title">
        Expected Annual Returns
        <span className="required-star">
          *
        </span>
      </div>

      <p className="description-text">
        Based on cost of the property &
        current monthly rent.
      </p>

      <div className="field-group">
        <div
          className="input-with-label"
          style={{ maxWidth: 320 }}
        >
          <label>
            Expected Annual Returns in %
            <span className="required-star">
              *
            </span>
          </label>

          <input
            type="number"
            min="0"
            max="100"
            value={
              data.expectedReturns ||
              ""
            }
            onChange={set(
              "expectedReturns"
            )}
          />
        </div>

        <p className="helper-text">
          Sell or Rent Property online
          faster
        </p>

        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={
              !!data.hideReturns
            }
            onChange={(e) =>
              setVal(
                "hideReturns",
                e.target.checked
              )
            }
          />

          Hide expected returns
        </label>
      </div>

      {/* ======================================================
          ACTION
      ====================================================== */}

      <div className="action-area">
        <div className="action-info">
          <span className="required-info">
            * Required fields
          </span>

          <span className="action-help">
            Complete all required details
            before continuing.
          </span>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleContinue}
        >
          Post &amp; continue
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

        .section-title {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 26px;
          margin-bottom: 13px;
          color: #172033;
          font-size: 15px;
          font-weight: 700;
        }

        .field-hint {
          color: #98a2b3;
          font-size: 11px;
          font-weight: 500;
        }

        .required-star {
          color: #d92d20;
          margin-left: 3px;
          font-weight: 700;
        }

        .required-badge {
          color: #087f45;
          background: #edf8f1;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }

        .field-group {
          width: 100%;
          margin-bottom: 15px;
        }

        .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .two-col {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 16px;
        }

        .input-with-label {
          width: 100%;
        }

        .input-with-label label {
          display: block;
          margin-bottom: 7px;
          color: #344054;
          font-size: 12px;
          font-weight: 600;
        }

        .input-with-label input,
        .input-with-label select {
          width: 100%;
          height: 46px;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 0 13px;
          background: #fff;
          color: #172033;
          font-size: 13px;
          outline: none;
        }

        .input-with-label input:focus,
        .input-with-label select:focus {
          border-color: #1683d8;
          box-shadow:
            0 0 0 3px
            rgba(
              22,
              131,
              216,
              0.08
            );
        }

        .unit-input {
          display: flex;
          width: 100%;
          height: 46px;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          overflow: hidden;
          background: #fff;
        }

        .unit-input:focus-within {
          border-color: #1683d8;
          box-shadow:
            0 0 0 3px
            rgba(
              22,
              131,
              216,
              0.08
            );
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
          width: 92px;
          border: none;
          border-left: 1px solid #e4e7ec;
          outline: none;
          background: #f9fafb;
          color: #475467;
          padding: 0 8px;
        }

        .field-help {
          margin: 7px 0 0;
          color: #98a2b3;
          font-size: 11px;
        }

        .description-text {
          margin: -6px 0 12px;
          color: #8a93a0;
          font-size: 12px;
        }

        .helper-text {
          margin: 7px 0;
          color: #667085;
          font-size: 12px;
        }

        .checkbox-row {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 14px;
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

        .action-area {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 30px;
          padding-bottom: 30px;
        }

        .action-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .required-info {
          color: #344054;
          font-size: 12px;
          font-weight: 600;
        }

        .action-help {
          color: #98a2b3;
          font-size: 11px;
        }

        .primary-btn {
          min-width: 165px;
          height: 48px;
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
            rgba(
              8,
              127,
              69,
              0.18
            );
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

          .two-col {
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
    </>
  );
}