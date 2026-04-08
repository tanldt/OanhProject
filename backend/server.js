require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { getPool, sql } = require("./db");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

// ---------- Ensure uploads folder exists ----------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---------- Middleware ----------
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

app.use(
  session({
    name: "cips.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-later",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// ---------- Upload config ----------
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024, files:20 },
});

// ---------- Roles ----------
const validRoles = [
  "Applicant",
  "Office",
  "EducationReviewer",
  "ExperienceReviewer",
];

// ---------- Email -> Role mapping ----------
const EMAIL_ROLE_MAP = {
  "office1@cips.ca": "Office",
  "office2@cips.ca": "Office",

  "edu1@cips.ca": "EducationReviewer",
  "edu2@cips.ca": "EducationReviewer",
  "edu3@cips.ca": "EducationReviewer",

  "exp1@cips.ca": "ExperienceReviewer",
  "exp2@cips.ca": "ExperienceReviewer",
  "exp3@cips.ca": "ExperienceReviewer",

  "aryan@gmail.com": "Applicant",
  "myra@gmail.com": "Applicant",
  "oanh@gmail.com": "Applicant",
  "ritz@gmail.com": "Applicant",
  "vance@gmail.com": "Applicant",
  "rayhan@gmail.com": "Applicant",
  "tom@gmail.com": "Applicant",
  "barclay@gmail.com": "Applicant",
  "mike@gmail.com": "Applicant",
};

function getRoleForEmail(email) {
  const e = String(email || "").toLowerCase().trim();
  return EMAIL_ROLE_MAP[e] || null;
}

async function buildUserFromEmail(email) {
  const role = await getDynamicRoleForEmail(email);
  if (!role || !validRoles.includes(role)) return null;

  return {
    id: `user-${String(email).toLowerCase()}`,
    name: String(email).split("@")[0],
    email,
    roles: [role],
  };
}

function requireRole(roles) {
  return (req, res, next) => {
    const user = req.session.user;

    if (!user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const ok = (user.roles || []).some((r) => roles.includes(r));
    if (!ok) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

// ---------- Membee helpers ----------
const MEMBEE_APIKEY = process.env.MEMBEE_APIKEY || "";
const MEMBEE_CLIENTID = process.env.MEMBEE_CLIENTID || "";
const MEMBEE_APPID = process.env.MEMBEE_APPID || "";

function buildMembeeExchangeUrl(token) {
  const base =
    "https://memberservices.membee.com/Feeds/Profile/ExchangeTokenForID/";

  const qs = new URLSearchParams({
    APIKEY: MEMBEE_APIKEY,
    ClientID: MEMBEE_CLIENTID,
    AppID: MEMBEE_APPID,
    Token: token,
  });

  return `${base}?${qs.toString()}`;
}

// ---------- Utility helpers ----------
function parseMembershipOrJoinDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return {
      membershipNumber: null,
      membershipJoinDate: null,
    };
  }

  const looksLikeDate = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  if (looksLikeDate) {
    return {
      membershipNumber: null,
      membershipJoinDate: raw,
    };
  }

  return {
    membershipNumber: raw,
    membershipJoinDate: null,
  };
}

async function ensureOfficeStaffRow(userEmail) {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("Email", sql.NVarChar(255), userEmail)
    .query(`
      SELECT TOP 1 StaffID
      FROM Office.Staff
      WHERE Email = @Email
    `);

  if (existing.recordset.length > 0) {
    return existing.recordset[0].StaffID;
  }

  const localPart = userEmail.split("@")[0] || "office";
  const inserted = await pool
    .request()
    .input("FirstName", sql.NVarChar(100), localPart)
    .input("LastName", sql.NVarChar(100), "User")
    .input("Email", sql.NVarChar(255), userEmail)
    .input("Role", sql.NVarChar(50), "OfficeStaff")
    .query(`
      INSERT INTO Office.Staff
      (
        FirstName,
        LastName,
        Email,
        Role,
        IsActive,
        CreatedAt
      )
      OUTPUT INSERTED.StaffID
      VALUES
      (
        @FirstName,
        @LastName,
        @Email,
        @Role,
        1,
        SYSDATETIME()
      )
    `);

  return inserted.recordset[0].StaffID;
}

async function ensureReviewerRow(userEmail, reviewerType) {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("Email", sql.NVarChar(255), userEmail)
    .query(`
      SELECT TOP 1 ReviewerID
      FROM Reviewer.Reviewer
      WHERE Email = @Email
    `);

  if (existing.recordset.length > 0) {
    return existing.recordset[0].ReviewerID;
  }

  const localPart = userEmail.split("@")[0] || "reviewer";
  const inserted = await pool
    .request()
    .input("FirstName", sql.NVarChar(100), localPart)
    .input("LastName", sql.NVarChar(100), "User")
    .input("Email", sql.NVarChar(255), userEmail)
    .input("ReviewerType", sql.NVarChar(20), reviewerType)
    .query(`
      INSERT INTO Reviewer.Reviewer
      (
        FirstName,
        LastName,
        Email,
        ReviewerType,
        IsActive,
        CreatedAt
      )
      OUTPUT INSERTED.ReviewerID
      VALUES
      (
        @FirstName,
        @LastName,
        @Email,
        @ReviewerType,
        1,
        SYSDATETIME()
      )
    `);

  return inserted.recordset[0].ReviewerID;
}

async function ensureDemoReviewerRows() {
  const entries = Object.entries(EMAIL_ROLE_MAP);
  for (const [email, role] of entries) {
    if (role === "EducationReviewer") {
      await ensureReviewerRow(email, "Education");
    } else if (role === "ExperienceReviewer") {
      await ensureReviewerRow(email, "Experience");
    }
  }
}

async function getReviewerIdByEmail(email) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("Email", sql.NVarChar(255), email)
    .query(`
      SELECT TOP 1 ReviewerID, ReviewerType
      FROM Reviewer.Reviewer
      WHERE Email = @Email
    `);

  return result.recordset[0] || null;
}

// ---------- Routes ----------
app.get("/api/health", async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    return res.json({ ok: true, db: true });
  } catch (err) {
    console.error("Health check DB error:", err);
    return res.status(500).json({ ok: false, db: false });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  return res.json({ user: req.session.user });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("cips.sid");
    return res.json({ message: "Logged out" });
  });
});

app.get("/api/auth/membee/exchange", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ message: "Token required" });
  }

  const rawToken = String(token || "");

  // ---------- Demo mode handling ----------
  if (rawToken.startsWith("DEV|")) {
    const email = rawToken.split("|")[1]?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Demo email is missing" });
    }

    const user = await buildUserFromEmail(email);

    if (!user) {
      return res.status(403).json({
        message:
          "This account is not an active CIPS member or is not authorized for this portal.",
      });
    }

    req.session.user = {
      ...user,
      membee: { rawRoles: ["DEV_EMAIL_MAPPING"] },
    };

    return res.json({
      user: req.session.user,
      mode: "dev",
    });
  }

  // ---------- Real Membee handling ----------
  if (!MEMBEE_APIKEY || !MEMBEE_CLIENTID || !MEMBEE_APPID) {
    return res.status(500).json({
      message:
        "Membee env vars missing. Set MEMBEE_APIKEY, MEMBEE_CLIENTID, MEMBEE_APPID in backend/.env, or use DEV|email tokens in demo mode.",
    });
  }

  try {
    const url = buildMembeeExchangeUrl(String(token));
    const r = await fetch(url);

    if (!r.ok) {
      return res.status(401).json({
        message: "Membee token exchange failed",
        status: r.status,
      });
    }

    const profile = await r.json();
    const email = profile.Email || profile.email;

    if (!email) {
      return res
        .status(401)
        .json({ message: "Membee exchange returned no email" });
    }

    const user = await buildUserFromEmail(email);
    if (!user) {
      return res.status(403).json({
        message:
          "This account is not an active CIPS member or is not authorized for this portal.",
      });
    }

    user.membee = { raw: profile };
    req.session.user = user;

    return res.json({ user, mode: "membee" });
  } catch (e) {
    console.error("Membee exchange error:", e);
    return res.status(500).json({ message: "Membee exchange error" });
  }
});

// ---------- Applicant submits application ----------
app.post(
  "/api/applications",
  requireRole(["Applicant"]),
  upload.any(),
  async (req, res) => {
    try {
      const user = req.session.user;

      const {
        firstName,
        lastName,
        membershipOrJoinDate,
        certificateName,
        declarationAccepted,
        references,
        education,
        experience,
        additionalDocuments,
      } = req.body;

      if (!firstName || !String(firstName).trim()) {
        return res.status(400).json({ message: "First name is required" });
      }

      if (!lastName || !String(lastName).trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }

      if (!membershipOrJoinDate || !String(membershipOrJoinDate).trim()) {
        return res
          .status(400)
          .json({ message: "CIPS membership number or joined date is required" });
      }

      if (!certificateName || !String(certificateName).trim()) {
        return res.status(400).json({ message: "Certificate name is required" });
      }

      if (!(String(declarationAccepted) === "true")) {
        return res.status(400).json({ message: "Declaration must be accepted" });
      }

      let referencesList = [];
      let educationList = [];
      let experienceList = [];
      let additionalDocumentsList = [];

      try {
        referencesList = JSON.parse(references || "[]");
      } catch {
        return res.status(400).json({ message: "References data is invalid" });
      }

      try {
        educationList = JSON.parse(education || "[]");
      } catch {
        return res.status(400).json({ message: "Education data is invalid" });
      }

      try {
        experienceList = JSON.parse(experience || "[]");
      } catch {
        return res.status(400).json({ message: "Experience data is invalid" });
      }

      try {
        additionalDocumentsList = JSON.parse(additionalDocuments || "[]");
      } catch {
        return res.status(400).json({ message: "Additional documents data is invalid" });
      }

      if (!Array.isArray(educationList) || educationList.length === 0) {
        return res.status(400).json({ message: "At least one education record is required" });
      }

      if (!Array.isArray(experienceList) || experienceList.length === 0) {
        return res.status(400).json({ message: "At least one experience record is required" });
      }

      const files = Array.isArray(req.files) ? req.files : [];

      const getSingleFile = (fieldName) => {
        return files.find((f) => f.fieldname === fieldName) || null;
      };

      const getManyFiles = (fieldName) => {
        return files.filter((f) => f.fieldname === fieldName);
      };

      const resumeFile = getSingleFile("resume");
      const sfiaFile = getSingleFile("sfiaAssessment");

      if (!resumeFile) {
        return res.status(400).json({ message: "Resume is required" });
      }

      if (!sfiaFile) {
        return res.status(400).json({ message: "SFIA assessment file is required" });
      }

      for (const ref of referencesList) {
        if (!ref.referenceType || !String(ref.referenceType).trim()) {
          return res.status(400).json({ message: "Reference type is required" });
        }

        if (!ref.refereeName || !String(ref.refereeName).trim()) {
          return res.status(400).json({ message: "Reference or sponsor name is required" });
        }

        if (!ref.refereeOrg || !String(ref.refereeOrg).trim()) {
          return res.status(400).json({ message: "Reference or sponsor organization is required" });
        }
      }

      for (const edu of educationList) {
        if (!edu.institutionName || !String(edu.institutionName).trim()) {
          return res.status(400).json({ message: "Institution name is required" });
        }
        if (!edu.lastNameOnTranscript || !String(edu.lastNameOnTranscript).trim()) {
          return res.status(400).json({ message: "Last name on transcript is required" });
        }
        if (!edu.firstNameOnTranscript || !String(edu.firstNameOnTranscript).trim()) {
          return res.status(400).json({ message: "First name on transcript is required" });
        }
        if (!edu.programName || !String(edu.programName).trim()) {
          return res.status(400).json({ message: "Program name is required" });
        }
        if (!edu.city || !String(edu.city).trim()) {
          return res.status(400).json({ message: "City is required" });
        }
        if (!edu.attendedFrom || !String(edu.attendedFrom).trim()) {
          return res.status(400).json({ message: "Attended from date is required" });
        }
        if (!edu.attendedTo || !String(edu.attendedTo).trim()) {
          return res.status(400).json({ message: "Attended to date is required" });
        }
      }

      for (const exp of experienceList) {
        if (!exp.organization || !String(exp.organization).trim()) {
          return res.status(400).json({ message: "Organization is required" });
        }
        if (!exp.positionTitle || !String(exp.positionTitle).trim()) {
          return res.status(400).json({ message: "Position title is required" });
        }
        if (!exp.startDate || !String(exp.startDate).trim()) {
          return res.status(400).json({ message: "Experience start date is required" });
        }
        if (!exp.employmentType || !["FullTime", "PartTime"].includes(String(exp.employmentType))) {
          return res
            .status(400)
            .json({ message: "Employment type must be FullTime or PartTime" });
        }
        if (
          exp.hoursPerWeek === undefined ||
          exp.hoursPerWeek === null ||
          String(exp.hoursPerWeek).trim() === ""
        ) {
          return res.status(400).json({ message: "Hours per week is required" });
        }
      }

      const pool = await getPool();
      const parsed = parseMembershipOrJoinDate(membershipOrJoinDate);

      const insertApplicant = await pool
        .request()
        .input("FirstName", sql.NVarChar(100), String(firstName).trim())
        .input("LastName", sql.NVarChar(100), String(lastName).trim())
        .input("CertificateName", sql.NVarChar(200), String(certificateName).trim())
        .input("Email", sql.NVarChar(255), user.email)
        .input("MembershipNumber", sql.NVarChar(50), parsed.membershipNumber)
        .input("MembershipJoinDate", sql.Date, parsed.membershipJoinDate)
        .input("ApplicationStatus", sql.NVarChar(20), "Submitted")
        .input("DeclarationSigned", sql.Bit, 1)
        .query(`
          INSERT INTO Applicant.Applicant
          (
            FirstName,
            LastName,
            CertificateName,
            Email,
            MembershipNumber,
            MembershipJoinDate,
            ApplicationStatus,
            DeclarationSigned,
            DeclarationDate,
            SubmittedDate,
            CreatedAt,
            UpdatedAt
          )
          OUTPUT
            INSERTED.ApplicantID,
            INSERTED.FirstName,
            INSERTED.LastName,
            INSERTED.CertificateName,
            INSERTED.Email,
            INSERTED.MembershipNumber,
            INSERTED.MembershipJoinDate,
            INSERTED.ApplicationStatus,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt,
            INSERTED.SubmittedDate
          VALUES
          (
            @FirstName,
            @LastName,
            @CertificateName,
            @Email,
            @MembershipNumber,
            @MembershipJoinDate,
            @ApplicationStatus,
            @DeclarationSigned,
            CAST(GETDATE() AS DATE),
            CAST(GETDATE() AS DATE),
            SYSDATETIME(),
            SYSDATETIME()
          )
        `);

      const applicant = insertApplicant.recordset[0];
      const applicantId = applicant.ApplicantID;

      const insertDocumentRow = async (documentType, file) => {
        const result = await pool
          .request()
          .input("ApplicantID", sql.Int, applicantId)
          .input("DocumentType", sql.NVarChar(50), documentType)
          .input("FileName", sql.NVarChar(255), file.originalname)
          .input("FilePath", sql.NVarChar(500), file.path)
          .input("MimeType", sql.NVarChar(100), file.mimetype)
          .input("FileSizeBytes", sql.BigInt, file.size)
          .query(`
            INSERT INTO Applicant.Document
            (
              ApplicantID,
              DocumentType,
              FileName,
              FilePath,
              MimeType,
              FileSizeBytes,
              UploadedAt
            )
            OUTPUT INSERTED.DocumentID
            VALUES
            (
              @ApplicantID,
              @DocumentType,
              @FileName,
              @FilePath,
              @MimeType,
              @FileSizeBytes,
              SYSDATETIME()
            )
          `);

        return result.recordset[0].DocumentID;
      };

      await insertDocumentRow("Resume", resumeFile);
      await insertDocumentRow("SFIAAssessment", sfiaFile);

      for (let i = 0; i < referencesList.length; i++) {
        const ref = referencesList[i];

        const dbReferenceType =
          ref.referenceType === "Sponsor" ? "AITP_Sponsor" : "ISP_ITCP";

        const insertedRef = await pool
          .request()
          .input("ApplicantID", sql.Int, applicantId)
          .input("ReferenceType", sql.NVarChar(20), dbReferenceType)
          .input("RefereeName", sql.NVarChar(200), String(ref.refereeName).trim())
          .input("RefereeTitle", sql.NVarChar(200), ref.refereeTitle ? String(ref.refereeTitle).trim() : null)
          .input("RefereeOrg", sql.NVarChar(255), String(ref.refereeOrg).trim())
          .input("RefereeEmail", sql.NVarChar(255), ref.refereeEmail ? String(ref.refereeEmail).trim() : null)
          .query(`
            INSERT INTO Applicant.ApplicantReference
            (
              ApplicantID,
              ReferenceType,
              RefereeName,
              RefereeTitle,
              RefereeOrg,
              RefereeEmail,
              LetterReceived,
              ReceivedDate,
              CreatedAt
            )
            OUTPUT INSERTED.ReferenceID
            VALUES
            (
              @ApplicantID,
              @ReferenceType,
              @RefereeName,
              @RefereeTitle,
              @RefereeOrg,
              @RefereeEmail,
              0,
              NULL,
              SYSDATETIME()
            )
          `);

        const letterFile = getSingleFile(`referenceLetter_${i}`);
        if (letterFile) {
          await insertDocumentRow(
            ref.referenceType === "Sponsor" ? "SponsorLetter" : "ReferenceLetter",
            letterFile
          );

          await pool
            .request()
            .input("ReferenceID", sql.Int, insertedRef.recordset[0].ReferenceID)
            .query(`
              UPDATE Applicant.ApplicantReference
              SET
                LetterReceived = 1,
                ReceivedDate = CAST(GETDATE() AS DATE)
              WHERE ReferenceID = @ReferenceID
            `);
        }
      }

      for (const edu of educationList) {
        await pool
          .request()
          .input("ApplicantID", sql.Int, applicantId)
          .input("InstitutionName", sql.NVarChar(255), String(edu.institutionName).trim())
          .input("LastNameOnTranscript", sql.NVarChar(100), String(edu.lastNameOnTranscript).trim())
          .input("FirstNameOnTranscript", sql.NVarChar(100), String(edu.firstNameOnTranscript).trim())
          .input("ProgramName", sql.NVarChar(255), String(edu.programName).trim())
          .input("City", sql.NVarChar(100), String(edu.city).trim())
          .input("AttendedFrom", sql.Date, edu.attendedFrom)
          .input("AttendedTo", sql.Date, edu.attendedTo)
          .input("Graduated", sql.Bit, String(edu.graduated) === "true" ? 1 : 0)
          .input("TranscriptSentDate", sql.Date, edu.transcriptSentDate ? edu.transcriptSentDate : null)
          .input("EquivalencyService", sql.NVarChar(255), edu.equivalencyService ? String(edu.equivalencyService).trim() : null)
          .input("EquivalencyAssessmentDate", sql.Date, edu.equivalencyAssessmentDate ? edu.equivalencyAssessmentDate : null)
          .input("EquivalencyRefNumber", sql.NVarChar(100), edu.equivalencyRefNumber ? String(edu.equivalencyRefNumber).trim() : null)
          .query(`
            INSERT INTO Applicant.Education
            (
              ApplicantID,
              InstitutionName,
              LastNameOnTranscript,
              FirstNameOnTranscript,
              ProgramName,
              City,
              AttendedFrom,
              AttendedTo,
              Graduated,
              TranscriptSentDate,
              EquivalencyService,
              EquivalencyAssessmentDate,
              EquivalencyRefNumber,
              ExamRoute,
              ExamPassed,
              ExamCompletionDate,
              ExamTranscriptSentDate,
              CreatedAt
            )
            VALUES
            (
              @ApplicantID,
              @InstitutionName,
              @LastNameOnTranscript,
              @FirstNameOnTranscript,
              @ProgramName,
              @City,
              @AttendedFrom,
              @AttendedTo,
              @Graduated,
              @TranscriptSentDate,
              @EquivalencyService,
              @EquivalencyAssessmentDate,
              @EquivalencyRefNumber,
              NULL,
              NULL,
              NULL,
              NULL,
              SYSDATETIME()
            )
          `);
      }

      for (const exp of experienceList) {
        await pool
          .request()
          .input("ApplicantID", sql.Int, applicantId)
          .input("Organization", sql.NVarChar(255), String(exp.organization).trim())
          .input("PositionTitle", sql.NVarChar(255), String(exp.positionTitle).trim())
          .input("StartDate", sql.Date, exp.startDate)
          .input("EndDate", sql.Date, exp.endDate ? exp.endDate : null)
          .input("EmploymentType", sql.NVarChar(10), String(exp.employmentType))
          .input("HoursPerWeek", sql.Decimal(5, 2), Number(exp.hoursPerWeek))
          .input("Autonomy", sql.NVarChar(sql.MAX), exp.autonomy ? String(exp.autonomy).trim() : null)
          .input("Influence", sql.NVarChar(sql.MAX), exp.influence ? String(exp.influence).trim() : null)
          .input("Complexity", sql.NVarChar(sql.MAX), exp.complexity ? String(exp.complexity).trim() : null)
          .input("BusinessSkills", sql.NVarChar(sql.MAX), exp.businessSkills ? String(exp.businessSkills).trim() : null)
          .input("Knowledge", sql.NVarChar(sql.MAX), exp.knowledge ? String(exp.knowledge).trim() : null)
          .query(`
            INSERT INTO Applicant.Experience
            (
              ApplicantID,
              Organization,
              PositionTitle,
              StartDate,
              EndDate,
              EmploymentType,
              HoursPerWeek,
              SFIALevel,
              Autonomy,
              Influence,
              Complexity,
              BusinessSkills,
              Knowledge,
              CreatedAt
            )
            VALUES
            (
              @ApplicantID,
              @Organization,
              @PositionTitle,
              @StartDate,
              @EndDate,
              @EmploymentType,
              @HoursPerWeek,
              NULL,
              @Autonomy,
              @Influence,
              @Complexity,
              @BusinessSkills,
              @Knowledge,
              SYSDATETIME()
            )
          `);
      }

      const uploadedAdditionalFiles = getManyFiles("additionalDocuments");

      for (let i = 0; i < additionalDocumentsList.length; i++) {
        const meta = additionalDocumentsList[i];
        const file = uploadedAdditionalFiles[i];
        if (!file || !meta?.documentType) continue;

        await insertDocumentRow(meta.documentType, file);
      }

      return res.status(201).json({
        application: {
          id: applicant.ApplicantID,
          firstName: applicant.FirstName,
          lastName: applicant.LastName,
          certificateName: applicant.CertificateName,
          status: applicant.ApplicationStatus,
          createdAt: applicant.CreatedAt,
          updatedAt: applicant.UpdatedAt,
          submittedDate: applicant.SubmittedDate,
        },
      });
    } catch (err) {
      console.error("Create application error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Office list applications ----------
app.get("/api/applications", requireRole(["Office"]), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        a.ApplicantID AS Id,
        a.Email AS ApplicantEmail,
        a.FirstName,
        a.LastName,
        COALESCE(
          a.MembershipNumber,
          CONVERT(VARCHAR(10), a.MembershipJoinDate, 23)
        ) AS MembershipOrJoinDate,
        a.CertificateName,
        a.ApplicationStatus AS Status,
        a.CreatedAt,
        d.FileName AS ResumeOriginalName,
        d.MimeType AS ResumeMimeType,
        d.FileSizeBytes AS ResumeSizeBytes,
        d.FilePath AS ResumeStoredFileName
      FROM Applicant.Applicant a
      LEFT JOIN Applicant.Document d
        ON d.ApplicantID = a.ApplicantID
       AND d.DocumentType = 'Resume'
      ORDER BY a.CreatedAt DESC
    `);

    return res.json({ applications: result.recordset });
  } catch (err) {
    console.error("Load applications error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ---------- Reviewers dropdown ----------
app.get("/api/reviewers", requireRole(["Office"]), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        ReviewerID,
        FirstName,
        LastName,
        Email,
        ReviewerType
      FROM Reviewer.Reviewer
      WHERE IsActive = 1
      ORDER BY Email ASC
    `);

    const educationReviewers = [];
    const experienceReviewers = [];

    for (const r of result.recordset) {
      if (r.ReviewerType === "Education") {
        educationReviewers.push(r);
      } else if (r.ReviewerType === "Experience") {
        experienceReviewers.push(r);
      } else if (r.ReviewerType === "Both") {
        educationReviewers.push(r);
        experienceReviewers.push(r);
      }
    }

    return res.json({
      educationReviewers,
      experienceReviewers,
    });
  } catch (err) {
    console.error("Load reviewers error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

async function getDynamicRoleForEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  // first check hardcoded map
  const mappedRole = EMAIL_ROLE_MAP[normalizedEmail];
  if (mappedRole) {
    return mappedRole;
  }

  const pool = await getPool();

  // check office staff table
  const officeResult = await pool
    .request()
    .input("Email", sql.NVarChar(255), normalizedEmail)
    .query(`
      SELECT TOP 1 StaffID
      FROM Office.Staff
      WHERE Email = @Email
        AND IsActive = 1
    `);

  if (officeResult.recordset.length > 0) {
    return "Office";
  }

  // check reviewer table
  const reviewerResult = await pool
    .request()
    .input("Email", sql.NVarChar(255), normalizedEmail)
    .query(`
      SELECT TOP 1 ReviewerType
      FROM Reviewer.Reviewer
      WHERE Email = @Email
        AND IsActive = 1
    `);

  if (reviewerResult.recordset.length > 0) {
    const reviewerType = reviewerResult.recordset[0].ReviewerType;

    if (reviewerType === "Education") return "EducationReviewer";
    if (reviewerType === "Experience") return "ExperienceReviewer";

    // for Both, choose what fits your app best
    if (reviewerType === "Both") return "EducationReviewer";
  }

  return null;
}

// ---------- Reviewer management: add reviewer ----------
app.post("/api/reviewers", requireRole(["Office"]), async (req, res) => {
  try {
    const { firstName, lastName, email, reviewerType } = req.body;

    const trimmedFirstName = String(firstName || "").trim();
    const trimmedLastName = String(lastName || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedReviewerType = String(reviewerType || "").trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      return res.status(400).json({
        message: "First name, last name, and email are required",
      });
    }

    if (!["Education", "Experience", "Both"].includes(trimmedReviewerType)) {
      return res.status(400).json({
        message: "Reviewer type must be Education, Experience, or Both",
      });
    }

    const pool = await getPool();

    const existingReviewer = await pool
      .request()
      .input("Email", sql.NVarChar(255), trimmedEmail)
      .query(`
        SELECT TOP 1 ReviewerID
        FROM Reviewer.Reviewer
        WHERE Email = @Email
      `);

    if (existingReviewer.recordset.length > 0) {
      await pool
        .request()
        .input("ReviewerID", sql.Int, existingReviewer.recordset[0].ReviewerID)
        .input("FirstName", sql.NVarChar(100), trimmedFirstName)
        .input("LastName", sql.NVarChar(100), trimmedLastName)
        .input("ReviewerType", sql.NVarChar(20), trimmedReviewerType)
        .query(`
          UPDATE Reviewer.Reviewer
          SET
            FirstName = @FirstName,
            LastName = @LastName,
            ReviewerType = @ReviewerType,
            IsActive = 1
          WHERE ReviewerID = @ReviewerID
        `);

      return res.json({ message: "Reviewer saved successfully" });
    }

    await pool
      .request()
      .input("FirstName", sql.NVarChar(100), trimmedFirstName)
      .input("LastName", sql.NVarChar(100), trimmedLastName)
      .input("Email", sql.NVarChar(255), trimmedEmail)
      .input("ReviewerType", sql.NVarChar(20), trimmedReviewerType)
      .query(`
        INSERT INTO Reviewer.Reviewer
        (
          FirstName,
          LastName,
          Email,
          ReviewerType,
          IsActive,
          CreatedAt
        )
        VALUES
        (
          @FirstName,
          @LastName,
          @Email,
          @ReviewerType,
          1,
          SYSDATETIME()
        )
      `);

    return res.status(201).json({ message: "Reviewer saved successfully" });
  } catch (err) {
    console.error("Add reviewer error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ---------- Reviewer management: remove reviewer ----------
app.delete("/api/reviewers/:id", requireRole(["Office"]), async (req, res) => {
  try {
    const reviewerId = Number(req.params.id);

    if (!Number.isInteger(reviewerId) || reviewerId <= 0) {
      return res.status(400).json({ message: "Invalid reviewer id" });
    }

    const pool = await getPool();

    await pool
      .request()
      .input("ReviewerID", sql.Int, reviewerId)
      .query(`
        UPDATE Reviewer.Reviewer
        SET IsActive = 0
        WHERE ReviewerID = @ReviewerID
      `);

    return res.json({ message: "Reviewer removed successfully" });
  } catch (err) {
    console.error("Remove reviewer error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ---------- Assign reviewers ----------
app.post(
  "/api/applications/:id/assign-reviewers",
  requireRole(["Office"]),
  async (req, res) => {
    try {
      const appId = Number(req.params.id);
      if (!Number.isInteger(appId) || appId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const { educationReviewerId, experienceReviewerId } = req.body;

      if (!educationReviewerId || !experienceReviewerId) {
        return res.status(400).json({
          message: "Education reviewer and experience reviewer are required",
        });
      }

      const pool = await getPool();
      const user = req.session.user;
      const staffId = await ensureOfficeStaffRow(user.email);

      const applicantExists = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1 ApplicantID
          FROM Applicant.Applicant
          WHERE ApplicantID = @ApplicantID
        `);

      if (applicantExists.recordset.length === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      const reviewExists = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1 ReviewID
          FROM Office.ApplicationReview
          WHERE ApplicantID = @ApplicantID
        `);

      if (reviewExists.recordset.length > 0) {
        await pool
          .request()
          .input("ReviewID", sql.Int, reviewExists.recordset[0].ReviewID)
          .input("EducationReviewerID", sql.Int, Number(educationReviewerId))
          .input("ExperienceReviewerID", sql.Int, Number(experienceReviewerId))
          .input("AssignedByStaffID", sql.Int, staffId)
          .query(`
            UPDATE Office.ApplicationReview
            SET
              EducationReviewerID = @EducationReviewerID,
              ExperienceReviewerID = @ExperienceReviewerID,
              AssignedByStaffID = @AssignedByStaffID,
              UpdatedAt = SYSDATETIME()
            WHERE ReviewID = @ReviewID
          `);
      } else {
        await pool
          .request()
          .input("ApplicantID", sql.Int, appId)
          .input("AssignedByStaffID", sql.Int, staffId)
          .input("EducationReviewerID", sql.Int, Number(educationReviewerId))
          .input("ExperienceReviewerID", sql.Int, Number(experienceReviewerId))
          .input("Decision", sql.NVarChar(20), "Pending")
          .query(`
            INSERT INTO Office.ApplicationReview
            (
              ApplicantID,
              AssignedByStaffID,
              EducationReviewerID,
              ExperienceReviewerID,
              AssignedDate,
              Decision,
              TranscriptReceived,
              UpdatedAt
            )
            VALUES
            (
              @ApplicantID,
              @AssignedByStaffID,
              @EducationReviewerID,
              @ExperienceReviewerID,
              SYSDATETIME(),
              @Decision,
              0,
              SYSDATETIME()
            )
          `);
      }

      await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          UPDATE Applicant.Applicant
          SET
            ApplicationStatus = 'UnderReview',
            UpdatedAt = SYSDATETIME()
          WHERE ApplicantID = @ApplicantID
        `);

      return res.json({ message: "Reviewers assigned successfully" });
    } catch (err) {
      console.error("Assign reviewers error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Upload transcript ----------
app.post(
  "/api/applications/:id/upload-transcript",
  requireRole(["Office"]),
  upload.single("transcript"),
  async (req, res) => {
    try {
      const appId = Number(req.params.id);
      if (!Number.isInteger(appId) || appId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Transcript file is required" });
      }

      const pool = await getPool();

      const applicantExists = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1 ApplicantID
          FROM Applicant.Applicant
          WHERE ApplicantID = @ApplicantID
        `);

      if (applicantExists.recordset.length === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      const insertDocument = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .input("DocumentType", sql.NVarChar(50), "Transcript")
        .input("FileName", sql.NVarChar(255), req.file.originalname)
        .input("FilePath", sql.NVarChar(500), req.file.path)
        .input("MimeType", sql.NVarChar(100), req.file.mimetype)
        .input("FileSizeBytes", sql.BigInt, req.file.size)
        .query(`
          INSERT INTO Applicant.Document
          (
            ApplicantID,
            DocumentType,
            FileName,
            FilePath,
            MimeType,
            FileSizeBytes,
            UploadedAt
          )
          OUTPUT
            INSERTED.DocumentID,
            INSERTED.FileName,
            INSERTED.FilePath,
            INSERTED.MimeType,
            INSERTED.FileSizeBytes,
            INSERTED.UploadedAt
          VALUES
          (
            @ApplicantID,
            @DocumentType,
            @FileName,
            @FilePath,
            @MimeType,
            @FileSizeBytes,
            SYSDATETIME()
          )
        `);

      const officeUser = req.session.user;
      const staffId = await ensureOfficeStaffRow(officeUser.email);

      const reviewExists = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1 ReviewID
          FROM Office.ApplicationReview
          WHERE ApplicantID = @ApplicantID
        `);

      if (reviewExists.recordset.length > 0) {
        await pool
          .request()
          .input("ReviewID", sql.Int, reviewExists.recordset[0].ReviewID)
          .input("AssignedByStaffID", sql.Int, staffId)
          .query(`
            UPDATE Office.ApplicationReview
            SET
              AssignedByStaffID = @AssignedByStaffID,
              TranscriptReceived = 1,
              TranscriptReceivedDate = CAST(GETDATE() AS DATE),
              UpdatedAt = SYSDATETIME()
            WHERE ReviewID = @ReviewID
          `);
      } else {
        await pool
          .request()
          .input("ApplicantID", sql.Int, appId)
          .input("AssignedByStaffID", sql.Int, staffId)
          .input("Decision", sql.NVarChar(20), "Pending")
          .query(`
            INSERT INTO Office.ApplicationReview
            (
              ApplicantID,
              AssignedByStaffID,
              AssignedDate,
              Decision,
              TranscriptReceived,
              TranscriptReceivedDate,
              UpdatedAt
            )
            VALUES
            (
              @ApplicantID,
              @AssignedByStaffID,
              SYSDATETIME(),
              @Decision,
              1,
              CAST(GETDATE() AS DATE),
              SYSDATETIME()
            )
          `);
      }

      return res.json({
        message: "Transcript uploaded successfully",
        document: insertDocument.recordset[0],
      });
    } catch (err) {
      console.error("Upload transcript error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Save office review ----------
app.post(
  "/api/applications/:id/office-review",
  requireRole(["Office"]),
  async (req, res) => {
    try {
      const appId = Number(req.params.id);
      if (!Number.isInteger(appId) || appId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const { transcriptReceived, decision } = req.body;

      if (typeof transcriptReceived !== "boolean") {
        return res
          .status(400)
          .json({ message: "transcriptReceived must be true or false" });
      }

      if (!["Pending", "Approved", "Rejected"].includes(String(decision))) {
        return res.status(400).json({
          message: "Decision must be Pending, Approved, or Rejected",
        });
      }

      const pool = await getPool();
      const user = req.session.user;
      const staffId = await ensureOfficeStaffRow(user.email);

      const reviewExists = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1 ReviewID
          FROM Office.ApplicationReview
          WHERE ApplicantID = @ApplicantID
        `);

      if (reviewExists.recordset.length > 0) {
        await pool
          .request()
          .input("ReviewID", sql.Int, reviewExists.recordset[0].ReviewID)
          .input("AssignedByStaffID", sql.Int, staffId)
          .input("TranscriptReceived", sql.Bit, transcriptReceived ? 1 : 0)
          .input("Decision", sql.NVarChar(20), decision)
          .query(`
            UPDATE Office.ApplicationReview
            SET
              AssignedByStaffID = @AssignedByStaffID,
              TranscriptReceived = @TranscriptReceived,
              TranscriptReceivedDate = CASE
                WHEN @TranscriptReceived = 1 THEN CAST(GETDATE() AS DATE)
                ELSE NULL
              END,
              Decision = @Decision,
              DecisionDate = CASE
                WHEN @Decision IN ('Approved', 'Rejected') THEN CAST(GETDATE() AS DATE)
                ELSE NULL
              END,
              UpdatedAt = SYSDATETIME()
            WHERE ReviewID = @ReviewID
          `);
      } else {
        await pool
          .request()
          .input("ApplicantID", sql.Int, appId)
          .input("AssignedByStaffID", sql.Int, staffId)
          .input("TranscriptReceived", sql.Bit, transcriptReceived ? 1 : 0)
          .input("Decision", sql.NVarChar(20), decision)
          .query(`
            INSERT INTO Office.ApplicationReview
            (
              ApplicantID,
              AssignedByStaffID,
              AssignedDate,
              Decision,
              DecisionDate,
              TranscriptReceived,
              TranscriptReceivedDate,
              UpdatedAt
            )
            VALUES
            (
              @ApplicantID,
              @AssignedByStaffID,
              SYSDATETIME(),
              @Decision,
              CASE
                WHEN @Decision IN ('Approved', 'Rejected') THEN CAST(GETDATE() AS DATE)
                ELSE NULL
              END,
              @TranscriptReceived,
              CASE
                WHEN @TranscriptReceived = 1 THEN CAST(GETDATE() AS DATE)
                ELSE NULL
              END,
              SYSDATETIME()
            )
          `);
      }

      let newAppStatus = "UnderReview";
      if (decision === "Approved") newAppStatus = "Approved";
      if (decision === "Rejected") newAppStatus = "Rejected";

      await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .input("ApplicationStatus", sql.NVarChar(20), newAppStatus)
        .query(`
          UPDATE Applicant.Applicant
          SET
            ApplicationStatus = @ApplicationStatus,
            UpdatedAt = SYSDATETIME()
          WHERE ApplicantID = @ApplicantID
        `);

      return res.json({ message: "Office review saved successfully" });
    } catch (err) {
      console.error("Save office review error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Application detail ----------
app.get(
  "/api/applications/:id",
  requireRole(["Office", "EducationReviewer", "ExperienceReviewer"]),
  async (req, res) => {
    try {
      const appId = Number(req.params.id);
      if (!Number.isInteger(appId) || appId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const pool = await getPool();

      const appResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1
            a.ApplicantID AS Id,
            a.Email AS ApplicantEmail,
            a.FirstName,
            a.LastName,
            a.CertificateName,
            a.MembershipNumber,
            a.MembershipJoinDate,
            a.ApplicationStatus AS Status,
            a.DeclarationSigned,
            a.DeclarationDate,
            a.SubmittedDate,
            a.CreatedAt,
            a.UpdatedAt
          FROM Applicant.Applicant a
          WHERE a.ApplicantID = @ApplicantID
        `);

      if (appResult.recordset.length === 0) {
        return res.status(404).json({ message: "Not found" });
      }

      const educationResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT
            EducationID,
            InstitutionName,
            LastNameOnTranscript,
            FirstNameOnTranscript,
            ProgramName,
            City,
            AttendedFrom,
            AttendedTo,
            Graduated,
            TranscriptSentDate,
            EquivalencyService,
            EquivalencyAssessmentDate,
            EquivalencyRefNumber,
            ExamRoute,
            ExamPassed,
            ExamCompletionDate,
            ExamTranscriptSentDate,
            CreatedAt
          FROM Applicant.Education
          WHERE ApplicantID = @ApplicantID
          ORDER BY EducationID ASC
        `);

      const experienceResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT
            ExperienceID,
            Organization,
            PositionTitle,
            StartDate,
            EndDate,
            EmploymentType,
            HoursPerWeek,
            SFIALevel,
            Autonomy,
            Influence,
            Complexity,
            BusinessSkills,
            Knowledge,
            CreatedAt
          FROM Applicant.Experience
          WHERE ApplicantID = @ApplicantID
          ORDER BY ExperienceID ASC
        `);

      const documentResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT
            DocumentID,
            DocumentType,
            FileName,
            FilePath,
            MimeType,
            FileSizeBytes,
            UploadedAt
          FROM Applicant.Document
          WHERE ApplicantID = @ApplicantID
          ORDER BY DocumentID ASC
        `);

      const assignmentResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1
            ar.ReviewID,
            ar.AssignedDate,
            ar.Decision,
            ar.DesignationAwarded,
            ar.TranscriptReceived,
            ar.TranscriptReceivedDate,
            ar.DecisionDate,
            edu.ReviewerID AS EducationReviewerID,
            edu.Email AS EducationReviewerEmail,
            CONCAT(edu.FirstName, ' ', edu.LastName) AS EducationReviewerName,
            exp.ReviewerID AS ExperienceReviewerID,
            exp.Email AS ExperienceReviewerEmail,
            CONCAT(exp.FirstName, ' ', exp.LastName) AS ExperienceReviewerName
          FROM Office.ApplicationReview ar
          LEFT JOIN Reviewer.Reviewer edu
            ON edu.ReviewerID = ar.EducationReviewerID
          LEFT JOIN Reviewer.Reviewer exp
            ON exp.ReviewerID = ar.ExperienceReviewerID
          WHERE ar.ApplicantID = @ApplicantID
        `);

      const educationAssessmentResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1
            ea.TranscriptVerified,
            ea.ITCollegeCoursesCompleted,
            ea.ITUniversityCoursesCompleted,
            ea.YearsOfITEducation,
            ea.CategoryRecommended,
            ea.MeetsRequirement,
            ea.Comments,
            ea.AssessmentDate,
            r.FirstName,
            r.LastName
          FROM Reviewer.EducationAssessment ea
          INNER JOIN Office.ApplicationReview ar
            ON ar.ReviewID = ea.ReviewID
          INNER JOIN Reviewer.Reviewer r
            ON r.ReviewerID = ea.ReviewerID
          WHERE ar.ApplicantID = @ApplicantID
          ORDER BY ea.AssessmentDate DESC
        `);

      // ---------- Load Experience Reviewer Assessment ----------
      const experienceAssessmentResult = await pool
        .request()
        .input("ApplicantID", sql.Int, appId)
        .query(`
          SELECT TOP 1
            ea.TotalITYears,
            ea.HoursLast12Months,
            ea.CurrentSFIALevel,
            ea.Last2YearsSFIALevel,
            ea.RecommendedDesig,
            ea.MeetsRequirement,
            ea.Comments,
            ea.AssessmentDate,
            r.FirstName,
            r.LastName
          FROM Reviewer.ExperienceAssessment ea
          INNER JOIN Office.ApplicationReview ar
            ON ar.ReviewID = ea.ReviewID
          INNER JOIN Reviewer.Reviewer r
            ON r.ReviewerID = ea.ReviewerID
          WHERE ar.ApplicantID = @ApplicantID
          ORDER BY ea.AssessmentDate DESC
        `);

      return res.json({
        application: appResult.recordset[0],
        education: educationResult.recordset,
        experience: experienceResult.recordset,
        documents: documentResult.recordset,
        assignment:
          assignmentResult.recordset.length > 0
            ? assignmentResult.recordset[0]
            : null,
        educationAssessment:
          educationAssessmentResult.recordset.length > 0
            ? educationAssessmentResult.recordset[0]
            : null,
        experienceAssessment:
          experienceAssessmentResult.recordset.length > 0
            ? experienceAssessmentResult.recordset[0]
            : null,
      });
    } catch (err) {
      console.error("Load application detail error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Reviewer assigned applications ----------
app.get(
  "/api/reviewer/my-applications",
  requireRole(["EducationReviewer", "ExperienceReviewer"]),
  async (req, res) => {
    try {
      const user = req.session.user;
      await ensureDemoReviewerRows();

      const reviewer = await getReviewerIdByEmail(user.email);
      if (!reviewer) {
        return res.json({ applications: [] });
      }

      const pool = await getPool();

      let query = "";
      if (user.roles[0] === "EducationReviewer") {
        query = `
          SELECT
            a.ApplicantID AS Id,
            a.Email AS ApplicantEmail,
            a.FirstName,
            a.LastName,
            a.CertificateName,
            a.ApplicationStatus AS Status,
            ar.AssignedDate
          FROM Office.ApplicationReview ar
          INNER JOIN Applicant.Applicant a
            ON a.ApplicantID = ar.ApplicantID
          WHERE ar.EducationReviewerID = @ReviewerID
          ORDER BY ar.AssignedDate DESC
        `;
      } else {
        query = `
          SELECT
            a.ApplicantID AS Id,
            a.Email AS ApplicantEmail,
            a.FirstName,
            a.LastName,
            a.CertificateName,
            a.ApplicationStatus AS Status,
            ar.AssignedDate
          FROM Office.ApplicationReview ar
          INNER JOIN Applicant.Applicant a
            ON a.ApplicantID = ar.ApplicantID
          WHERE ar.ExperienceReviewerID = @ReviewerID
          ORDER BY ar.AssignedDate DESC
        `;
      }

      const result = await pool
        .request()
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(query);

      return res.json({ applications: result.recordset });
    } catch (err) {
      console.error("Load reviewer applications error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Experience reviewer assessment: load ----------
app.get(
  "/api/reviewer/experience-assessment/:applicationId",
  requireRole(["ExperienceReviewer"]),
  async (req, res) => {
    try {
      const applicationId = Number(req.params.applicationId);
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const user = req.session.user;
      await ensureDemoReviewerRows();

      const reviewer = await getReviewerIdByEmail(user.email);
      if (!reviewer) {
        return res.status(404).json({ message: "Reviewer not found" });
      }

      const pool = await getPool();

      const reviewCheck = await pool
        .request()
        .input("ApplicantID", sql.Int, applicationId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1
            ar.ReviewID
          FROM Office.ApplicationReview ar
          WHERE ar.ApplicantID = @ApplicantID
            AND ar.ExperienceReviewerID = @ReviewerID
        `);

      if (reviewCheck.recordset.length === 0) {
        return res.status(403).json({
          message: "This application is not assigned to you",
        });
      }

      const reviewId = reviewCheck.recordset[0].ReviewID;

      const assessment = await pool
        .request()
        .input("ReviewID", sql.Int, reviewId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1
            ExpAssessmentID,
            ReviewID,
            ReviewerID,
            TotalITYears,
            HoursLast12Months,
            CurrentSFIALevel,
            Last2YearsSFIALevel,
            MeetsRequirement,
            RecommendedDesig,
            Comments,
            AssessmentDate
          FROM Reviewer.ExperienceAssessment
          WHERE ReviewID = @ReviewID
            AND ReviewerID = @ReviewerID
          ORDER BY ExpAssessmentID DESC
        `);

      return res.json({
        reviewId,
        reviewerId: reviewer.ReviewerID,
        assessment: assessment.recordset.length > 0 ? assessment.recordset[0] : null,
      });
    } catch (err) {
      console.error("Load experience assessment error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Experience reviewer assessment: save ----------
app.post(
  "/api/reviewer/experience-assessment/:applicationId",
  requireRole(["ExperienceReviewer"]),
  async (req, res) => {
    try {
      const applicationId = Number(req.params.applicationId);
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const {
        totalITYears,
        hoursLast12Months,
        currentSFIALevel,
        last2YearsSFIALevel,
        recommendedDesig,
        meetsRequirement,
        comments,
      } = req.body;

      if (typeof meetsRequirement !== "boolean") {
        return res.status(400).json({
          message: "meetsRequirement must be true or false",
        });
      }

      const user = req.session.user;
      await ensureDemoReviewerRows();

      const reviewer = await getReviewerIdByEmail(user.email);
      if (!reviewer) {
        return res.status(404).json({ message: "Reviewer not found" });
      }

      const pool = await getPool();

      const reviewCheck = await pool
        .request()
        .input("ApplicantID", sql.Int, applicationId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1
            ar.ReviewID
          FROM Office.ApplicationReview ar
          WHERE ar.ApplicantID = @ApplicantID
            AND ar.ExperienceReviewerID = @ReviewerID
        `);

      if (reviewCheck.recordset.length === 0) {
        return res.status(403).json({
          message: "This application is not assigned to you",
        });
      }

      const reviewId = reviewCheck.recordset[0].ReviewID;

      const existing = await pool
        .request()
        .input("ReviewID", sql.Int, reviewId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1 ExpAssessmentID
          FROM Reviewer.ExperienceAssessment
          WHERE ReviewID = @ReviewID
            AND ReviewerID = @ReviewerID
        `);

      const normalizedTotalITYears =
        totalITYears === "" || totalITYears === null || totalITYears === undefined
          ? null
          : Number(totalITYears);

      const normalizedHoursLast12Months =
        hoursLast12Months === "" ||
        hoursLast12Months === null ||
        hoursLast12Months === undefined
          ? null
          : Number(hoursLast12Months);

      const normalizedCurrentSFIALevel =
        currentSFIALevel === "" ||
        currentSFIALevel === null ||
        currentSFIALevel === undefined
          ? null
          : Number(currentSFIALevel);

      const normalizedLast2YearsSFIALevel =
        last2YearsSFIALevel === "" ||
        last2YearsSFIALevel === null ||
        last2YearsSFIALevel === undefined
          ? null
          : Number(last2YearsSFIALevel);

      const normalizedRecommendedDesig =
        String(recommendedDesig || "").trim() || null;

      const normalizedComments = String(comments || "").trim() || null;

      if (existing.recordset.length > 0) {
        await pool
          .request()
          .input("ExpAssessmentID", sql.Int, existing.recordset[0].ExpAssessmentID)
          .input("TotalITYears", sql.Decimal(5, 2), normalizedTotalITYears)
          .input("HoursLast12Months", sql.Int, normalizedHoursLast12Months)
          .input("CurrentSFIALevel", sql.TinyInt, normalizedCurrentSFIALevel)
          .input("Last2YearsSFIALevel", sql.TinyInt, normalizedLast2YearsSFIALevel)
          .input("MeetsRequirement", sql.Bit, meetsRequirement ? 1 : 0)
          .input("RecommendedDesig", sql.NVarChar(20), normalizedRecommendedDesig)
          .input("Comments", sql.NVarChar(sql.MAX), normalizedComments)
          .query(`
            UPDATE Reviewer.ExperienceAssessment
            SET
              TotalITYears = @TotalITYears,
              HoursLast12Months = @HoursLast12Months,
              CurrentSFIALevel = @CurrentSFIALevel,
              Last2YearsSFIALevel = @Last2YearsSFIALevel,
              MeetsRequirement = @MeetsRequirement,
              RecommendedDesig = @RecommendedDesig,
              Comments = @Comments,
              AssessmentDate = SYSDATETIME()
            WHERE ExpAssessmentID = @ExpAssessmentID
          `);
      } else {
        await pool
          .request()
          .input("ReviewID", sql.Int, reviewId)
          .input("ReviewerID", sql.Int, reviewer.ReviewerID)
          .input("TotalITYears", sql.Decimal(5, 2), normalizedTotalITYears)
          .input("HoursLast12Months", sql.Int, normalizedHoursLast12Months)
          .input("CurrentSFIALevel", sql.TinyInt, normalizedCurrentSFIALevel)
          .input("Last2YearsSFIALevel", sql.TinyInt, normalizedLast2YearsSFIALevel)
          .input("MeetsRequirement", sql.Bit, meetsRequirement ? 1 : 0)
          .input("RecommendedDesig", sql.NVarChar(20), normalizedRecommendedDesig)
          .input("Comments", sql.NVarChar(sql.MAX), normalizedComments)
          .query(`
            INSERT INTO Reviewer.ExperienceAssessment
            (
              ReviewID,
              ReviewerID,
              TotalITYears,
              HoursLast12Months,
              CurrentSFIALevel,
              Last2YearsSFIALevel,
              MeetsRequirement,
              RecommendedDesig,
              Comments,
              AssessmentDate
            )
            VALUES
            (
              @ReviewID,
              @ReviewerID,
              @TotalITYears,
              @HoursLast12Months,
              @CurrentSFIALevel,
              @Last2YearsSFIALevel,
              @MeetsRequirement,
              @RecommendedDesig,
              @Comments,
              SYSDATETIME()
            )
          `);
      }

      return res.json({ message: "Experience assessment saved successfully" });
    } catch (err) {
      console.error("Save experience assessment error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Education reviewer assessment: load ----------
app.get(
  "/api/reviewer/education-assessment/:applicationId",
  requireRole(["EducationReviewer"]),
  async (req, res) => {
    try {
      const applicationId = Number(req.params.applicationId);
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const user = req.session.user;
      await ensureDemoReviewerRows();

      const reviewer = await getReviewerIdByEmail(user.email);
      if (!reviewer) {
        return res.status(404).json({ message: "Reviewer not found" });
      }

      const pool = await getPool();

      const reviewCheck = await pool
        .request()
        .input("ApplicantID", sql.Int, applicationId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1
            ar.ReviewID
          FROM Office.ApplicationReview ar
          WHERE ar.ApplicantID = @ApplicantID
            AND ar.EducationReviewerID = @ReviewerID
        `);

      if (reviewCheck.recordset.length === 0) {
        return res.status(403).json({ message: "This application is not assigned to you" });
      }

      const reviewId = reviewCheck.recordset[0].ReviewID;

      const educationRow = await pool
        .request()
        .input("ApplicantID", sql.Int, applicationId)
        .query(`
          SELECT TOP 1 EducationID
          FROM Applicant.Education
          WHERE ApplicantID = @ApplicantID
          ORDER BY EducationID ASC
        `);

      const educationId =
        educationRow.recordset.length > 0 ? educationRow.recordset[0].EducationID : null;

      const assessment = await pool
        .request()
        .input("ReviewID", sql.Int, reviewId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1
            EduAssessmentID,
            ReviewID,
            ReviewerID,
            EducationID,
            TranscriptVerified,
            ITCollegeCoursesCompleted,
            ITUniversityCoursesCompleted,
            YearsOfITEducation,
            CategoryRecommended,
            MeetsRequirement,
            Comments,
            AssessmentDate
          FROM Reviewer.EducationAssessment
          WHERE ReviewID = @ReviewID
            AND ReviewerID = @ReviewerID
          ORDER BY EduAssessmentID DESC
        `);

      return res.json({
        reviewId,
        reviewerId: reviewer.ReviewerID,
        educationId,
        assessment: assessment.recordset.length > 0 ? assessment.recordset[0] : null,
      });
    } catch (err) {
      console.error("Load education assessment error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Education reviewer assessment: save ----------
app.post(
  "/api/reviewer/education-assessment/:applicationId",
  requireRole(["EducationReviewer"]),
  async (req, res) => {
    try {
      const applicationId = Number(req.params.applicationId);
      if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({ message: "Invalid application id" });
      }

      const {
        transcriptVerified,
        itCollegeCoursesCompleted,
        itUniversityCoursesCompleted,
        yearsOfITEducation,
        categoryRecommended,
        meetsRequirement,
        comments,
      } = req.body;

      if (typeof transcriptVerified !== "boolean") {
        return res.status(400).json({ message: "transcriptVerified must be true or false" });
      }

      if (typeof meetsRequirement !== "boolean") {
        return res.status(400).json({ message: "meetsRequirement must be true or false" });
      }

      const user = req.session.user;
      await ensureDemoReviewerRows();

      const reviewer = await getReviewerIdByEmail(user.email);
      if (!reviewer) {
        return res.status(404).json({ message: "Reviewer not found" });
      }

      const pool = await getPool();

      const reviewCheck = await pool
        .request()
        .input("ApplicantID", sql.Int, applicationId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1
            ar.ReviewID
          FROM Office.ApplicationReview ar
          WHERE ar.ApplicantID = @ApplicantID
            AND ar.EducationReviewerID = @ReviewerID
        `);

      if (reviewCheck.recordset.length === 0) {
        return res.status(403).json({ message: "This application is not assigned to you" });
      }

      const reviewId = reviewCheck.recordset[0].ReviewID;

      const educationRow = await pool
        .request()
        .input("ApplicantID", sql.Int, applicationId)
        .query(`
          SELECT TOP 1 EducationID
          FROM Applicant.Education
          WHERE ApplicantID = @ApplicantID
          ORDER BY EducationID ASC
        `);

      if (educationRow.recordset.length === 0) {
        return res.status(404).json({ message: "Education record not found" });
      }

      const educationId = educationRow.recordset[0].EducationID;

      const existing = await pool
        .request()
        .input("ReviewID", sql.Int, reviewId)
        .input("ReviewerID", sql.Int, reviewer.ReviewerID)
        .query(`
          SELECT TOP 1 EduAssessmentID
          FROM Reviewer.EducationAssessment
          WHERE ReviewID = @ReviewID
            AND ReviewerID = @ReviewerID
        `);

      const normalizedCollegeCourses =
        itCollegeCoursesCompleted === "" ||
        itCollegeCoursesCompleted === null ||
        itCollegeCoursesCompleted === undefined
          ? null
          : Number(itCollegeCoursesCompleted);

      const normalizedUniversityCourses =
        itUniversityCoursesCompleted === "" ||
        itUniversityCoursesCompleted === null ||
        itUniversityCoursesCompleted === undefined
          ? null
          : Number(itUniversityCoursesCompleted);

      const normalizedYearsOfITEducation =
        yearsOfITEducation === "" ||
        yearsOfITEducation === null ||
        yearsOfITEducation === undefined
          ? null
          : Number(yearsOfITEducation);

      const normalizedCategoryRecommended =
        String(categoryRecommended || "").trim() || null;

      const normalizedComments = String(comments || "").trim() || null;

      if (existing.recordset.length > 0) {
        await pool
          .request()
          .input("EduAssessmentID", sql.Int, existing.recordset[0].EduAssessmentID)
          .input("EducationID", sql.Int, educationId)
          .input("TranscriptVerified", sql.Bit, transcriptVerified ? 1 : 0)
          .input("ITCollegeCoursesCompleted", sql.Int, normalizedCollegeCourses)
          .input("ITUniversityCoursesCompleted", sql.Int, normalizedUniversityCourses)
          .input("YearsOfITEducation", sql.Decimal(5, 2), normalizedYearsOfITEducation)
          .input("CategoryRecommended", sql.NVarChar(100), normalizedCategoryRecommended)
          .input("MeetsRequirement", sql.Bit, meetsRequirement ? 1 : 0)
          .input("Comments", sql.NVarChar(sql.MAX), normalizedComments)
          .query(`
            UPDATE Reviewer.EducationAssessment
            SET
              EducationID = @EducationID,
              TranscriptVerified = @TranscriptVerified,
              ITCollegeCoursesCompleted = @ITCollegeCoursesCompleted,
              ITUniversityCoursesCompleted = @ITUniversityCoursesCompleted,
              YearsOfITEducation = @YearsOfITEducation,
              CategoryRecommended = @CategoryRecommended,
              MeetsRequirement = @MeetsRequirement,
              Comments = @Comments,
              AssessmentDate = SYSDATETIME()
            WHERE EduAssessmentID = @EduAssessmentID
          `);
      } else {
        await pool
          .request()
          .input("ReviewID", sql.Int, reviewId)
          .input("ReviewerID", sql.Int, reviewer.ReviewerID)
          .input("EducationID", sql.Int, educationId)
          .input("TranscriptVerified", sql.Bit, transcriptVerified ? 1 : 0)
          .input("ITCollegeCoursesCompleted", sql.Int, normalizedCollegeCourses)
          .input("ITUniversityCoursesCompleted", sql.Int, normalizedUniversityCourses)
          .input("YearsOfITEducation", sql.Decimal(5, 2), normalizedYearsOfITEducation)
          .input("CategoryRecommended", sql.NVarChar(100), normalizedCategoryRecommended)
          .input("MeetsRequirement", sql.Bit, meetsRequirement ? 1 : 0)
          .input("Comments", sql.NVarChar(sql.MAX), normalizedComments)
          .query(`
            INSERT INTO Reviewer.EducationAssessment
            (
              ReviewID,
              ReviewerID,
              EducationID,
              TranscriptVerified,
              ITCollegeCoursesCompleted,
              ITUniversityCoursesCompleted,
              YearsOfITEducation,
              CategoryRecommended,
              MeetsRequirement,
              Comments,
              AssessmentDate
            )
            VALUES
            (
              @ReviewID,
              @ReviewerID,
              @EducationID,
              @TranscriptVerified,
              @ITCollegeCoursesCompleted,
              @ITUniversityCoursesCompleted,
              @YearsOfITEducation,
              @CategoryRecommended,
              @MeetsRequirement,
              @Comments,
              SYSDATETIME()
            )
          `);
      }

      return res.json({ message: "Education assessment saved successfully" });
    } catch (err) {
      console.error("Save education assessment error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Optional setup routes ----------
app.post("/api/setup/office-me", requireRole(["Office"]), async (req, res) => {
  try {
    const user = req.session.user;
    const staffId = await ensureOfficeStaffRow(user.email);
    return res.json({ message: "Office staff ready", staffId });
  } catch (err) {
    console.error("Office setup error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.post(
  "/api/setup/reviewer-me",
  requireRole(["EducationReviewer", "ExperienceReviewer"]),
  async (req, res) => {
    try {
      const user = req.session.user;
      const reviewerType =
        user.roles[0] === "EducationReviewer" ? "Education" : "Experience";

      const reviewerId = await ensureReviewerRow(user.email, reviewerType);
      return res.json({ message: "Reviewer ready", reviewerId });
    } catch (err) {
      console.error("Reviewer setup error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

(async () => {
  try {
    await getPool();
    await ensureDemoReviewerRows();
    console.log("Connected to SQL Server database");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
})();

app.get(
  "/api/documents/:documentId/view",
  requireRole(["Office", "EducationReviewer", "ExperienceReviewer"]),
  async (req, res) => {
    try {
      const documentId = Number(req.params.documentId);

      if (!Number.isInteger(documentId) || documentId <= 0) {
        return res.status(400).json({ message: "Invalid document id" });
      }

      const pool = await getPool();

      const result = await pool
        .request()
        .input("DocumentID", sql.Int, documentId)
        .query(`
          SELECT TOP 1
            DocumentID,
            DocumentType,
            FileName,
            FilePath,
            MimeType
          FROM Applicant.Document
          WHERE DocumentID = @DocumentID
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const doc = result.recordset[0];

      if (!doc.FilePath || !fs.existsSync(doc.FilePath)) {
        return res.status(404).json({ message: "Stored file not found on server" });
      }

      if (doc.MimeType) {
        res.setHeader("Content-Type", doc.MimeType);
      }

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(doc.FileName || "document")}"`
      );

      return res.sendFile(path.resolve(doc.FilePath));
    } catch (err) {
      console.error("View document error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

// ---------- Applicant: get my application status ----------
app.get(
  "/api/applicant/my-status",
  requireRole(["Applicant"]),
  async (req, res) => {
    try {
      const user = req.session.user;
      const pool = await getPool();

      const result = await pool
        .request()
        .input("Email", sql.NVarChar(255), user.email)
        .query(`
          SELECT TOP 1
            ApplicantID AS Id,
            FirstName,
            LastName,
            CertificateName,
            ApplicationStatus AS Status,
            SubmittedDate,
            CreatedAt,
            UpdatedAt
          FROM Applicant.Applicant
          WHERE Email = @Email
          ORDER BY ApplicantID DESC
        `);

      if (result.recordset.length === 0) {
        return res.json({
          hasApplication: false,
          application: null,
        });
      }

      return res.json({
        hasApplication: true,
        application: result.recordset[0],
      });
    } catch (err) {
      console.error("Load applicant status error:", err);
      return res.status(500).json({ message: "Database error" });
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});