type Props = {
  submittedApplication: any;
  message: {
    type: "ok" | "err";
    text: string;
  } | null;
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

export default function ApplicantStatus({
  submittedApplication,
  message,
}: Props) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Application Status
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Your certification application has already been submitted.
            </p>
          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
              submittedApplication.Status
            )}`}
          >
            {submittedApplication.Status}
          </span>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={[
              "mt-5 rounded-xl border p-3 text-sm",
              message.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        {/* DETAILS */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              APPLICATION ID
            </p>
            <p className="text-sm text-slate-900">
              {submittedApplication.Id}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              APPLICANT
            </p>
            <p className="text-sm text-slate-900">
              {submittedApplication.FirstName}{" "}
              {submittedApplication.LastName}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              CERTIFICATE NAME
            </p>
            <p className="text-sm text-slate-900">
              {submittedApplication.CertificateName}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              SUBMITTED DATE
            </p>
            <p className="text-sm text-slate-900">
              {formatDate(submittedApplication.SubmittedDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              LAST UPDATED
            </p>
            <p className="text-sm text-slate-900">
              {formatDate(submittedApplication.UpdatedAt)}
            </p>
          </div>
        </div>

        {/* STATUS MESSAGE */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">
            Current Status
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {submittedApplication.Status === "Submitted" &&
              "Your application has been submitted and is waiting for office review."}
            {submittedApplication.Status === "UnderReview" &&
              "Your application is currently being reviewed by CIPS office and reviewers."}
            {submittedApplication.Status === "Approved" &&
              "Your application has been approved."}
            {submittedApplication.Status === "Rejected" &&
              "Your application was not approved."}
          </p>
        </div>
      </div>
    </main>
  );
}