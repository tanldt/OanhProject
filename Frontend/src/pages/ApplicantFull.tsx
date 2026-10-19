import { useEffect, useState } from "react";
import { API_BASE } from "../api";

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
  fromPeriod: string;
  toPeriod: string;
  organization: string;
  employmentType: string;
  hoursPerWeek: string;
  positionTitle: string;
  responsibilities: string;
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
    case "Under Review":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "Submitted":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
}

function getDisplayStatus(status: string) {
  if (status === "UnderReview") return "Under Review";
  return status;
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
    fromPeriod: "",
    toPeriod: "",
    organization: "",
    employmentType: "",
    hoursPerWeek: "",
    positionTitle: "",
    responsibilities: "",
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
  const [applicantInitial, setApplicantInitial] = useState("");
  const [declarationDate, setDeclarationDate] = useState("");

  const [resume, setResume] = useState<File | null>(null);
  const [sfiaAssessment, setSfiaAssessment] = useState<File | null>(null);
  const [membershipCard, setMembershipCard] = useState<File | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [referenceLetters, setReferenceLetters] = useState<File | null>(null);
  const [sponsorLetters, setSponsorLetters] = useState<File | null>(null);
  const [educationProof, setEducationProof] = useState<File | null>(null);

  const [educationList, setEducationList] = useState<EducationItem[]>([
    createEmptyEducation(),
  ]);

  const [experienceList, setExperienceList] = useState<ExperienceItem[]>([
    createEmptyExperience(),
  ]);

  const [bcsPassed, setBcsPassed] = useState("false");
  const [iccpPassed, setIccpPassed] = useState("false");
  const [examCompletionDate, setExamCompletionDate] = useState("");
  const [examLastNameOnTranscript, setExamLastNameOnTranscript] = useState("");
  const [examTranscriptSentDate, setExamTranscriptSentDate] = useState("");

  const [applicationEasyToComplete, setApplicationEasyToComplete] = useState("");
  const [instructionsClear, setInstructionsClear] = useState("");
  const [unclearAreas, setUnclearAreas] = useState("");
  const [additionalFeedback, setAdditionalFeedback] = useState("");

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

        const data =
          (await res.json().catch(() => null)) as ApplicantStatusResponse | null;

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
    value: string
  ) => {
    setEducationList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addEducation = () => {
    setEducationList((prev) => [...prev, createEmptyEducation()]);
  };

  const removeEducation = (index: number) => {
    setEducationList((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceItem,
    value: string
  ) => {
    setExperienceList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addExperience = () => {
    setExperienceList((prev) => [...prev, createEmptyExperience()]);
  };

  const removeExperience = (index: number) => {
    setExperienceList((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
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

    if (isBlank(applicantInitial)) {
      return "Signature or initial is required.";
    }

    if (isBlank(declarationDate)) {
      return "Date is required.";
    }

    if (!declarationAccepted) {
      return "You must accept the declaration.";
    }

    if (!membershipCard) {
      return "CIPS membership card is required.";
    }

    if (!paymentReceipt) {
      return "Payment receipt is required.";
    }

    if (!resume) {
      return "Resume / CV is required.";
    }

    if (!sfiaAssessment) {
      return "SFIA skills assessment is required.";
    }

    for (let i = 0; i < educationList.length; i++) {
      const item = educationList[i];

      const hasAnyEducationValue =
        !isBlank(item.institutionName) ||
        !isBlank(item.lastNameOnTranscript) ||
        !isBlank(item.firstNameOnTranscript) ||
        !isBlank(item.programName) ||
        !isBlank(item.city) ||
        !isBlank(item.attendedFrom) ||
        !isBlank(item.attendedTo) ||
        !isBlank(item.transcriptSentDate) ||
        !isBlank(item.equivalencyService) ||
        !isBlank(item.equivalencyAssessmentDate) ||
        !isBlank(item.equivalencyRefNumber);

      if (hasAnyEducationValue) {
        if (isBlank(item.institutionName)) {
          return `Education ${i + 1}: Name of University/College is required.`;
        }
        if (isBlank(item.lastNameOnTranscript)) {
          return `Education ${i + 1}: Last Name on Transcript is required.`;
        }
        if (isBlank(item.firstNameOnTranscript)) {
          return `Education ${i + 1}: First Name on Transcript is required.`;
        }
        if (isBlank(item.programName)) {
          return `Education ${i + 1}: Program is required.`;
        }
        if (isBlank(item.city)) {
          return `Education ${i + 1}: City is required.`;
        }
        if (isBlank(item.attendedFrom)) {
          return `Education ${i + 1}: Attended from date is required.`;
        }
        if (isBlank(item.attendedTo)) {
          return `Education ${i + 1}: Attended to date is required.`;
        }
      }
    }

    for (let i = 0; i < experienceList.length; i++) {
      const item = experienceList[i];

      const hasAnyExperienceValue =
        !isBlank(item.fromPeriod) ||
        !isBlank(item.toPeriod) ||
        !isBlank(item.organization) ||
        !isBlank(item.employmentType) ||
        !isBlank(item.hoursPerWeek) ||
        !isBlank(item.positionTitle) ||
        !isBlank(item.responsibilities) ||
        !isBlank(item.autonomy) ||
        !isBlank(item.influence) ||
        !isBlank(item.complexity) ||
        !isBlank(item.businessSkills) ||
        !isBlank(item.knowledge);

      if (hasAnyExperienceValue) {
        if (isBlank(item.fromPeriod)) {
          return `Experience ${i + 1}: From (MM/YY) is required.`;
        }
        if (isBlank(item.toPeriod)) {
          return `Experience ${i + 1}: To (MM/YY) is required.`;
        }
        if (isBlank(item.organization)) {
          return `Experience ${i + 1}: Organization is required.`;
        }
        if (isBlank(item.employmentType)) {
          return `Experience ${i + 1}: Full Time or Part Time is required.`;
        }
        if (item.employmentType === "PartTime" && isBlank(item.hoursPerWeek)) {
          return `Experience ${i + 1}: Hours per week is required for part-time.`;
        }
        if (isBlank(item.positionTitle)) {
          return `Experience ${i + 1}: Position Title is required.`;
        }
        if (isBlank(item.responsibilities)) {
          return `Experience ${i + 1}: Responsibilities are required.`;
        }
      }
    }

    if (bcsPassed === "true" || iccpPassed === "true") {
      if (isBlank(examCompletionDate)) {
        return "Exam Route: Date completed is required.";
      }
      if (isBlank(examLastNameOnTranscript)) {
        return "Exam Route: Last name on transcript is required.";
      }
      if (isBlank(examTranscriptSentDate)) {
        return "Exam Route: Date official transcript sent to CIPS is required.";
      }
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
      form.append("applicantInitial", applicantInitial.trim());
      form.append("declarationDate", declarationDate);

      form.append("bcsPassed", bcsPassed);
      form.append("iccpPassed", iccpPassed);
      form.append("examCompletionDate", examCompletionDate);
      form.append("examLastNameOnTranscript", examLastNameOnTranscript.trim());
      form.append("examTranscriptSentDate", examTranscriptSentDate);

      form.append("applicationEasyToComplete", applicationEasyToComplete);
      form.append("instructionsClear", instructionsClear);
      form.append("unclearAreas", unclearAreas.trim());
      form.append("additionalFeedback", additionalFeedback.trim());

      form.append("education", JSON.stringify(educationList));
      form.append("experience", JSON.stringify(experienceList));

      if (resume) form.append("resume", resume);
      if (sfiaAssessment) form.append("sfiaAssessment", sfiaAssessment);
      if (membershipCard) form.append("membershipCard", membershipCard);
      if (paymentReceipt) form.append("paymentReceipt", paymentReceipt);
      if (referenceLetters) form.append("referenceLetters", referenceLetters);
      if (sponsorLetters) form.append("sponsorLetters", sponsorLetters);
      if (educationProof) form.append("educationProof", educationProof);

      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage({
          type: "err",
          text: data?.message || "Submit failed.",
        });
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
          : null
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
              {getDisplayStatus(submittedApplication.Status)}
            </span>
          </div>

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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                APPLICATION ID
              </p>
              <p className="text-sm text-slate-900">{submittedApplication.Id}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">APPLICANT</p>
              <p className="text-sm text-slate-900">
                {submittedApplication.FirstName} {submittedApplication.LastName}
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

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Current Status</p>
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            CIPS Certification Application
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            This application is for the AITP, I.S.P., and ITCP designations.
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
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Privacy Code Statement
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Personal information provided by the applicant is used solely by the
              CIPS National and Provincial Registrars’ office and members of the
              certification and their subcommittees for the purpose of assessing
              an applicant’s ability to meet the certification criteria, verifying
              information, performing an audit of Certification Council procedures,
              and providing certification related products and services.
            </p>

            <h3 className="mt-6 text-base font-semibold text-slate-900">
              Application Requirements
            </h3>

            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <p>1 - CIPS MEMBERSHIP – ATTACH MEMBERSHIP CARD</p>
              <p>
                2 - CERTIFICATION APPLICATION REVIEW FEE PAYMENT – ATTACH PAYMENT
                RECEIPT
              </p>
              <p>
                3 - REFERENCES (I.S.P / ITCP) - FOR APPLICANTS WITH IT WORK
                EXPERIENCE – ATTACH LETTERS
              </p>
              <p>
                4 - SPONSORS (AITP) - FOR APPLICANTS WITH NO IT WORK EXPERIENCE –
                ATTACH LETTERS
              </p>
              <p>
                5 - CERTIFICATION APPLICATION – ATTACH COMPLETED APPLICATION
                SECTIONS, RESUME/CV, AND SFIA SKILLS ASSESSMENT
              </p>
              <p className="font-medium text-slate-800">
                Official transcripts / education equivalency assessments must be
                sent directly from the institution / assessment center to CIPS.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Applicant Information
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
                  placeholder="e.g. 123456 or 2025/01/20"
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
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-700">
                I CERTIFY THAT THE INFORMATION SET OUT BY ME IN THIS DOCUMENT IS
                TRUE AND CORRECT TO THE BEST OF MY KNOWLEDGE. I BELIEVE I CAN
                SERVE CIPS, THE PERSONS TO WHOM I OFFER SERVICES AND THE GENERAL
                PUBLIC IN THE HIGHEST PROFESSIONAL MANNER. I HAVE REVIEWED AND
                ADHERE TO THE CIPS CODE OF ETHICS PROFESSIONAL CONDUCT. I
                UNDERSTAND PERSONS AND ORGANIZATIONS LISTED ON THIS APPLICATION MAY
                BE CONTACTED. I AUTHORIZE THE RELEASE OF INFORMATION FOR THE
                PURPOSE OF THIS APPLICATION.
              </p>

              <label className="mt-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm text-slate-700">
                  I certify and agree to the declaration above.
                </span>
              </label>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    SIGNATURE OR INITIAL *
                  </span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={applicantInitial}
                    onChange={(e) => setApplicantInitial(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    DATE (MM/DD/YYYY) *
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={declarationDate}
                    onChange={(e) => setDeclarationDate(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5.1 – Education Review
            </h2>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p>
                IF YOU DO NOT HAVE AN IT RELATED DIPLOMA OR DEGREE PROCEED TO
                SECTION “5.2 EXPERIENCE”.
              </p>
              <p>
                NOTE: WITHOUT AN IT RELATED DIPLOMA OR DEGREE MORE IT EXPERIENCE
                IS REQUIRED TO BE APPROVED FOR CIPS’ CERTIFICATION(S).
              </p>
              <p>SEE APPENDIX 6.1 FOR EDUCATION REQUIREMENTS.</p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-medium text-slate-900">
                EDUCATION BEING SUBMITTED FOR REVIEW TO CIPS
              </p>
              <p>
                NOTE: OFFICIAL DOCUMENTS MUST BE SENT DIRECTLY FROM THE
                INSTITUTION / ASSESSMENT CENTER TO CIPS. COPIES RECEIVED FROM
                APPLICANTS ARE NOT ACCEPTED.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Education Entries
              </h3>
              <button
                type="button"
                onClick={addEducation}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                Add Education
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {educationList.map((edu, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Education {index + 1}
                    </h4>

                    {educationList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Name of University/College *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.institutionName}
                        onChange={(e) =>
                          updateEducation(index, "institutionName", e.target.value)
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
                          updateEducation(index, "lastNameOnTranscript", e.target.value)
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
                          updateEducation(index, "firstNameOnTranscript", e.target.value)
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
                        onChange={(e) => updateEducation(index, "city", e.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Did you graduate? *
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.graduated}
                        onChange={(e) =>
                          updateEducation(index, "graduated", e.target.value)
                        }
                      >
                        <option value="true">YES</option>
                        <option value="false">NO</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Attended from (YYYY/MM/DD) *
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
                        Attended to (YYYY/MM/DD) *
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
                        Date Official Transcript sent to CIPS (YYYY/MM/DD)
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.transcriptSentDate}
                        onChange={(e) =>
                          updateEducation(index, "transcriptSentDate", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        For schools outside of North America: Canadian education
                        equivalency service used
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.equivalencyService}
                        onChange={(e) =>
                          updateEducation(index, "equivalencyService", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Date official Canadian course-by-course education
                        equivalency assessment sent to CIPS (YYYY/MM/DD)
                      </span>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.equivalencyAssessmentDate}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "equivalencyAssessmentDate",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Education equivalency assessment Reference number
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={edu.equivalencyRefNumber}
                        onChange={(e) =>
                          updateEducation(index, "equivalencyRefNumber", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 p-4">
              <h3 className="text-base font-semibold text-slate-900">
                Exam Route (BCS / ICCP Exams)
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Passed the BCS Diploma Level or Professional Graduate Level
                    Exams?
                  </span>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={bcsPassed}
                    onChange={(e) => setBcsPassed(e.target.value)}
                  >
                    <option value="false">NO</option>
                    <option value="true">YES</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Passed the ICCP Examinations Leading to CCP (or equivalent)?
                  </span>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={iccpPassed}
                    onChange={(e) => setIccpPassed(e.target.value)}
                  >
                    <option value="false">NO</option>
                    <option value="true">YES</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Date Completed (YYYY/MM/DD)
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={examCompletionDate}
                    onChange={(e) => setExamCompletionDate(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Last name on Transcript
                  </span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={examLastNameOnTranscript}
                    onChange={(e) => setExamLastNameOnTranscript(e.target.value)}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Date Official Transcript sent to CIPS from the BCS/ICCP
                    (YYYY/MM/DD)
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={examTranscriptSentDate}
                    onChange={(e) => setExamTranscriptSentDate(e.target.value)}
                  />
                </label>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                The BCS or ICCP must send an official transcript directly to the
                CIPS Office of the Registrar if applying under the Exam Route. The
                transcript cannot be mailed with the application.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5.2 – Experience Review
            </h2>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p>SEE APPENDIX 6.2 FOR EXPERIENCE REQUIREMENTS.</p>
              <p className="mt-2">
                Copy and paste additional Experience Templates as required for more
                positions. Please ensure to document your entire IT work history
                and to provide specific details and examples of your IT
                professional work responsibilities and activities.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Experience Entries
              </h3>
              <button
                type="button"
                onClick={addExperience}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                Add Experience
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {experienceList.map((exp, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Experience {index + 1}
                    </h4>

                    {experienceList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        A. Time Period - From (MM/YY) *
                      </span>
                      <input
                        placeholder="e.g. 01/24"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.fromPeriod}
                        onChange={(e) =>
                          updateExperience(index, "fromPeriod", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        To (MM/YY) *
                      </span>
                      <input
                        placeholder="e.g. 12/25"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.toPeriod}
                        onChange={(e) =>
                          updateExperience(index, "toPeriod", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        B. Organization *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.organization}
                        onChange={(e) =>
                          updateExperience(index, "organization", e.target.value)
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Full Time or Part Time? (If PT indicate hours per week) *
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.employmentType}
                        onChange={(e) =>
                          updateExperience(index, "employmentType", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="FullTime">Full Time</option>
                        <option value="PartTime">Part Time</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Hours per week
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.hoursPerWeek}
                        onChange={(e) =>
                          updateExperience(index, "hoursPerWeek", e.target.value)
                        }
                        placeholder="Only needed if PT"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        C. Position Title *
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.positionTitle}
                        onChange={(e) =>
                          updateExperience(index, "positionTitle", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        D. Responsibilities *
                      </span>
                      <textarea
                        rows={5}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.responsibilities}
                        onChange={(e) =>
                          updateExperience(index, "responsibilities", e.target.value)
                        }
                        placeholder="Provide specific examples of your IT professional work responsibilities and activities and relate them to SFIA levels."
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        AUTONOMY
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        See SFIA responsibilities: autonomy
                      </p>
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
                        INFLUENCE
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
                        COMPLEXITY
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
                        BUSINESS SKILLS
                      </span>
                      <textarea
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={exp.businessSkills}
                        onChange={(e) =>
                          updateExperience(index, "businessSkills", e.target.value)
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        KNOWLEDGE
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
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Supporting Documents
            </h2>

            <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p>
                Reference letters are for I.S.P./ITCP applicants with IT work
                experience.
              </p>
              <p>
                Sponsor letters are for AITP applicants with no IT work
                experience.
              </p>
              <p>
                Please attach the completed and signed reference/sponsor letter(s)
                to this application.
              </p>
              <p>Letters of appointment or contracts are not accepted.</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  CIPS Membership Card *
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setMembershipCard(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Certification Application Review Fee Payment Receipt *
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Reference Letters
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setReferenceLetters(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Sponsor Letters
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setSponsorLetters(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Resume / CV *
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  SFIA Skills Assessment *
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setSfiaAssessment(e.target.files?.[0] || null)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Education / Equivalency Supporting Document
                </span>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 active:file:scale-95"
                  onChange={(e) => setEducationProof(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Application Feedback
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Did you find the application easy to complete?
                </span>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={applicationEasyToComplete}
                  onChange={(e) => setApplicationEasyToComplete(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Were the instructions clear?
                </span>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={instructionsClear}
                  onChange={(e) => setInstructionsClear(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Were there any areas in the application form that were not
                  clear?
                </span>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={unclearAreas}
                  onChange={(e) => setUnclearAreas(e.target.value)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Additional Feedback
                </span>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
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