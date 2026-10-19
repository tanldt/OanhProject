/*
  CIPS Certification Application Process 2025
  Microsoft SQL Server schema + starter workflow objects.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF DB_ID(N'CIPS_Certification') IS NULL
BEGIN
    CREATE DATABASE CIPS_Certification;
END
GO

USE CIPS_Certification;
GO

/* =============================
   Security / identity tables
   ============================= */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId               INT IDENTITY(1,1) PRIMARY KEY,
        Email                NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash         NVARCHAR(512) NOT NULL,
        FirstName            NVARCHAR(100) NOT NULL,
        LastName             NVARCHAR(100) NOT NULL,
        IsActive             BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT(1),
        CreatedAt            DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT(SYSUTCDATETIME()),
        UpdatedAt            DATETIME2(0) NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT(SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        RoleId               INT IDENTITY(1,1) PRIMARY KEY,
        RoleCode             NVARCHAR(50) NOT NULL UNIQUE,
        RoleName             NVARCHAR(100) NOT NULL
    );

    INSERT INTO dbo.Roles (RoleCode, RoleName)
    VALUES
        (N'APPLICANT', N'Applicant'),
        (N'CIPS_OFFICE', N'CIPS Office'),
        (N'EDU_REVIEWER', N'Education Reviewer'),
        (N'EXP_REVIEWER', N'Experience Reviewer');
END
GO

IF OBJECT_ID(N'dbo.UserRoles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRoles
    (
        UserId               INT NOT NULL,
        RoleId               INT NOT NULL,
        AssignedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_UserRoles_AssignedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),
        CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES dbo.Roles(RoleId)
    );
END
GO

/* =============================
   Applicant and application intake
   ============================= */
IF OBJECT_ID(N'dbo.MembershipTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MembershipTypes
    (
        MembershipTypeId     INT IDENTITY(1,1) PRIMARY KEY,
        Code                 NVARCHAR(50) NOT NULL UNIQUE,
        Name                 NVARCHAR(100) NOT NULL
    );

    INSERT INTO dbo.MembershipTypes (Code, Name)
    VALUES
        (N'ASSOCIATE', N'Associate Membership'),
        (N'PROFESSIONAL', N'Professional Membership'),
        (N'STUDENT', N'Student Membership');
END
GO

IF OBJECT_ID(N'dbo.Applicants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Applicants
    (
        ApplicantId           INT IDENTITY(1,1) PRIMARY KEY,
        UserId                INT NOT NULL UNIQUE,
        MembershipTypeId      INT NULL,
        MembershipNumber      NVARCHAR(50) NULL,
        ConsentAuthorized     BIT NOT NULL CONSTRAINT DF_Applicants_Consent DEFAULT(0),
        Phone                 NVARCHAR(30) NULL,
        AddressLine1          NVARCHAR(200) NULL,
        AddressLine2          NVARCHAR(200) NULL,
        City                  NVARCHAR(100) NULL,
        ProvinceState         NVARCHAR(100) NULL,
        PostalCode            NVARCHAR(20) NULL,
        Country               NVARCHAR(100) NULL,
        CreatedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_Applicants_CreatedAt DEFAULT(SYSUTCDATETIME()),
        UpdatedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_Applicants_UpdatedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_Applicants_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Applicants_MembershipType FOREIGN KEY (MembershipTypeId) REFERENCES dbo.MembershipTypes(MembershipTypeId)
    );
END
GO

IF OBJECT_ID(N'dbo.Applications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Applications
    (
        ApplicationId         INT IDENTITY(1,1) PRIMARY KEY,
        ApplicantId           INT NOT NULL,
        ApplicationYear       SMALLINT NOT NULL,
        ApplicationNumber     NVARCHAR(30) NOT NULL UNIQUE,
        CurrentStatus         NVARCHAR(40) NOT NULL,
        SubmittedAt           DATETIME2(0) NULL,
        PaymentReceivedAt     DATETIME2(0) NULL,
        OfficeScreenedAt      DATETIME2(0) NULL,
        FinalDecisionAt       DATETIME2(0) NULL,
        CreatedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_Applications_CreatedAt DEFAULT(SYSUTCDATETIME()),
        UpdatedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_Applications_UpdatedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_Applications_Status CHECK (CurrentStatus IN (
            N'DRAFT', N'SUBMITTED', N'UNDER_OFFICE_REVIEW', N'REVIEW_ASSIGNMENT',
            N'UNDER_REVIEW', N'PENDING_DECISION', N'APPROVED', N'NOT_APPROVED'
        )),
        CONSTRAINT FK_Applications_Applicant FOREIGN KEY (ApplicantId) REFERENCES dbo.Applicants(ApplicantId)
    );

    CREATE INDEX IX_Applications_ApplicantId ON dbo.Applications(ApplicantId);
    CREATE INDEX IX_Applications_Status ON dbo.Applications(CurrentStatus);
END
GO

/* =============================
   Supporting documents and detail sections
   ============================= */
IF OBJECT_ID(N'dbo.ApplicationDocuments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ApplicationDocuments
    (
        DocumentId            INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL,
        DocumentType          NVARCHAR(50) NOT NULL,
        FileName              NVARCHAR(260) NOT NULL,
        FileUri               NVARCHAR(1000) NOT NULL,
        UploadedByUserId      INT NOT NULL,
        UploadedAt            DATETIME2(0) NOT NULL CONSTRAINT DF_AppDocs_UploadedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_AppDocs_Type CHECK (DocumentType IN (
            N'REFERENCE_LETTER', N'TRANSCRIPT', N'EQUIVALENCY', N'RESUME_CV',
            N'SKILL_ASSESSMENT', N'OTHER'
        )),
        CONSTRAINT FK_AppDocs_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_AppDocs_User FOREIGN KEY (UploadedByUserId) REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_AppDocs_ApplicationId_Type ON dbo.ApplicationDocuments(ApplicationId, DocumentType);
END
GO

IF OBJECT_ID(N'dbo.ReferenceSponsors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ReferenceSponsors
    (
        SponsorId             INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL,
        FullName              NVARCHAR(200) NOT NULL,
        CompanyName           NVARCHAR(200) NULL,
        JobTitle              NVARCHAR(150) NULL,
        Email                 NVARCHAR(255) NULL,
        Phone                 NVARCHAR(30) NULL,
        LetterDocumentId      INT NULL,
        IsValidatedByOffice   BIT NOT NULL CONSTRAINT DF_Sponsors_Validated DEFAULT(0),
        ValidatedAt           DATETIME2(0) NULL,
        CONSTRAINT FK_Sponsors_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_Sponsors_LetterDoc FOREIGN KEY (LetterDocumentId) REFERENCES dbo.ApplicationDocuments(DocumentId)
    );

    CREATE INDEX IX_Sponsors_ApplicationId ON dbo.ReferenceSponsors(ApplicationId);
END
GO

IF OBJECT_ID(N'dbo.EducationProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EducationProfiles
    (
        EducationProfileId    INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL UNIQUE,
        SummaryText           NVARCHAR(MAX) NULL,
        InstitutionName       NVARCHAR(200) NULL,
        ProgramName           NVARCHAR(200) NULL,
        IsOfficeValidated     BIT NOT NULL CONSTRAINT DF_Edu_Validated DEFAULT(0),
        ValidationNotes       NVARCHAR(1000) NULL,
        ValidatedAt           DATETIME2(0) NULL,
        CONSTRAINT FK_EduProfile_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId)
    );
END
GO

IF OBJECT_ID(N'dbo.ExperienceProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExperienceProfiles
    (
        ExperienceProfileId   INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL UNIQUE,
        SummaryText           NVARCHAR(MAX) NULL,
        TotalYearsClaimed     DECIMAL(5,2) NULL,
        IsOfficeValidated     BIT NOT NULL CONSTRAINT DF_Exp_Validated DEFAULT(0),
        ValidationNotes       NVARCHAR(1000) NULL,
        ValidatedAt           DATETIME2(0) NULL,
        CONSTRAINT FK_ExpProfile_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId)
    );
END
GO

IF OBJECT_ID(N'dbo.ExperienceRoles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExperienceRoles
    (
        ExperienceRoleId      INT IDENTITY(1,1) PRIMARY KEY,
        ExperienceProfileId   INT NOT NULL,
        EmployerName          NVARCHAR(200) NULL,
        RoleTitle             NVARCHAR(200) NOT NULL,
        StartDate             DATE NOT NULL,
        EndDate               DATE NULL,
        IsCurrentRole         BIT NOT NULL CONSTRAINT DF_ExpRoles_Current DEFAULT(0),
        HoursPerWeek          DECIMAL(5,2) NULL,
        ItHoursComputed       DECIMAL(8,2) NULL,
        SfIaLevelClaimed      TINYINT NULL,
        ItRelatedRole         BIT NOT NULL CONSTRAINT DF_ExpRoles_ITRelated DEFAULT(1),
        CONSTRAINT CK_ExpRoles_Date CHECK (EndDate IS NULL OR EndDate >= StartDate),
        CONSTRAINT CK_ExpRoles_SFIA CHECK (SfIaLevelClaimed BETWEEN 1 AND 7 OR SfIaLevelClaimed IS NULL),
        CONSTRAINT FK_ExpRoles_Profile FOREIGN KEY (ExperienceProfileId) REFERENCES dbo.ExperienceProfiles(ExperienceProfileId)
    );

    CREATE INDEX IX_ExpRoles_Profile ON dbo.ExperienceRoles(ExperienceProfileId);
END
GO

/* =============================
   Office pre-check before assignment
   ============================= */
IF OBJECT_ID(N'dbo.OfficeChecks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OfficeChecks
    (
        OfficeCheckId         INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL,
        CheckedByUserId       INT NOT NULL,
        CheckType             NVARCHAR(40) NOT NULL,
        IsPassed              BIT NOT NULL,
        Notes                 NVARCHAR(1000) NULL,
        CheckedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_OfficeChecks_CheckedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_OfficeChecks_Type CHECK (CheckType IN (
            N'APPLICATION_COMPLETENESS',
            N'PAYMENT_RECEIVED',
            N'REFERENCES_VALID',
            N'EDUCATION_VALID',
            N'EXPERIENCE_VALID'
        )),
        CONSTRAINT FK_OfficeChecks_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_OfficeChecks_User FOREIGN KEY (CheckedByUserId) REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_OfficeChecks_ApplicationId_Type ON dbo.OfficeChecks(ApplicationId, CheckType);
END
GO

/* =============================
   Review assignment and outcomes
   ============================= */
IF OBJECT_ID(N'dbo.ReviewAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ReviewAssignments
    (
        ReviewAssignmentId    INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL,
        ReviewType            NVARCHAR(20) NOT NULL,
        ReviewerUserId        INT NOT NULL,
        AssignedByUserId      INT NOT NULL,
        AssignedAt            DATETIME2(0) NOT NULL CONSTRAINT DF_ReviewAssignments_AssignedAt DEFAULT(SYSUTCDATETIME()),
        DueAt                 DATETIME2(0) NULL,
        Status                NVARCHAR(20) NOT NULL CONSTRAINT DF_ReviewAssignments_Status DEFAULT(N'ASSIGNED'),
        CONSTRAINT CK_ReviewAssignments_Type CHECK (ReviewType IN (N'EDUCATION', N'EXPERIENCE')),
        CONSTRAINT CK_ReviewAssignments_Status CHECK (Status IN (N'ASSIGNED', N'IN_PROGRESS', N'COMPLETED', N'CANCELLED')),
        CONSTRAINT FK_ReviewAssignments_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_ReviewAssignments_Reviewer FOREIGN KEY (ReviewerUserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_ReviewAssignments_AssignedBy FOREIGN KEY (AssignedByUserId) REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_ReviewAssignments_ApplicationId ON dbo.ReviewAssignments(ApplicationId);
    CREATE INDEX IX_ReviewAssignments_Reviewer_Status ON dbo.ReviewAssignments(ReviewerUserId, Status);
END
GO

IF OBJECT_ID(N'dbo.EducationReviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EducationReviews
    (
        EducationReviewId     INT IDENTITY(1,1) PRIMARY KEY,
        ReviewAssignmentId    INT NOT NULL UNIQUE,
        SchoolProgramName     NVARCHAR(250) NULL,
        ItCollegeCourses      SMALLINT NULL,
        ItUniversityCourses   SMALLINT NULL,
        YearsOfItEducation    DECIMAL(4,2) NULL,
        RecommendedCategory   NVARCHAR(50) NULL,
        ReviewerComments      NVARCHAR(2000) NULL,
        ResultCode            NVARCHAR(20) NOT NULL,
        ReviewedAt            DATETIME2(0) NOT NULL CONSTRAINT DF_EducationReviews_ReviewedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_EduReviews_Result CHECK (ResultCode IN (N'RECOMMEND_PASS', N'RECOMMEND_FAIL', N'NEEDS_INFO')),
        CONSTRAINT FK_EduReviews_Assignment FOREIGN KEY (ReviewAssignmentId) REFERENCES dbo.ReviewAssignments(ReviewAssignmentId)
    );
END
GO

IF OBJECT_ID(N'dbo.ExperienceReviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExperienceReviews
    (
        ExperienceReviewId    INT IDENTITY(1,1) PRIMARY KEY,
        ReviewAssignmentId    INT NOT NULL UNIQUE,
        ApplicantSfIaLevel    TINYINT NULL,
        ConfirmedSfIaLevel    TINYINT NULL,
        TotalItHoursLast12M   DECIMAL(10,2) NULL,
        TotalYearsItExp       DECIMAL(5,2) NULL,
        IsItRelatedRolesOnly  BIT NOT NULL CONSTRAINT DF_ExpReviews_ITRelatedOnly DEFAULT(1),
        ReviewerComments      NVARCHAR(2000) NULL,
        ResultCode            NVARCHAR(20) NOT NULL,
        ReviewedAt            DATETIME2(0) NOT NULL CONSTRAINT DF_ExperienceReviews_ReviewedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_ExpReviews_Result CHECK (ResultCode IN (N'RECOMMEND_PASS', N'RECOMMEND_FAIL', N'NEEDS_INFO')),
        CONSTRAINT CK_ExpReviews_SFIA1 CHECK (ApplicantSfIaLevel BETWEEN 1 AND 7 OR ApplicantSfIaLevel IS NULL),
        CONSTRAINT CK_ExpReviews_SFIA2 CHECK (ConfirmedSfIaLevel BETWEEN 1 AND 7 OR ConfirmedSfIaLevel IS NULL),
        CONSTRAINT FK_ExpReviews_Assignment FOREIGN KEY (ReviewAssignmentId) REFERENCES dbo.ReviewAssignments(ReviewAssignmentId)
    );
END
GO

/* =============================
   Final decision, letters, certificates
   ============================= */
IF OBJECT_ID(N'dbo.ApplicationDecisions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ApplicationDecisions
    (
        DecisionId            INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL UNIQUE,
        FinalResult           NVARCHAR(20) NOT NULL,
        IsItpApproved         BIT NOT NULL CONSTRAINT DF_Decisions_ITP DEFAULT(0),
        IsIspApproved         BIT NOT NULL CONSTRAINT DF_Decisions_ISP DEFAULT(0),
        IsTcpApproved         BIT NOT NULL CONSTRAINT DF_Decisions_TCP DEFAULT(0),
        IsReviewedByOffice    BIT NOT NULL CONSTRAINT DF_Decisions_Reviewed DEFAULT(0),
        DecisionReason        NVARCHAR(2000) NULL,
        DecidedByUserId       INT NOT NULL,
        DecidedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_Decisions_DecidedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT CK_Decisions_Result CHECK (FinalResult IN (N'APPROVED', N'NOT_APPROVED', N'PENDING')),
        CONSTRAINT FK_Decisions_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_Decisions_User FOREIGN KEY (DecidedByUserId) REFERENCES dbo.Users(UserId)
    );
END
GO

IF OBJECT_ID(N'dbo.DecisionCommunications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DecisionCommunications
    (
        CommunicationId       INT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL,
        CommunicationType     NVARCHAR(30) NOT NULL,
        RecipientEmail        NVARCHAR(255) NOT NULL,
        SubjectLine           NVARCHAR(300) NOT NULL,
        BodyTemplateCode      NVARCHAR(100) NULL,
        SentAt                DATETIME2(0) NULL,
        SentByUserId          INT NULL,
        DeliveryStatus        NVARCHAR(20) NOT NULL CONSTRAINT DF_Comm_Status DEFAULT(N'PENDING'),
        Notes                 NVARCHAR(1000) NULL,
        CONSTRAINT CK_Comm_Type CHECK (CommunicationType IN (N'APPROVAL_EMAIL', N'NOT_APPROVED_EMAIL', N'CERTIFICATE_DELIVERY')),
        CONSTRAINT CK_Comm_Status CHECK (DeliveryStatus IN (N'PENDING', N'SENT', N'FAILED')),
        CONSTRAINT FK_Comm_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_Comm_User FOREIGN KEY (SentByUserId) REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_Comm_ApplicationId ON dbo.DecisionCommunications(ApplicationId);
END
GO

/* =============================
   Process event log
   ============================= */
IF OBJECT_ID(N'dbo.ApplicationEventLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ApplicationEventLog
    (
        EventLogId            BIGINT IDENTITY(1,1) PRIMARY KEY,
        ApplicationId         INT NOT NULL,
        EventCode             NVARCHAR(80) NOT NULL,
        EventDetail           NVARCHAR(2000) NULL,
        ActorUserId           INT NULL,
        CreatedAt             DATETIME2(0) NOT NULL CONSTRAINT DF_EventLog_CreatedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_EventLog_Application FOREIGN KEY (ApplicationId) REFERENCES dbo.Applications(ApplicationId),
        CONSTRAINT FK_EventLog_User FOREIGN KEY (ActorUserId) REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_EventLog_ApplicationId_CreatedAt ON dbo.ApplicationEventLog(ApplicationId, CreatedAt DESC);
END
GO

/* =============================
   Optional helper view for office dashboard
   ============================= */
IF OBJECT_ID(N'dbo.vw_ApplicationReviewSummary', N'V') IS NOT NULL
    DROP VIEW dbo.vw_ApplicationReviewSummary;
GO

CREATE VIEW dbo.vw_ApplicationReviewSummary
AS
SELECT
    a.ApplicationId,
    a.ApplicationNumber,
    a.ApplicationYear,
    a.CurrentStatus,
    ap.ApplicantId,
    u.FirstName,
    u.LastName,
    u.Email,
    d.FinalResult,
    d.DecidedAt,
    edu.CompletedEduReviews,
    exp.CompletedExpReviews
FROM dbo.Applications a
JOIN dbo.Applicants ap ON ap.ApplicantId = a.ApplicantId
JOIN dbo.Users u ON u.UserId = ap.UserId
LEFT JOIN dbo.ApplicationDecisions d ON d.ApplicationId = a.ApplicationId
OUTER APPLY (
    SELECT COUNT(1) AS CompletedEduReviews
    FROM dbo.ReviewAssignments ra
    WHERE ra.ApplicationId = a.ApplicationId
      AND ra.ReviewType = N'EDUCATION'
      AND ra.Status = N'COMPLETED'
) edu
OUTER APPLY (
    SELECT COUNT(1) AS CompletedExpReviews
    FROM dbo.ReviewAssignments ra
    WHERE ra.ApplicationId = a.ApplicationId
      AND ra.ReviewType = N'EXPERIENCE'
      AND ra.Status = N'COMPLETED'
) exp;
GO

/* =============================
   Example state transition proc
   ============================= */
IF OBJECT_ID(N'dbo.usp_SetApplicationStatus', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_SetApplicationStatus;
GO

CREATE PROCEDURE dbo.usp_SetApplicationStatus
    @ApplicationId INT,
    @NewStatus NVARCHAR(40),
    @ActorUserId INT = NULL,
    @Detail NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @NewStatus NOT IN (
        N'DRAFT', N'SUBMITTED', N'UNDER_OFFICE_REVIEW', N'REVIEW_ASSIGNMENT',
        N'UNDER_REVIEW', N'PENDING_DECISION', N'APPROVED', N'NOT_APPROVED'
    )
    BEGIN
        THROW 50001, 'Invalid status value.', 1;
    END;

    UPDATE dbo.Applications
    SET CurrentStatus = @NewStatus,
        UpdatedAt = SYSUTCDATETIME(),
        FinalDecisionAt = CASE WHEN @NewStatus IN (N'APPROVED', N'NOT_APPROVED')
                               THEN SYSUTCDATETIME()
                               ELSE FinalDecisionAt
                          END
    WHERE ApplicationId = @ApplicationId;

    INSERT INTO dbo.ApplicationEventLog (ApplicationId, EventCode, EventDetail, ActorUserId)
    VALUES (@ApplicationId, N'STATUS_CHANGED', COALESCE(@Detail, CONCAT(N'Status set to ', @NewStatus)), @ActorUserId);
END;
GO
