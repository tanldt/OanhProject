import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../api";

type ApplicationDetail = {
  Id: number;
  ApplicantEmail: string;
  FirstName: string;
  LastName: string;
  CertificateName: string;
  MembershipNumber: string | null;
  MembershipJoinDate: string | null;
  Status: string;
  DeclarationSigned: boolean;
  DeclarationDate: string | null;
  SubmittedDate: string | null;
  CreatedAt: string;
  UpdatedAt: string;
};

type Experience = {
  ExperienceID: number;
  Organization: string;
  PositionTitle: string;
  StartDate: string;
  EndDate: string | null;
  EmploymentType: string;
  HoursPerWeek: number | null;
  SFIALevel: number | null;
  Autonomy: string | null;
  Influence: string | null;
  Complexity: string | null;
  BusinessSkills: string | null;
  Knowledge: string | null;
  CreatedAt: string;
};

type DocumentItem = {
  DocumentID: number;
  DocumentType: string;
  FileName: string;
  FilePath: string;
  MimeType: string | null;
  FileSizeBytes: number | null;
  UploadedAt: string;
};

type ResponseData = {
  application: ApplicationDetail;
  education: unknown[];
  experience: Experience[];
  documents: DocumentItem[];
};

type ExperienceAssessment = {
  ExpAssessmentID: number;
  ReviewID: number;
  ReviewerID: number;
  TotalITYears: number | null;
  HoursLast12Months: number | null;
  CurrentSFIALevel: number | null;
  Last2YearsSFIALevel: number | null;
  MeetsRequirement: boolean;
  RecommendedDesig: string | null;
  Comments: string | null;
  AssessmentDate: string;
};

type AssessmentResponse = {
  reviewId: number;
  reviewerId: number;
  assessment: ExperienceAssessment | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function ReviewerExperienceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [totalITYears, setTotalITYears] = useState("");
  const [hoursLast12Months, setHoursLast12Months] = useState("");
  const [currentSFIALevel, setCurrentSFIALevel] = useState("");
  const [last2YearsSFIALevel, setLast2YearsSFIALevel] = useState("");
  const [recommendedDesig, setRecommendedDesig] = useState("");
  const [meetsRequirement, setMeetsRequirement] = useState("false");
  const [comments, setComments] = useState("");

  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const loadApplicationDetail = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(json?.message || "Failed to load application detail");
        setData(null);
        return;
      }

      setData(json);
    } catch {
      setErr("Server error. Is backend running?");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAssessment = async () => {
    setAssessmentLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/reviewer/experience-assessment/${id}`,
        {
          credentials: "include",
        }
      );

      const json = (await res.json().catch(() => null)) as AssessmentResponse | null;

      if (!res.ok || !json) {
        return;
      }

      if (json.assessment) {
        setTotalITYears(
          json.assessment.TotalITYears !== null &&
            json.assessment.TotalITYears !== undefined
            ? String(json.assessment.TotalITYears)
            : ""
        );

        setHoursLast12Months(
          json.assessment.HoursLast12Months !== null &&
            json.assessment.HoursLast12Months !== undefined
            ? String(json.assessment.HoursLast12Months)
            : ""
        );

        setCurrentSFIALevel(
          json.assessment.CurrentSFIALevel !== null &&
            json.assessment.CurrentSFIALevel !== undefined
            ? String(json.assessment.CurrentSFIALevel)
            : ""
        );

        setLast2YearsSFIALevel(
          json.assessment.Last2YearsSFIALevel !== null &&
            json.assessment.Last2YearsSFIALevel !== undefined
            ? String(json.assessment.Last2YearsSFIALevel)
            : ""
        );

        setRecommendedDesig(json.assessment.RecommendedDesig || "");
        setMeetsRequirement(json.assessment.MeetsRequirement ? "true" : "false");
        setComments(json.assessment.Comments || "");
      }
    } catch {
      // keep page usable even if assessment load fails
    } finally {
      setAssessmentLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadApplicationDetail();
    loadAssessment();
  }, [id]);

  const handleSaveAssessment = async () => {
    setSaveMessage(null);

    try {
      setSaveLoading(true);

      const res = await fetch(
        `${API_BASE}/api/reviewer/experience-assessment/${id}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalITYears: totalITYears.trim(),
            hoursLast12Months: hoursLast12Months.trim(),
            currentSFIALevel: currentSFIALevel.trim(),
            last2YearsSFIALevel: last2YearsSFIALevel.trim(),
            recommendedDesig: recommendedDesig.trim(),
            meetsRequirement: meetsRequirement === "true",
            comments: comments.trim(),
          }),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSaveMessage({
          type: "err",
          text: json?.message || "Failed to save assessment",
        });
        return;
      }

      setSaveMessage({
        type: "ok",
        text: "Experience assessment saved successfully.",
      });

      await loadAssessment();
    } catch {
      setSaveMessage({
        type: "err",
        text: "Server error while saving assessment.",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const experienceDocs =
    data?.documents.filter(
      (doc) =>
        doc.DocumentType === "Resume" ||
        doc.DocumentType === "SFIAAssessment" ||
        doc.DocumentType === "ReferenceLetter" ||
        doc.DocumentType === "SponsorLetter"
    ) || [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Experience Review Detail
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review assigned applicant experience details.
          </p>
        </div>

        <button
          onClick={() => navigate("/reviewer/experience")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      {(loading || assessmentLoading) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">
          Loading...
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      )}

      {!loading && !err && data && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Applicant Summary
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-500">APPLICATION ID</p>
                <p className="text-sm text-slate-900">{data.application.Id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">STATUS</p>
                <p className="text-sm text-slate-900">{data.application.Status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">APPLICANT</p>
                <p className="text-sm text-slate-900">
                  {data.application.FirstName} {data.application.LastName}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">EMAIL</p>
                <p className="text-sm text-slate-900">
                  {data.application.ApplicantEmail}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">CERTIFICATE NAME</p>
                <p className="text-sm text-slate-900">
                  {data.application.CertificateName}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">SUBMITTED DATE</p>
                <p className="text-sm text-slate-900">
                  {formatDate(data.application.SubmittedDate)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Experience Records
            </h2>

            {data.experience.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No experience records yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.experience.map((exp) => (
                  <div
                    key={exp.ExperienceID}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-900">{exp.Organization}</p>
                    <p className="mt-1 text-sm text-slate-700">{exp.PositionTitle}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(exp.StartDate)} to{" "}
                      {exp.EndDate ? formatDate(exp.EndDate) : "Present"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Type: {exp.EmploymentType}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Hours Per Week: {exp.HoursPerWeek ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      SFIA Level: {exp.SFIALevel ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Autonomy: {exp.Autonomy || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Influence: {exp.Influence || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Complexity: {exp.Complexity || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Business Skills: {exp.BusinessSkills || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Knowledge: {exp.Knowledge || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Experience Documents
            </h2>

            {experienceDocs.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No experience-related documents found.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {experienceDocs.map((doc) => (
                      <tr key={doc.DocumentID}>
                        <td className="px-4 py-3">{doc.DocumentType}</td>
                        <td className="px-4 py-3">{doc.FileName}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${API_BASE}/api/documents/${doc.DocumentID}/view`,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Reviewer Assessment
            </h2>

            {saveMessage && (
              <div
                className={[
                  "mt-4 rounded-xl border p-3 text-sm",
                  saveMessage.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800",
                ].join(" ")}
              >
                {saveMessage.text}
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Total IT Years
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalITYears}
                  onChange={(e) => setTotalITYears(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Hours in Last 12 Months
                </label>
                <input
                  type="number"
                  min="0"
                  value={hoursLast12Months}
                  onChange={(e) => setHoursLast12Months(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Current SFIA Level
                </label>
                <select
                  value={currentSFIALevel}
                  onChange={(e) => setCurrentSFIALevel(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="">Select SFIA level</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Last 2 Years SFIA Level
                </label>
                <select
                  value={last2YearsSFIALevel}
                  onChange={(e) => setLast2YearsSFIALevel(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="">Select SFIA level</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Recommended Designation
                </label>
                <select
                  value={recommendedDesig}
                  onChange={(e) => setRecommendedDesig(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="">Select designation</option>
                  <option value="AITP">AITP</option>
                  <option value="ISP">ISP</option>
                  <option value="ITCP">ITCP</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Meets Requirement
                </label>
                <select
                  value={meetsRequirement}
                  onChange={(e) => setMeetsRequirement(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Reviewer Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={saveLoading}
                  rows={5}
                  placeholder="Enter reviewer comments..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAssessment}
                disabled={saveLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveLoading ? "Saving..." : "Save Assessment"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}