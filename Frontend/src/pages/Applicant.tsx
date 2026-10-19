import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import ApplicantStatus from "../components/ApplicantStatus";
type EducationItem = {
  institutionName: string;
  lastNameOnTranscript: string;
  firstNameOnTranscript: string;
  programName: string;
  city: string;
  attendedFrom: string;
  attendedTo: string;
  graduated: string;
  transcriptSentDate: string;
  equivalencyService: string;
  equivalencyAssessmentDate: string;
  equivalencyRefNumber: string;
};

type ExperienceItem = {
  organization: string;
  positionTitle: string;
  startDate: string;
  endDate: string;
  employmentType: string;
  hoursPerWeek: string;
  autonomy: string;
  influence: string;
  complexity: string;
  businessSkills: string;
  knowledge: string;
};

type ApplicantStatusResponse = {
  hasApplication: boolean;
  application: {
    Id: number;
    FirstName: string;
    LastName: string;
    CertificateName: string;
    Status: string;
    SubmittedDate: string | null;
    CreatedAt: string;
    UpdatedAt: string;
  } | null;
};

function isBlank(value: string | null | undefined) {
  return !String(value ?? "").trim();
}

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

function createEmptyEducation(): EducationItem {
  return {
    institutionName: "",
    lastNameOnTranscript: "",
    firstNameOnTranscript: "",
    programName: "",
    city: "",
    attendedFrom: "",
    attendedTo: "",
    graduated: "false",
    transcriptSentDate: "",
    equivalencyService: "",
    equivalencyAssessmentDate: "",
    equivalencyRefNumber: "",
  };
}

function createEmptyExperience(): ExperienceItem {
  return {
    organization: "",
    positionTitle: "",
    startDate: "",
    endDate: "",
    employmentType: "FullTime",
    hoursPerWeek: "",
    autonomy: "",
    influence: "",
    complexity: "",
    businessSkills: "",
    knowledge: "",
  };
}

export default function Applicant() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [membershipOrJoinDate, setMembershipOrJoinDate] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [resume, setResume] = useState<File | null>(null);
  const [sfiaAssessment, setSfiaAssessment] = useState<File | null>(null);

  const [educationList, setEducationList] = useState<EducationItem[]>([
    createEmptyEducation(),
  ]);
  const [experienceList, setExperienceList] = useState<ExperienceItem[]>([
    createEmptyExperience(),
  ]);

  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [hasApplication, setHasApplication] = useState(false);
  const [submittedApplication, setSubmittedApplication] =
    useState<ApplicantStatusResponse["application"]>(null);

  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadMyStatus = async () => {
      try {
        setStatusLoading(true);

        const res = await fetch(`${API_BASE}/api/applicant/my-status`, {
          credentials: "include",
        });

        const data = (await res
          .json()
          .catch(() => null)) as ApplicantStatusResponse | null;

        if (!res.ok || !data) return;

        setHasApplication(data.hasApplication);
        setSubmittedApplication(data.application);
      } finally {
        setStatusLoading(false);
      }
    };

    loadMyStatus();
  }, []);

  const updateEducation = (
    index: number,
    field: keyof EducationItem,
    value: string,
  ) => {
    setEducationList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addEducation = () => {
    setEducationList((prev) => [...prev, createEmptyEducation()]);
  };

  const removeEducation = (index: number) => {
    setEducationList((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceItem,
    value: string,
  ) => {
    setExperienceList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addExperience = () => {
    setExperienceList((prev) => [...prev, createEmptyExperience()]);
  };

  const removeExperience = (index: number) => {
    setExperienceList((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const validateBeforeSubmit = () => {
    if (isBlank(firstName) || isBlank(lastName)) {
      return "First name and last name are required.";
    }

    if (isBlank(membershipOrJoinDate)) {
      return "CIPS membership number or joined date is required.";
    }

    if (isBlank(certificateName)) {
      return "Certificate name is required.";
    }

    if (!declarationAccepted) {
      return "You must accept the declaration.";
    }

    if (!resume) {
      return "Resume/CV is required.";
    }

    if (!sfiaAssessment) {
      return "SFIA skills assessment file is required.";
    }

    for (let i = 0; i < educationList.length; i++) {
      const item = educationList[i];
      if (isBlank(item.institutionName))
        return `Education ${i + 1}: Institution Name is required.`;
      if (isBlank(item.lastNameOnTranscript))
        return `Education ${i + 1}: Last Name on Transcript is required.`;
      if (isBlank(item.firstNameOnTranscript))
        return `Education ${i + 1}: First Name on Transcript is required.`;
      if (isBlank(item.programName))
        return `Education ${i + 1}: Program Name is required.`;
      if (isBlank(item.city)) return `Education ${i + 1}: City is required.`;
      if (isBlank(item.attendedFrom))
        return `Education ${i + 1}: Attended From is required.`;
      if (isBlank(item.attendedTo))
        return `Education ${i + 1}: Attended To is required.`;
    }

    for (let i = 0; i < experienceList.length; i++) {
      const item = experienceList[i];
      if (isBlank(item.organization))
        return `Experience ${i + 1}: Organization is required.`;
      if (isBlank(item.positionTitle))
        return `Experience ${i + 1}: Position Title is required.`;
      if (isBlank(item.startDate))
        return `Experience ${i + 1}: Start Date is required.`;
      if (isBlank(item.hoursPerWeek))
        return `Experience ${i + 1}: Hours Per Week is required.`;
    }

    return null;
  };

  const handleSubmit = async () => {
    setMessage(null);

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setMessage({ type: "err", text: validationError });
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("firstName", firstName.trim());
      form.append("lastName", lastName.trim());
      form.append("membershipOrJoinDate", membershipOrJoinDate.trim());
      form.append("certificateName", certificateName.trim());
      form.append("declarationAccepted", String(declarationAccepted));

      if (resume) form.append("resume", resume);
      if (sfiaAssessment) form.append("sfiaAssessment", sfiaAssessment);

      form.append("education", JSON.stringify(educationList));
      form.append("experience", JSON.stringify(experienceList));

      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage({ type: "err", text: data?.message || "Submit failed" });
        return;
      }

      setMessage({
        type: "ok",
        text: "Application submitted successfully.",
      });

      setHasApplication(true);
      setSubmittedApplication(
        data?.application
          ? {
              Id: data.application.id,
              FirstName: data.application.firstName,
              LastName: data.application.lastName,
              CertificateName: data.application.certificateName,
              Status: data.application.status,
              SubmittedDate: data.application.submittedDate ?? null,
              CreatedAt: data.application.createdAt,
              UpdatedAt: data.application.updatedAt,
            }
          : null,
      );
    } catch {
      setMessage({
        type: "err",
        text: "Server error. Is backend running?",
      });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
          Loading...
        </div>
      </main>
    );
  }

  if (hasApplication && submittedApplication) {
    return (
      <ApplicantStatus
        submittedApplication={submittedApplication}
        message={message}
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            CIPS Certification Application
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Follow the applicant process and upload the required supporting
            files.
          </p>
        </div>

        {message && (
          <div
            className={[
              "mb-5 rounded-xl border p-3 text-sm",
              message.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Applicant Info
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  FIRST NAME *
                </span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  LAST NAME *
                </span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  CIPS MEMBERSHIP NUMBER OR JOINED DATE *
                </span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={membershipOrJoinDate}
                  onChange={(e) => setMembershipOrJoinDate(e.target.value)}
                  placeholder="e.g. 123456 or 2025-01-20"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  MY NAME ON MY CERTIFICATE SHOULD BE *
                </span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="h-4 w-4"
                  />
                  I certify that the information is true and authorize
                  verification.
                </span>
              </label>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                2. Education
              </h2>
              <button
                type="button"
                onClick={addEducation}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 active:scale-95
                "
              >
                Add Education
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {educationList.map((edu, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Education {index + 1}
                    </h3>
                    {educationList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 active:scale-95"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Name of University / College *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.institutionName}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "institutionName",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Program *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.programName}
                        onChange={(e) =>
                          updateEducation(index, "programName", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Last Name on Transcript *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.lastNameOnTranscript}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "lastNameOnTranscript",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        First Name on Transcript *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.firstNameOnTranscript}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "firstNameOnTranscript",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        City *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.city}
                        onChange={(e) =>
                          updateEducation(index, "city", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Graduated *
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.graduated}
                        onChange={(e) =>
                          updateEducation(index, "graduated", e.target.value)
                        }
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Attended From *
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.attendedFrom}
                        onChange={(e) =>
                          updateEducation(index, "attendedFrom", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Attended To *
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.attendedTo}
                        onChange={(e) =>
                          updateEducation(index, "attendedTo", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Date Official Transcript Sent to CIPS
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.transcriptSentDate}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "transcriptSentDate",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Equivalency Service
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.equivalencyService}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "equivalencyService",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Equivalency Assessment Date
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.equivalencyAssessmentDate}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "equivalencyAssessmentDate",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Equivalency Reference Number
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.equivalencyRefNumber}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "equivalencyRefNumber",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                3. Experience
              </h2>
              <button
                type="button"
                onClick={addExperience}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 active:scale-95"
              >
                Add Experience
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {experienceList.map((exp, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Experience {index + 1}
                    </h3>
                    {experienceList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 active:scale-95"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Organization *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.organization}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "organization",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Position Title *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.positionTitle}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "positionTitle",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Full Time / Part Time *
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.employmentType}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "employmentType",
                            e.target.value,
                          )
                        }
                      >
                        <option value="FullTime">Full Time</option>
                        <option value="PartTime">Part Time</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Start Date *
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(index, "startDate", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        End Date
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.endDate}
                        onChange={(e) =>
                          updateExperience(index, "endDate", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Hours Per Week *
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.hoursPerWeek}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "hoursPerWeek",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Autonomy{" "}
                        <a
                          href="https://sfia-online.org/en/sfia-8/responsibilities/autonomy"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs ml-1"
                        >
                          (View SFIA Guide)
                        </a>
                      </span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.autonomy}
                        onChange={(e) =>
                          updateExperience(index, "autonomy", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Influence{" "}
                        <a
                          href="https://sfia-online.org/en/sfia-8/responsibilities/influence"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs ml-1"
                        >
                          (View SFIA Guide)
                        </a>
                      </span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.influence}
                        onChange={(e) =>
                          updateExperience(index, "influence", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Complexity{" "}
                        <a
                          href="https://sfia-online.org/en/sfia-8/responsibilities/complexity"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs ml-1"
                        >
                          (View SFIA Guide)
                        </a>
                      </span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.complexity}
                        onChange={(e) =>
                          updateExperience(index, "complexity", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Business Skills{" "}
                        <a
                          href="https://sfia-online.org/en/sfia-8/responsibilities/business-skills"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs ml-1"
                        >
                          (View SFIA Guide)
                        </a>
                      </span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.businessSkills}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "businessSkills",
                            e.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Knowledge{" "}
                        <a
                          href="https://sfia-online.org/en/sfia-8/responsibilities/knowledge"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs ml-1"
                        >
                          (View SFIA Guide)
                        </a>
                      </span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.knowledge}
                        onChange={(e) =>
                          updateExperience(index, "knowledge", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Resume / CV *
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm 
                              file:mr-4 file:py-2 file:px-4 
                              file:rounded file:border-0 
                              file:text-sm file:font-semibold 
                              file:bg-blue-600 file:text-white 
                              hover:file:bg-blue-700
                              active:file:scale-95"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  SFIA Skills Assessment *
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm 
                              file:mr-4 file:py-2 file:px-4 
                              file:rounded file:border-0 
                              file:text-sm file:font-semibold 
                              file:bg-blue-600 file:text-white 
                              hover:file:bg-blue-700
                              active:file:scale-95"
                  onChange={(e) =>
                    setSfiaAssessment(e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </main>
  );
}
