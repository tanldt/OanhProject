import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

type AssignedApplication = {
  Id: number;
  ApplicantEmail: string;
  FirstName: string;
  LastName: string;
  CertificateName: string;
  Status: string;
  AssignedDate: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border border-red-200";
    case "UnderReview":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "Submitted":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
}

export default function ReviewerExperience() {
  const [applications, setApplications] = useState<AssignedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const loadAssignedApplications = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/api/reviewer/my-applications`, {
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(json?.message || "Failed to load assigned applications");
        setApplications([]);
        return;
      }

      setApplications(json?.applications || []);
    } catch {
      setErr("Server error. Is backend running?");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedApplications();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Experience Reviewer Portal
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          View applications assigned to you for experience review.
        </p>
      </div>

      {err && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Assigned Applications
          </h2>
          <button
            onClick={loadAssignedApplications}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading assigned applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-600">No applications assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Certificate Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Date</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map((app) => (
                  <tr key={app.Id}>
                    <td className="px-4 py-3">{app.Id}</td>
                    <td className="px-4 py-3">
                      {app.FirstName} {app.LastName}
                    </td>
                    <td className="px-4 py-3">{app.ApplicantEmail}</td>
                    <td className="px-4 py-3">{app.CertificateName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          app.Status
                        )}`}
                      >
                        {app.Status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(app.AssignedDate)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/reviewer/experience/applications/${app.Id}`)
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
    </main>
  );
}