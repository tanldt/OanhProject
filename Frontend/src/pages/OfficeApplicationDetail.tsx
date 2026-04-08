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

type EducationAssessment = {
  TranscriptVerified: boolean;
  ITCollegeCoursesCompleted: number | null;
  ITUniversityCoursesCompleted: number | null;
  YearsOfITEducation: number | null;
  CategoryRecommended: string | null;
  MeetsRequirement: boolean;
  Comments: string | null;
  AssessmentDate: string;
  FirstName: string;
  LastName: string;
};

type ExperienceAssessment = {
  TotalITYears: number | null;
  HoursLast12Months: number | null;
  CurrentSFIALevel: number | null;
  Last2YearsSFIALevel: number | null;
  RecommendedDesig: string | null;
  MeetsRequirement: boolean;
  Comments: string | null;
  AssessmentDate: string;
  FirstName: string;
  LastName: string;
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

type AssignmentInfo = {
  ReviewID: number;
  AssignedDate: string | null;
  Decision: string | null;
  DesignationAwarded: string | null;
  TranscriptReceived: boolean | null;
  TranscriptReceivedDate: string | null;
  DecisionDate: string | null;
  EducationReviewerID: number | null;
  EducationReviewerEmail: string | null;
  EducationReviewerName: string | null;
  ExperienceReviewerID: number | null;
  ExperienceReviewerEmail: string | null;
  ExperienceReviewerName: string | null;
};

type ReviewerOption = {
  ReviewerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  ReviewerType: string;
};

type ResponseData = {
  application: ApplicationDetail;
  education: Education[];
  experience: Experience[];
  documents: DocumentItem[];
  assignment: AssignmentInfo | null;
  educationAssessment: EducationAssessment | null;
  experienceAssessment: ExperienceAssessment | null;
};

type ReviewersResponse = {
  educationReviewers: ReviewerOption[];
  experienceReviewers: ReviewerOption[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function OfficeApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [educationReviewers, setEducationReviewers] = useState<ReviewerOption[]>([]);
  const [experienceReviewers, setExperienceReviewers] = useState<ReviewerOption[]>([]);
  const [reviewersLoading, setReviewersLoading] = useState(true);

  const [selectedEducationReviewerId, setSelectedEducationReviewerId] = useState("");
  const [selectedExperienceReviewerId, setSelectedExperienceReviewerId] = useState("");

  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [transcriptReceived, setTranscriptReceived] = useState("false");
  const [decision, setDecision] = useState("Pending");
  const [officeReviewLoading, setOfficeReviewLoading] = useState(false);
  const [officeReviewMessage, setOfficeReviewMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptUploadLoading, setTranscriptUploadLoading] = useState(false);
  const [transcriptUploadMessage, setTranscriptUploadMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const loadDetail = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(json?.message || "Failed to load application");
        setData(null);
        return;
      }

      setData(json);

      setSelectedEducationReviewerId(
        json.assignment?.EducationReviewerID
          ? String(json.assignment.EducationReviewerID)
          : ""
      );
      setSelectedExperienceReviewerId(
        json.assignment?.ExperienceReviewerID
          ? String(json.assignment.ExperienceReviewerID)
          : ""
      );

      setTranscriptReceived(json.assignment?.TranscriptReceived ? "true" : "false");
      setDecision(json.assignment?.Decision || "Pending");
    } catch {
      setErr("Server error. Is backend running?");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewers = async () => {
    setReviewersLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/reviewers`, {
        credentials: "include",
      });

      const json = (await res.json().catch(() => null)) as ReviewersResponse | null;

      if (!res.ok || !json) {
        setEducationReviewers([]);
        setExperienceReviewers([]);
        return;
      }

      setEducationReviewers(json.educationReviewers || []);
      setExperienceReviewers(json.experienceReviewers || []);
    } catch {
      setEducationReviewers([]);
      setExperienceReviewers([]);
    } finally {
      setReviewersLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadDetail();
    loadReviewers();
  }, [id]);

  const handleAssign = async () => {
    setAssignMessage(null);

    if (!selectedEducationReviewerId || !selectedExperienceReviewerId) {
      setAssignMessage({
        type: "err",
        text: "Please select both an education reviewer and an experience reviewer.",
      });
      return;
    }

    try {
      setAssignLoading(true);

      const res = await fetch(`${API_BASE}/api/applications/${id}/assign-reviewers`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          educationReviewerId: Number(selectedEducationReviewerId),
          experienceReviewerId: Number(selectedExperienceReviewerId),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setAssignMessage({
          type: "err",
          text: json?.message || "Failed to assign reviewers",
        });
        return;
      }

      setAssignMessage({
        type: "ok",
        text: "Reviewers assigned successfully.",
      });

      await loadDetail();
    } catch {
      setAssignMessage({
        type: "err",
        text: "Server error while assigning reviewers.",
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUploadTranscript = async () => {
    setTranscriptUploadMessage(null);

    if (!transcriptFile) {
      setTranscriptUploadMessage({
        type: "err",
        text: "Please select a transcript file.",
      });
      return;
    }

    try {
      setTranscriptUploadLoading(true);

      const form = new FormData();
      form.append("transcript", transcriptFile);

      const res = await fetch(`${API_BASE}/api/applications/${id}/upload-transcript`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setTranscriptUploadMessage({
          type: "err",
          text: json?.message || "Failed to upload transcript",
        });
        return;
      }

      setTranscriptUploadMessage({
        type: "ok",
        text: "Transcript uploaded successfully.",
      });

      setTranscriptFile(null);
      await loadDetail();
    } catch {
      setTranscriptUploadMessage({
        type: "err",
        text: "Server error while uploading transcript.",
      });
    } finally {
      setTranscriptUploadLoading(false);
    }
  };

  const handleSaveOfficeReview = async () => {
    setOfficeReviewMessage(null);

    try {
      setOfficeReviewLoading(true);

      const res = await fetch(`${API_BASE}/api/applications/${id}/office-review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptReceived: transcriptReceived === "true",
          decision,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setOfficeReviewMessage({
          type: "err",
          text: json?.message || "Failed to save office review",
        });
        return;
      }

      setOfficeReviewMessage({
        type: "ok",
        text: "Office review saved successfully.",
      });

      await loadDetail();
    } catch {
      setOfficeReviewMessage({
        type: "err",
        text: "Server error while saving office review.",
      });
    } finally {
      setOfficeReviewLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Application Detail
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Office review of submitted application.
          </p>
        </div>

        <button
          onClick={() => navigate("/office")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      {loading && (
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
              Applicant Information
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
                <p className="text-xs font-semibold text-slate-500">FIRST NAME</p>
                <p className="text-sm text-slate-900">{data.application.FirstName}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500">LAST NAME</p>
                <p className="text-sm text-slate-900">{data.application.LastName}</p>
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
                <p className="text-xs font-semibold text-slate-500">MEMBERSHIP NUMBER</p>
                <p className="text-sm text-slate-900">
                  {data.application.MembershipNumber || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500">MEMBERSHIP JOIN DATE</p>
                <p className="text-sm text-slate-900">
                  {formatDate(data.application.MembershipJoinDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500">SUBMITTED DATE</p>
                <p className="text-sm text-slate-900">
                  {formatDate(data.application.SubmittedDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500">DECLARATION SIGNED</p>
                <p className="text-sm text-slate-900">
                  {data.application.DeclarationSigned ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Reviewer Assignment
            </h2>

            {assignMessage && (
              <div
                className={[
                  "mt-4 rounded-xl border p-3 text-sm",
                  assignMessage.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800",
                ].join(" ")}
              >
                {assignMessage.text}
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Education Reviewer
                </label>
                <select
                  value={selectedEducationReviewerId}
                  onChange={(e) => setSelectedEducationReviewerId(e.target.value)}
                  disabled={reviewersLoading || assignLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="">Select education reviewer</option>
                  {educationReviewers.map((r) => (
                    <option key={r.ReviewerID} value={r.ReviewerID}>
                      {r.FirstName} {r.LastName} ({r.Email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Experience Reviewer
                </label>
                <select
                  value={selectedExperienceReviewerId}
                  onChange={(e) => setSelectedExperienceReviewerId(e.target.value)}
                  disabled={reviewersLoading || assignLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="">Select experience reviewer</option>
                  {experienceReviewers.map((r) => (
                    <option key={r.ReviewerID} value={r.ReviewerID}>
                      {r.FirstName} {r.LastName} ({r.Email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                <p>
                  Current Education Reviewer:{" "}
                  <span className="font-medium text-slate-900">
                    {data.assignment?.EducationReviewerName ||
                      data.assignment?.EducationReviewerEmail ||
                      "-"}
                  </span>
                </p>
                <p className="mt-1">
                  Current Experience Reviewer:{" "}
                  <span className="font-medium text-slate-900">
                    {data.assignment?.ExperienceReviewerName ||
                      data.assignment?.ExperienceReviewerEmail ||
                      "-"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleAssign}
                disabled={
                  assignLoading ||
                  !selectedEducationReviewerId ||
                  !selectedExperienceReviewerId
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignLoading ? "Assigning..." : "Assign Reviewers"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Transcript Upload
            </h2>

            {transcriptUploadMessage && (
              <div
                className={[
                  "mt-4 rounded-xl border p-3 text-sm",
                  transcriptUploadMessage.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800",
                ].join(" ")}
              >
                {transcriptUploadMessage.text}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Upload Transcript
              </label>
              <input
                type="file"
                onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
              />
              {transcriptFile && (
                <p className="mt-2 text-xs text-slate-600">
                  Selected: <span className="font-medium">{transcriptFile.name}</span>
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleUploadTranscript}
                disabled={transcriptUploadLoading || !transcriptFile}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {transcriptUploadLoading ? "Uploading..." : "Upload Transcript"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Office Review
            </h2>

            {officeReviewMessage && (
              <div
                className={[
                  "mt-4 rounded-xl border p-3 text-sm",
                  officeReviewMessage.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800",
                ].join(" ")}
              >
                {officeReviewMessage.text}
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Transcript Received
                </label>
                <select
                  value={transcriptReceived}
                  onChange={(e) => setTranscriptReceived(e.target.value)}
                  disabled={officeReviewLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Decision
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  disabled={officeReviewLoading}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              <p>
                Current Transcript Received:{" "}
                <span className="font-medium text-slate-900">
                  {data.assignment?.TranscriptReceived ? "Yes" : "No"}
                </span>
              </p>
              <p className="mt-1">
                Transcript Received Date:{" "}
                <span className="font-medium text-slate-900">
                  {formatDate(data.assignment?.TranscriptReceivedDate)}
                </span>
              </p>
              <p className="mt-1">
                Current Decision:{" "}
                <span className="font-medium text-slate-900">
                  {data.assignment?.Decision || "Pending"}
                </span>
              </p>
              <p className="mt-1">
                Decision Date:{" "}
                <span className="font-medium text-slate-900">
                  {formatDate(data.assignment?.DecisionDate)}
                </span>
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveOfficeReview}
                disabled={officeReviewLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {officeReviewLoading ? "Saving..." : "Save Office Review"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Documents</h2>

            {data.documents.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No documents uploaded.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">File Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.documents.map((doc) => (
                      <tr key={doc.DocumentID}>
                        <td className="px-4 py-3">{doc.DocumentType}</td>
                        <td className="px-4 py-3">{doc.FileName}</td>
                        <td className="px-4 py-3">{doc.MimeType || "-"}</td>
                        <td className="px-4 py-3">
                          {doc.FileSizeBytes
                            ? `${Math.round(doc.FileSizeBytes / 1024)} KB`
                            : "-"}
                        </td>
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
            <h2 className="text-lg font-semibold text-slate-900">Education</h2>

            {data.education.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No education records yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.education.map((edu) => (
                  <div
                    key={edu.EducationID}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-900">
                      {edu.InstitutionName}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {edu.ProgramName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {edu.City} | {formatDate(edu.AttendedFrom)} to{" "}
                      {formatDate(edu.AttendedTo)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Graduated: {edu.Graduated ? "Yes" : "No"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Education Reviewer Feedback
            </h2>

            {!data.educationAssessment ? (
              <p className="mt-3 text-sm text-slate-600">
                No education reviewer assessment submitted yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-800">
                <p>
                  <span className="font-semibold">Reviewer:</span>{" "}
                  {data.educationAssessment.FirstName}{" "}
                  {data.educationAssessment.LastName}
                </p>

                <p>
                  <span className="font-semibold">Transcript Verified:</span>{" "}
                  {data.educationAssessment.TranscriptVerified ? "Yes" : "No"}
                </p>

                <p>
                  <span className="font-semibold">IT College Courses:</span>{" "}
                  {data.educationAssessment.ITCollegeCoursesCompleted ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">IT University Courses:</span>{" "}
                  {data.educationAssessment.ITUniversityCoursesCompleted ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Years of IT Education:</span>{" "}
                  {data.educationAssessment.YearsOfITEducation ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Category Recommended:</span>{" "}
                  {data.educationAssessment.CategoryRecommended ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Meets Requirement:</span>{" "}
                  {data.educationAssessment.MeetsRequirement ? "Yes" : "No"}
                </p>

                <p>
                  <span className="font-semibold">Comments:</span>{" "}
                  {data.educationAssessment.Comments || "-"}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Experience Reviewer Feedback
            </h2>

            {!data.experienceAssessment ? (
              <p className="mt-3 text-sm text-slate-600">
                No experience reviewer assessment submitted yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-800">
                <p>
                  <span className="font-semibold">Reviewer:</span>{" "}
                  {data.experienceAssessment.FirstName}{" "}
                  {data.experienceAssessment.LastName}
                </p>

                <p>
                  <span className="font-semibold">Total IT Years:</span>{" "}
                  {data.experienceAssessment.TotalITYears ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Hours in Last 12 Months:</span>{" "}
                  {data.experienceAssessment.HoursLast12Months ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Current SFIA Level:</span>{" "}
                  {data.experienceAssessment.CurrentSFIALevel ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Last 2 Years SFIA Level:</span>{" "}
                  {data.experienceAssessment.Last2YearsSFIALevel ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Recommended Designation:</span>{" "}
                  {data.experienceAssessment.RecommendedDesig ?? "-"}
                </p>

                <p>
                  <span className="font-semibold">Meets Requirement:</span>{" "}
                  {data.experienceAssessment.MeetsRequirement ? "Yes" : "No"}
                </p>

                <p>
                  <span className="font-semibold">Comments:</span>{" "}
                  {data.experienceAssessment.Comments || "-"}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Experience</h2>

            {data.experience.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No experience records yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.experience.map((exp) => (
                  <div
                    key={exp.ExperienceID}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-900">
                      {exp.Organization}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {exp.PositionTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(exp.StartDate)} to{" "}
                      {exp.EndDate ? formatDate(exp.EndDate) : "Present"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Type: {exp.EmploymentType}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      SFIA Level: {exp.SFIALevel ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}