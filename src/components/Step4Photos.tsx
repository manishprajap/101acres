"use client";

import type { ChangeEvent } from "react";
import Swal from "sweetalert2";

import type {
  PartialFormData,
  PropertyFormData,
} from "@/types/property";

interface Step4Props {
  data: PropertyFormData;
  update: (partial: PartialFormData) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step4Photos({
  data,
  update,
  onContinue,
  onBack,
}: Step4Props) {
  const description = data.description || "";

  /* ============================================================
     HANDLE FILE UPLOAD
  ============================================================ */

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    /* ==========================================================
       MAX 50 PHOTOS
    ========================================================== */

    const existingCount = data.photos?.length || 0;

    if (existingCount + files.length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Maximum 50 photos allowed",
        text: `You already selected ${existingCount} photo(s). You can upload a maximum of 50 photos.`,
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      e.target.value = "";
      return;
    }

    /* ==========================================================
       MAX 10 MB PER FILE
    ========================================================== */

    const maxSize = 10 * 1024 * 1024;

    const oversizedFile = files.find(
      (file) => file.size > maxSize
    );

    if (oversizedFile) {
      Swal.fire({
        icon: "warning",
        title: "File size exceeded",
        text: `"${oversizedFile.name}" is larger than 10 MB. Please select an image smaller than 10 MB.`,
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      e.target.value = "";
      return;
    }

    /* ==========================================================
       VALID IMAGE TYPES
    ========================================================== */

    const allowedExtensions = [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "heic",
      "heif",
    ];

    const invalidFile = files.find((file) => {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "";

      return !allowedExtensions.includes(extension);
    });

    if (invalidFile) {
      Swal.fire({
        icon: "warning",
        title: "Invalid image format",
        text: `"${invalidFile.name}" is not a supported image format. Please use PNG, JPG, JPEG, GIF, WEBP, HEIC or HEIF.`,
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      e.target.value = "";
      return;
    }

    /* ==========================================================
       SAVE ONLY FILE NAMES

       IMPORTANT:
       PropertyFormData.photos is string[].
       Therefore we store only file names here.
    ========================================================== */

    const photoNames: string[] = files.map(
      (file) => file.name
    );

    update({
      photos: [
        ...(data.photos || []),
        ...photoNames,
      ],
    });

    /* Reset input so the same file can be selected again */
    e.target.value = "";
  };

  /* ============================================================
     REMOVE PHOTO
  ============================================================ */

  const removePhoto = async (index: number) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Remove this photo?",
      text: "This photo will be removed from your selected photos.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d92d20",
      cancelButtonColor: "#667085",
    });

    if (!result.isConfirmed) {
      return;
    }

    const nextPhotos = [...(data.photos || [])];

    nextPhotos.splice(index, 1);

    update({
      photos: nextPhotos,
    });
  };

  /* ============================================================
     CONTINUE
     
     Photos and description are optional.
  ============================================================ */

  const handleContinue = () => {
    onContinue();
  };

  return (
    <>
      {/* ========================================================
          BACK
      ======================================================== */}

      <button
        type="button"
        className="back-link"
        onClick={onBack}
      >
        ← Back
      </button>

      {/* ========================================================
          TITLE
      ======================================================== */}

      <h1 className="page-title">
        Add one video of property
      </h1>

      <p className="page-subtitle">
        A video is worth a thousand pictures.
        Properties with videos get higher page
        views.
      </p>

      {/* ========================================================
          YOUTUBE
      ======================================================== */}

      <div className="field-group">
        <div className="input-with-label">
          <label>
            📺 YouTube Link
            <span className="field-hint">
              {" "}
              (Optional)
            </span>
          </label>

          <input
            type="text"
            placeholder="Paste YouTube link of your video"
            value={data.youtubeLink || ""}
            onChange={(e) =>
              update({
                youtubeLink: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* ========================================================
          PHOTOS
      ======================================================== */}

      <div className="photos-heading">
        <h2>
          Add photos of your property{" "}
          <span className="field-hint">
            (Optional)
          </span>
        </h2>

        <p>
          A picture is worth a thousand words.
          87% of buyers look at photos before
          buying.
        </p>
      </div>

      <div className="field-group">
        <label className="field-label">
          Upload images
        </label>

        <div className="upload-box">
          <div className="upload-icon">
            📷
          </div>

          <div className="upload-title">
            + Add at least 5 photos
          </div>

          <p className="upload-sub">
            Drag and drop your photos here
            <br />
            Up to 50 photos • Max size 10 MB
            <br />
            Formats: png, jpg, jpeg, gif,
            webp, heic, heif.
          </p>

          <label className="primary-btn upload-button">
            Upload Photos Now

            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,image/heic,image/heif"
              style={{
                display: "none",
              }}
              onChange={handleFiles}
            />
          </label>
        </div>

        {/* ======================================================
            SELECTED PHOTOS
        ====================================================== */}

        {data.photos &&
          data.photos.length > 0 && (
            <div className="selected-photos">
              <div className="selected-header">
                <strong>
                  {data.photos.length} photo
                  {data.photos.length !== 1
                    ? "s"
                    : ""}{" "}
                  selected
                </strong>
              </div>

              {data.photos.map(
                (photo, index) => (
                  <div
                    className="photo-item"
                    key={`${photo}-${index}`}
                  >
                    <div className="photo-info">
                      <span className="photo-number">
                        {index + 1}
                      </span>

                      <div>
                        <div className="photo-name">
                          {photo}
                        </div>

                        <div className="photo-size">
                          Image selected
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-photo"
                      onClick={() =>
                        removePhoto(index)
                      }
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          )}

        <div className="warning-banner">
          ⚠ Without photos your ad may get
          less attention from buyers.
        </div>
      </div>

      {/* ========================================================
          DESCRIPTION
      ======================================================== */}

      <div className="field-group">
        <label className="field-label">
          What makes your property unique?
          <span className="field-hint">
            {" "}
            (Optional)
          </span>
        </label>

        <p className="page-subtitle description-help">
          Adding description will increase your
          listing visibility.
        </p>

        <textarea
          className="textarea-input"
          placeholder="Share some details about your property like spacious area, nearby markets, metro connectivity and more"
          value={description}
          maxLength={5000}
          onChange={(e) =>
            update({
              description: e.target.value,
            })
          }
        />

        <div className="char-count">
          {description.length}/5000
        </div>
      </div>

      {/* ========================================================
          ACTION
      ======================================================== */}

      <div className="action-area">
        <div className="action-info">
          <span className="optional-info">
            Photos and description are optional.
          </span>

          <span className="action-help">
            You can continue without adding
            photos.
          </span>
        </div>

        <button
          type="button"
          className="primary-btn continue-btn"
          onClick={handleContinue}
        >
          Continue

          <span className="arrow">
            →
          </span>
        </button>
      </div>

      {/* ========================================================
          STYLES
      ======================================================== */}

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
          margin-bottom: 8px;
          color: #344054;
          font-size: 13px;
          font-weight: 600;
        }

        .field-hint {
          color: #98a2b3;
          font-size: 11px;
          font-weight: 500;
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

        .input-with-label input {
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

        .input-with-label input:focus {
          border-color: #1683d8;
          box-shadow:
            0 0 0 3px
            rgba(22, 131, 216, 0.08);
        }

        .photos-heading {
          margin-top: 30px;
          margin-bottom: 18px;
        }

        .photos-heading h2 {
          margin: 0 0 7px;
          color: #172033;
          font-size: 18px;
          font-weight: 700;
        }

        .photos-heading p {
          margin: 0;
          color: #667085;
          font-size: 12px;
          line-height: 1.5;
        }

        .upload-box {
          min-height: 230px;
          box-sizing: border-box;
          padding: 30px 20px;
          border: 1.5px dashed #b8c2cc;
          border-radius: 14px;
          background: #fafbfc;
          text-align: center;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .upload-box:hover {
          border-color: #087f45;
          background: #f7fcf9;
        }

        .upload-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          border-radius: 12px;
          background: #edf8f1;
          font-size: 22px;
        }

        .upload-title {
          color: #172033;
          font-size: 15px;
          font-weight: 700;
        }

        .upload-sub {
          margin: 8px 0 18px;
          color: #98a2b3;
          font-size: 11px;
          line-height: 1.6;
        }

        .upload-button {
          display: inline-flex !important;
          width: auto !important;
          min-width: 150px;
          text-decoration: none;
        }

        .selected-photos {
          margin-top: 14px;
          padding: 12px;
          border: 1px solid #e4e7ec;
          border-radius: 10px;
          background: #fff;
        }

        .selected-header {
          padding-bottom: 9px;
          margin-bottom: 5px;
          border-bottom: 1px solid #eaecf0;
          color: #344054;
          font-size: 12px;
        }

        .photo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 4px;
          border-bottom: 1px solid #f2f4f7;
        }

        .photo-item:last-child {
          border-bottom: none;
        }

        .photo-info {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 9px;
        }

        .photo-number {
          flex-shrink: 0;
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: #edf8f1;
          color: #087f45;
          font-size: 10px;
          font-weight: 700;
        }

        .photo-name {
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #344054;
          font-size: 12px;
        }

        .photo-size {
          margin-top: 2px;
          color: #98a2b3;
          font-size: 10px;
        }

        .remove-photo {
          flex-shrink: 0;
          border: none;
          background: transparent;
          color: #d92d20;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .remove-photo:hover {
          text-decoration: underline;
        }

        .warning-banner {
          margin-top: 12px;
          padding: 11px 13px;
          border-radius: 8px;
          background: #fff8eb;
          color: #9a6700;
          font-size: 11px;
          line-height: 1.4;
        }

        .description-help {
          margin: -2px 0 9px;
          font-size: 12px;
        }

        .textarea-input {
          width: 100%;
          min-height: 130px;
          box-sizing: border-box;
          resize: vertical;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          padding: 12px;
          outline: none;
          color: #172033;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
        }

        .textarea-input:focus {
          border-color: #1683d8;
          box-shadow:
            0 0 0 3px
            rgba(22, 131, 216, 0.08);
        }

        .char-count {
          margin-top: 5px;
          text-align: right;
          color: #98a2b3;
          font-size: 10px;
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
          min-width: 165px;
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

          .action-area {
            align-items: stretch;
            flex-direction: column;
          }

          .continue-btn {
            width: 100%;
          }

          .photo-name {
            max-width: 220px;
          }
        }
      `}</style>
    </>
  );
}