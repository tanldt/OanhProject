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

type Education = {
  EducationID: number;
  InstitutionName: string;
  LastNameOnTranscript: string;
  FirstNameOnTranscript: string;
  ProgramName: string;
  City: string;
  AttendedFrom: string;
  AttendedTo: string;
  Graduated: boolean;
  TranscriptSentDate: string | null;
  EquivalencyService: string | null;
  EquivalencyAssessmentDate: string | null;
  EquivalencyRefNumber: string | null;
  ExamRoute: string | null;
  ExamPassed: boolean | null;
  ExamCompletionDate: string | null;
  ExamTranscriptSentDate: string | null;
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
  education: Education[];
  experience: unknown[];
  documents: DocumentItem[];
};

type EducationAssessment = {
  EduAssessmentID: number;
  ReviewID: number;
  ReviewerID: number;
  EducationID: number;
  TranscriptVerified: boolean;
  ITCollegeCoursesCompleted: number | null;
  ITUniversityCoursesCompleted: number | null;
  YearsOfITEducation: number | null;
  CategoryRecommended: string | null;
  MeetsRequirement: boolean;
  Comments: string | null;
  AssessmentDate: string;
};

type AssessmentResponse = {
  reviewId: number;
  reviewerId: number;
  educationId: number | null;
  assessment: EducationAssessment | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function ReviewerEducationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [transcriptVerified, setTranscriptVerified] = useState("false");
  const [itCollegeCoursesCompleted, setItCollegeCoursesCompleted] = useState("");
  const [itUniversityCoursesCompleted, setItUniversityCoursesCompleted] = useState("");
  const [yearsOfITEducation, setYearsOfITEducation] = useState("");
  const [categoryRecommended, setCategoryRecommended] = useState("");
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
        `${API_BASE}/api/reviewer/education-assessment/${id}`,
        {
          credentials: "include",
        }
      );

      const json = (await res.json().catch(() => null)) as AssessmentResponse | null;

      if (!res.ok || !json) {
        return;
      }

      if (json.assessment) {
        setTranscriptVerified(json.assessment.TranscriptVerified ? "true" : "false");
        setItCollegeCoursesCompleted(
          json.assessment.ITCollegeCoursesCompleted !== null &&
            json.assessment.ITCollegeCoursesCompleted !== undefined
            ? String(json.assessment.ITCollegeCoursesCompleted)
            : ""
        );
        setItUniversityCoursesCompleted(
          json.assessment.ITUniversityCoursesCompleted !== null &&
            json.assessment.ITUniversityCoursesCompleted !== undefined
            ? String(json.assessment.ITUniversityCoursesCompleted)
            : ""
        );
        setYearsOfITEducation(
          json.assessment.YearsOfITEducation !== null &&
            json.assessment.YearsOfITEducation !== undefined
            ? String(json.assessment.YearsOfITEducation)
            : ""
        );
        setCategoryRecommended(json.assessment.CategoryRecommended || "");
        setMeetsRequirement(json.assessment.MeetsRequirement ? "true" : "false");
        setComments(json.assessment.Comments || "");
      }
    } catch {
      // keep page usable even if load fails
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
        `${API_BASE}/api/reviewer/education-assessment/${id}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcriptVerified: transcriptVerified === "true",
            itCollegeCoursesCompleted: itCollegeCoursesCompleted.trim(),
            itUniversityCoursesCompleted: itUniversityCoursesCompleted.trim(),
            yearsOfITEducation: yearsOfITEducation.trim(),
            categoryRecommended: categoryRecommended.trim(),
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
        text: "Education assessment saved successfully.",
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

  const transcriptDocs =
    data?.documents.filter(
      (doc) =>
        doc.DocumentType === "Transcript" ||
        doc.DocumentType === "EquivalencyAssessment"
    ) || [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Education Review Detail
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review assigned applicant education details.
          </p>
        </div>

        <button
          onClick={() => navigate("/reviewer/education")}
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
                <p className="text-sm text-slate-900">{data.application.ApplicantEmail}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">CERTIFICATE NAME</p>
                <p className="text-sm text-slate-900">{data.application.CertificateName}</p>
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
              Education Records
            </h2>

            {data.education.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No education records yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.education.map((edu) => (
                  <div key={edu.EducationID} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{edu.InstitutionName}</p>
                    <p className="mt-1 text-sm text-slate-700">{edu.ProgramName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {edu.FirstNameOnTranscript} {edu.LastNameOnTranscript}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{edu.City}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(edu.AttendedFrom)} to {formatDate(edu.AttendedTo)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Graduated: {edu.Graduated ? "Yes" : "No"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Exam Route: {edu.ExamRoute || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Education Documents
            </h2>

            {transcriptDocs.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No transcript or equivalency documents found.
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
                    {transcriptDocs.map((doc) => (
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
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={transcriptVerified === "true"}
                    onChange={(e) =>
                      setTranscriptVerified(e.target.checked ? "true" : "false")
                    }
                    disabled={saveLoading}
                    className="h-4 w-4"
                  />
                  Education details match the transcript / submitted record
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  # of IT College Courses Completed
                </label>
                <input
                  type="number"
                  min="0"
                  value={itCollegeCoursesCompleted}
                  onChange={(e) => setItCollegeCoursesCompleted(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  # of IT University Courses Completed
                </label>
                <input
                  type="number"
                  min="0"
                  value={itUniversityCoursesCompleted}
                  onChange={(e) => setItUniversityCoursesCompleted(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Years of IT Education
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={yearsOfITEducation}
                  onChange={(e) => setYearsOfITEducation(e.target.value)}
                  disabled={saveLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Category Recommended
                </label>
                <input
                  type="text"
                  value={categoryRecommended}
                  onChange={(e) => setCategoryRecommended(e.target.value)}
                  disabled={saveLoading}
                  placeholder="e.g. AITP / ISP / ITCP / Other"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                />
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