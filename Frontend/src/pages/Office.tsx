import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import OfficeSidebar from "../components/OfficeSIdebar";

type DbApplication = {
  Id: number;
  ApplicantEmail: string;
  FirstName: string;
  LastName: string;
  MembershipOrJoinDate: string;
  CertificateName: string;
  Status: string;
  CreatedAt: string;

  ResumeOriginalName: string | null;
  ResumeMimeType: string | null;
  ResumeSizeBytes: number | null;
  ResumeStoredFileName: string | null;
};

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

export default function Office() {
  const [apps, setApps] = useState<DbApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.message || "Failed to load applications");
        setApps([]);
        return;
      }

      setApps(data.applications || []);
    } catch {
      setErr("Server error. Is backend running?");
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <OfficeSidebar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Office Portal
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Applications submitted by applicants.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95"
          >
            Refresh
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {err}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Member # / Join Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-600" colSpan={6}>
                      Loading...
                    </td>
                  </tr>
                ) : apps.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-600" colSpan={6}>
                      No applications yet.
                    </td>
                  </tr>
                ) : (
                  apps.map((a) => (
                    <tr key={a.Id} className="text-slate-800">
                      <td className="px-4 py-3">{a.Id}</td>
                      <td className="px-4 py-3">
                        {a.FirstName} {a.LastName}
                      </td>
                      <td className="px-4 py-3">{a.ApplicantEmail}</td>
                      <td className="px-4 py-3">{a.MembershipOrJoinDate}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            a.Status
                          )}`}
                        >
                          {a.Status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/office/applications/${a.Id}`)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}