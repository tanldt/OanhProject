import { useEffect, useState } from "react";
import { API_BASE } from "../api";

type Reviewer = {
  ReviewerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  ReviewerType: "Education" | "Experience" | "Both";
};

type ReviewerResponse = {
  educationReviewers: Reviewer[];
  experienceReviewers: Reviewer[];
};

type ManageReviewersProps = {
  onBack: () => void;
};

export default function ManageReviewers({
  onBack,
}: ManageReviewersProps) {
  const [educationReviewers, setEducationReviewers] = useState<Reviewer[]>([]);
  const [experienceReviewers, setExperienceReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [reviewerError, setReviewerError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [reviewerType, setReviewerType] = useState<
    "Education" | "Experience" | "Both"
  >("Education");
  const [saving, setSaving] = useState(false);

  const loadReviewers = async () => {
    setReviewerError("");
    setLoadingReviewers(true);

    try {
      const res = await fetch(`${API_BASE}/api/reviewers`, {
        credentials: "include",
      });

      const data: ReviewerResponse | { message?: string } = await res
        .json()
        .catch(() => ({ message: "Failed to load reviewers" }));

      if (!res.ok) {
        setReviewerError(
          ("message" in data && data.message) || "Failed to load reviewers"
        );
        setEducationReviewers([]);
        setExperienceReviewers([]);
        return;
      }

      const safeData = data as ReviewerResponse;
      setEducationReviewers(safeData.educationReviewers || []);
      setExperienceReviewers(safeData.experienceReviewers || []);
    } catch {
      setReviewerError("Server error while loading reviewers");
      setEducationReviewers([]);
      setExperienceReviewers([]);
    } finally {
      setLoadingReviewers(false);
    }
  };

  useEffect(() => {
    loadReviewers();
  }, []);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setReviewerType("Education");
  };

  const handleAddReviewer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setReviewerError("Please fill first name, last name, and email");
      return;
    }

    setReviewerError("");
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/reviewers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          reviewerType,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setReviewerError(data?.message || "Failed to add reviewer");
        return;
      }

      resetForm();
      await loadReviewers();
    } catch {
      setReviewerError("Server error while adding reviewer");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveReviewer = async (reviewerId: number) => {
    setReviewerError("");

    try {
      const res = await fetch(`${API_BASE}/api/reviewers/${reviewerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setReviewerError(data?.message || "Failed to remove reviewer");
        return;
      }

      await loadReviewers();
    } catch {
      setReviewerError("Server error while removing reviewer");
    }
  };

  const allReviewersMap = new Map<number, Reviewer>();
  [...educationReviewers, ...experienceReviewers].forEach((reviewer) => {
    allReviewersMap.set(reviewer.ReviewerID, reviewer);
  });
  const allReviewers = Array.from(allReviewersMap.values()).sort((a, b) =>
    a.Email.localeCompare(b.Email)
  );

  return (
    <div className="h-full">
      <div className="border-b border-slate-200 px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back
        </button>

        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          Manage Reviewers
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Add additional reviewers or remove existing reviewers.
        </p>
      </div>

      <div className="space-y-5 p-4">
        {reviewerError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {reviewerError}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Add Reviewer
          </h3>

          <form onSubmit={handleAddReviewer} className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={reviewerType}
              onChange={(e) =>
                setReviewerType(
                  e.target.value as "Education" | "Experience" | "Both"
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            >
              <option value="Education">Education Reviewer</option>
              <option value="Experience">Experience Reviewer</option>

            </select>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Reviewer"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Current Reviewers
            </h3>

            <button
              type="button"
              onClick={loadReviewers}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loadingReviewers ? (
            <p className="mt-4 text-sm text-slate-600">Loading reviewers...</p>
          ) : allReviewers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No reviewers found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {allReviewers.map((reviewer) => (
                <div
                  key={reviewer.ReviewerID}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {reviewer.FirstName} {reviewer.LastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {reviewer.Email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {reviewer.ReviewerType}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveReviewer(reviewer.ReviewerID)
                      }
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}