IF DB_ID('CIPS_CertPortal') IS NULL
BEGIN
    CREATE DATABASE CIPS_CertPortal;
END
GO

USE CIPS_CertPortal;
GO

-- ============================================================
-- CIPS CERTIFICATION PORTAL DATABASE
-- ============================================================

-- ============================================================
-- SECTION 1: CREATE SCHEMAS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Applicant')
    EXEC('CREATE SCHEMA Applicant');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Office')
    EXEC('CREATE SCHEMA Office');
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Reviewer')
    EXEC('CREATE SCHEMA Reviewer');
GO

-- ============================================================
-- SECTION 2: APPLICANT SCHEMA
-- ============================================================

IF OBJECT_ID('Applicant.Document', 'U') IS NOT NULL DROP TABLE Applicant.Document;
IF OBJECT_ID('Applicant.ApplicantReference', 'U') IS NOT NULL DROP TABLE Applicant.ApplicantReference;
IF OBJECT_ID('Applicant.Experience', 'U') IS NOT NULL DROP TABLE Applicant.Experience;
IF OBJECT_ID('Applicant.Education', 'U') IS NOT NULL DROP TABLE Applicant.Education;
IF OBJECT_ID('Applicant.Applicant', 'U') IS NOT NULL DROP TABLE Applicant.Applicant;
GO

CREATE TABLE Applicant.Applicant (
    ApplicantID          INT IDENTITY(1,1) NOT NULL,
    FirstName            NVARCHAR(100) NOT NULL,
    LastName             NVARCHAR(100) NOT NULL,
    CertificateName      NVARCHAR(200) NOT NULL,
    Email                NVARCHAR(255) NOT NULL,
    MembershipNumber     NVARCHAR(50) NULL,
    MembershipJoinDate   DATE NULL,
    ApplicationStatus    NVARCHAR(20) NOT NULL
                         CONSTRAINT DF_App_Status DEFAULT 'Draft',
    DeclarationSigned    BIT NOT NULL
                         CONSTRAINT DF_App_Declaration DEFAULT 0,
    DeclarationDate      DATE NULL,
    SubmittedDate        DATE NULL,
    CreatedAt            DATETIME2 NOT NULL
                         CONSTRAINT DF_App_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt            DATETIME2 NOT NULL
                         CONSTRAINT DF_App_UpdatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Applicant PRIMARY KEY (ApplicantID),
    CONSTRAINT CK_Applicant_Status CHECK (
        ApplicationStatus IN ('Draft','Submitted','UnderReview','Approved','Rejected')
    ),
    CONSTRAINT CK_Applicant_Membership CHECK (
        MembershipNumber IS NOT NULL OR MembershipJoinDate IS NOT NULL
        OR ApplicationStatus = 'Draft'
    )
);
GO

CREATE TABLE Applicant.Education (
    EducationID               INT IDENTITY(1,1) NOT NULL,
    ApplicantID               INT NOT NULL,
    InstitutionName           NVARCHAR(255) NOT NULL,
    LastNameOnTranscript      NVARCHAR(100) NOT NULL,
    FirstNameOnTranscript     NVARCHAR(100) NOT NULL,
    ProgramName               NVARCHAR(255) NOT NULL,
    City                      NVARCHAR(100) NOT NULL,
    AttendedFrom              DATE NOT NULL,
    AttendedTo                DATE NOT NULL,
    Graduated                 BIT NOT NULL
                              CONSTRAINT DF_Edu_Graduated DEFAULT 0,
    TranscriptSentDate        DATE NULL,
    EquivalencyService        NVARCHAR(255) NULL,
    EquivalencyAssessmentDate DATE NULL,
    EquivalencyRefNumber      NVARCHAR(100) NULL,
    ExamRoute                 NVARCHAR(20) NULL,
    ExamPassed                BIT NULL,
    ExamCompletionDate        DATE NULL,
    ExamTranscriptSentDate    DATE NULL,
    CreatedAt                 DATETIME2 NOT NULL
                              CONSTRAINT DF_Edu_CreatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Education PRIMARY KEY (EducationID),
    CONSTRAINT FK_Education_Applicant FOREIGN KEY (ApplicantID)
        REFERENCES Applicant.Applicant(ApplicantID)
        ON DELETE CASCADE,
    CONSTRAINT CK_Education_ExamRoute CHECK (
        ExamRoute IN ('None','BCS_Diploma','BCS_ProfGrad','ICCP') OR ExamRoute IS NULL
    ),
    CONSTRAINT CK_Education_Dates CHECK (
        AttendedTo >= AttendedFrom
    )
);
GO

CREATE TABLE Applicant.Experience (
    ExperienceID      INT IDENTITY(1,1) NOT NULL,
    ApplicantID       INT NOT NULL,
    Organization      NVARCHAR(255) NOT NULL,
    PositionTitle     NVARCHAR(255) NOT NULL,
    StartDate         DATE NOT NULL,
    EndDate           DATE NULL,
    EmploymentType    NVARCHAR(10) NOT NULL,
    HoursPerWeek      DECIMAL(5,2) NULL,
    SFIALevel         TINYINT NULL,
    Autonomy          NVARCHAR(MAX) NULL,
    Influence         NVARCHAR(MAX) NULL,
    Complexity        NVARCHAR(MAX) NULL,
    BusinessSkills    NVARCHAR(MAX) NULL,
    Knowledge         NVARCHAR(MAX) NULL,
    CreatedAt         DATETIME2 NOT NULL
                      CONSTRAINT DF_Exp_CreatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Experience PRIMARY KEY (ExperienceID),
    CONSTRAINT FK_Experience_Applicant FOREIGN KEY (ApplicantID)
        REFERENCES Applicant.Applicant(ApplicantID)
        ON DELETE CASCADE,
    CONSTRAINT CK_Experience_Employment CHECK (
        EmploymentType IN ('FullTime','PartTime')
    ),
    CONSTRAINT CK_Experience_SFIALevel CHECK (
        SFIALevel BETWEEN 1 AND 7 OR SFIALevel IS NULL
    ),
    CONSTRAINT CK_Experience_Dates CHECK (
        EndDate IS NULL OR EndDate >= StartDate
    ),
    CONSTRAINT CK_Experience_Hours CHECK (
        HoursPerWeek IS NULL OR HoursPerWeek >= 0
    )
);
GO

CREATE TABLE Applicant.ApplicantReference (
    ReferenceID       INT IDENTITY(1,1) NOT NULL,
    ApplicantID       INT NOT NULL,
    ReferenceType     NVARCHAR(20) NOT NULL,
    RefereeName       NVARCHAR(200) NOT NULL,
    RefereeTitle      NVARCHAR(200) NULL,
    RefereeOrg        NVARCHAR(255) NULL,
    RefereeEmail      NVARCHAR(255) NULL,
    LetterReceived    BIT NOT NULL
                      CONSTRAINT DF_Ref_Received DEFAULT 0,
    ReceivedDate      DATE NULL,
    CreatedAt         DATETIME2 NOT NULL
                      CONSTRAINT DF_Ref_CreatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ApplicantReference PRIMARY KEY (ReferenceID),
    CONSTRAINT FK_ApplicantReference_Applicant FOREIGN KEY (ApplicantID)
        REFERENCES Applicant.Applicant(ApplicantID)
        ON DELETE CASCADE,
    CONSTRAINT CK_ApplicantReference_Type CHECK (
        ReferenceType IN ('ISP_ITCP','AITP_Sponsor')
    )
);
GO

CREATE TABLE Applicant.Document (
    DocumentID        INT IDENTITY(1,1) NOT NULL,
    ApplicantID       INT NOT NULL,
    DocumentType      NVARCHAR(50) NOT NULL,
    FileName          NVARCHAR(255) NOT NULL,
    FilePath          NVARCHAR(500) NOT NULL,
    MimeType          NVARCHAR(100) NULL,
    FileSizeBytes     BIGINT NULL,
    UploadedAt        DATETIME2 NOT NULL
                      CONSTRAINT DF_Doc_UploadedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Document PRIMARY KEY (DocumentID),
    CONSTRAINT FK_Document_Applicant FOREIGN KEY (ApplicantID)
        REFERENCES Applicant.Applicant(ApplicantID)
        ON DELETE CASCADE,
    CONSTRAINT CK_Document_Type CHECK (
        DocumentType IN (
            'Resume',
            'Transcript',
            'SFIAAssessment',
            'ReferenceLetter',
            'SponsorLetter',
            'EquivalencyAssessment',
            'MembershipCard',
            'PaymentReceipt'
        )
    ),
    CONSTRAINT CK_Document_FileSize CHECK (
        FileSizeBytes IS NULL OR FileSizeBytes >= 0
    )
);
GO

-- ============================================================
-- SECTION 3: OFFICE SCHEMA
-- ============================================================

IF OBJECT_ID('Office.ApplicationReview', 'U') IS NOT NULL DROP TABLE Office.ApplicationReview;
IF OBJECT_ID('Office.Staff', 'U') IS NOT NULL DROP TABLE Office.Staff;
GO

CREATE TABLE Office.Staff (
    StaffID           INT IDENTITY(1,1) NOT NULL,
    FirstName         NVARCHAR(100) NOT NULL,
    LastName          NVARCHAR(100) NOT NULL,
    Email             NVARCHAR(255) NOT NULL,
    Role              NVARCHAR(50) NOT NULL
                      CONSTRAINT DF_Staff_Role DEFAULT 'OfficeStaff',
    IsActive          BIT NOT NULL
                      CONSTRAINT DF_Staff_Active DEFAULT 1,
    CreatedAt         DATETIME2 NOT NULL
                      CONSTRAINT DF_Staff_CreatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Staff PRIMARY KEY (StaffID),
    CONSTRAINT UQ_Staff_Email UNIQUE (Email),
    CONSTRAINT CK_Staff_Role CHECK (
        Role IN ('OfficeManager','OfficeStaff')
    )
);
GO

-- ============================================================
-- SECTION 4: REVIEWER SCHEMA
-- ============================================================

IF OBJECT_ID('Reviewer.ExperienceAssessment', 'U') IS NOT NULL DROP TABLE Reviewer.ExperienceAssessment;
IF OBJECT_ID('Reviewer.EducationAssessment', 'U') IS NOT NULL DROP TABLE Reviewer.EducationAssessment;
IF OBJECT_ID('Reviewer.Reviewer', 'U') IS NOT NULL DROP TABLE Reviewer.Reviewer;
GO

CREATE TABLE Reviewer.Reviewer (
    ReviewerID        INT IDENTITY(1,1) NOT NULL,
    FirstName         NVARCHAR(100) NOT NULL,
    LastName          NVARCHAR(100) NOT NULL,
    Email             NVARCHAR(255) NOT NULL,
    ReviewerType      NVARCHAR(20) NOT NULL,
    IsActive          BIT NOT NULL
                      CONSTRAINT DF_Rvwr_Active DEFAULT 1,
    CreatedAt         DATETIME2 NOT NULL
                      CONSTRAINT DF_Rvwr_CreatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Reviewer PRIMARY KEY (ReviewerID),
    CONSTRAINT UQ_Reviewer_Email UNIQUE (Email),
    CONSTRAINT CK_Reviewer_Type CHECK (
        ReviewerType IN ('Education','Experience','Both')
    )
);
GO

-- ============================================================
-- SECTION 5: OFFICE APPLICATION REVIEW
-- ============================================================

CREATE TABLE Office.ApplicationReview (
    ReviewID               INT IDENTITY(1,1) NOT NULL,
    ApplicantID            INT NOT NULL,
    AssignedByStaffID      INT NOT NULL,
    EducationReviewerID    INT NULL,
    ExperienceReviewerID   INT NULL,
    AssignedDate           DATETIME2 NOT NULL
                           CONSTRAINT DF_Rev_Assigned DEFAULT SYSDATETIME(),
    Decision               NVARCHAR(20) NULL,
    DesignationAwarded     NVARCHAR(50) NULL,
    DecisionDate           DATE NULL,
    TranscriptReceived     BIT NOT NULL
                           CONSTRAINT DF_Rev_Transcript DEFAULT 0,
    TranscriptReceivedDate DATE NULL,
    Notes                  NVARCHAR(MAX) NULL,
    UpdatedAt              DATETIME2 NOT NULL
                           CONSTRAINT DF_Rev_UpdatedAt DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ApplicationReview PRIMARY KEY (ReviewID),
    CONSTRAINT FK_AppReview_Applicant FOREIGN KEY (ApplicantID)
        REFERENCES Applicant.Applicant(ApplicantID),
    CONSTRAINT FK_AppReview_Staff FOREIGN KEY (AssignedByStaffID)
        REFERENCES Office.Staff(StaffID),
    CONSTRAINT FK_AppReview_EduReviewer FOREIGN KEY (EducationReviewerID)
        REFERENCES Reviewer.Reviewer(ReviewerID),
    CONSTRAINT FK_AppReview_ExpReviewer FOREIGN KEY (ExperienceReviewerID)
        REFERENCES Reviewer.Reviewer(ReviewerID),
    CONSTRAINT CK_AppReview_Decision CHECK (
        Decision IN ('Approved','Rejected','Pending') OR Decision IS NULL
    ),
    CONSTRAINT CK_AppReview_Designation CHECK (
        DesignationAwarded IN ('AITP','ISP','ITCP','ISP,ITCP') OR DesignationAwarded IS NULL
    )
);
GO

-- ============================================================
-- SECTION 6: REVIEWER ASSESSMENTS
-- ============================================================

CREATE TABLE Reviewer.EducationAssessment (
    EduAssessmentID    INT IDENTITY(1,1) NOT NULL,
    ReviewID           INT NOT NULL,
    ReviewerID         INT NOT NULL,
    EducationID        INT NOT NULL,
    EducationRoute     NVARCHAR(150) NULL,
    YearsRequired_ISP  TINYINT NULL,
    YearsRequired_ITCP TINYINT NULL,
    MeetsRequirement   BIT NOT NULL
                       CONSTRAINT DF_EduA_Meets DEFAULT 0,
    Comments           NVARCHAR(MAX) NULL,
    AssessmentDate     DATETIME2 NOT NULL
                       CONSTRAINT DF_EduA_Date DEFAULT SYSDATETIME(),

    CONSTRAINT PK_EducationAssessment PRIMARY KEY (EduAssessmentID),
    CONSTRAINT FK_EduAssessment_Review FOREIGN KEY (ReviewID)
        REFERENCES Office.ApplicationReview(ReviewID),
    CONSTRAINT FK_EduAssessment_Reviewer FOREIGN KEY (ReviewerID)
        REFERENCES Reviewer.Reviewer(ReviewerID),
    CONSTRAINT FK_EduAssessment_Education FOREIGN KEY (EducationID)
        REFERENCES Applicant.Education(EducationID)
);
GO

CREATE TABLE Reviewer.ExperienceAssessment (
    ExpAssessmentID       INT IDENTITY(1,1) NOT NULL,
    ReviewID              INT NOT NULL,
    ReviewerID            INT NOT NULL,
    TotalITYears          DECIMAL(5,2) NULL,
    HoursLast12Months     INT NULL,
    CurrentSFIALevel      TINYINT NULL,
    Last2YearsSFIALevel   TINYINT NULL,
    MeetsRequirement      BIT NOT NULL
                          CONSTRAINT DF_ExpA_Meets DEFAULT 0,
    RecommendedDesig      NVARCHAR(20) NULL,
    Comments              NVARCHAR(MAX) NULL,
    AssessmentDate        DATETIME2 NOT NULL
                          CONSTRAINT DF_ExpA_Date DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ExperienceAssessment PRIMARY KEY (ExpAssessmentID),
    CONSTRAINT FK_ExpAssessment_Review FOREIGN KEY (ReviewID)
        REFERENCES Office.ApplicationReview(ReviewID),
    CONSTRAINT FK_ExpAssessment_Reviewer FOREIGN KEY (ReviewerID)
        REFERENCES Reviewer.Reviewer(ReviewerID),
    CONSTRAINT CK_ExpAssessment_CurrentSFI CHECK (
        CurrentSFIALevel BETWEEN 1 AND 7 OR CurrentSFIALevel IS NULL
    ),
    CONSTRAINT CK_ExpAssessment_Last2YearsSFI CHECK (
        Last2YearsSFIALevel BETWEEN 1 AND 7 OR Last2YearsSFIALevel IS NULL
    ),
    CONSTRAINT CK_ExpAssessment_Hours CHECK (
        HoursLast12Months IS NULL OR HoursLast12Months >= 0
    ),
    CONSTRAINT CK_ExpAssessment_RecommendedDesig CHECK (
        RecommendedDesig IN ('AITP','ISP','ITCP','None') OR RecommendedDesig IS NULL
    )
);
GO

-- ============================================================
-- SECTION 7: EDUCATION REVIEWER ASSESSMENT EXTENSIONS
-- ============================================================

IF COL_LENGTH('Reviewer.EducationAssessment', 'TranscriptVerified') IS NULL
BEGIN
    ALTER TABLE Reviewer.EducationAssessment
    ADD TranscriptVerified BIT NOT NULL
        CONSTRAINT DF_EduAssessment_TranscriptVerified DEFAULT 0;
END
GO

IF COL_LENGTH('Reviewer.EducationAssessment', 'ITCollegeCoursesCompleted') IS NULL
BEGIN
    ALTER TABLE Reviewer.EducationAssessment
    ADD ITCollegeCoursesCompleted INT NULL;
END
GO

IF COL_LENGTH('Reviewer.EducationAssessment', 'ITUniversityCoursesCompleted') IS NULL
BEGIN
    ALTER TABLE Reviewer.EducationAssessment
    ADD ITUniversityCoursesCompleted INT NULL;
END
GO

IF COL_LENGTH('Reviewer.EducationAssessment', 'YearsOfITEducation') IS NULL
BEGIN
    ALTER TABLE Reviewer.EducationAssessment
    ADD YearsOfITEducation DECIMAL(5,2) NULL;
END
GO

IF COL_LENGTH('Reviewer.EducationAssessment', 'CategoryRecommended') IS NULL
BEGIN
    ALTER TABLE Reviewer.EducationAssessment
    ADD CategoryRecommended NVARCHAR(100) NULL;
END
GO