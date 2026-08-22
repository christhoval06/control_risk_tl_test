IF OBJECT_ID('dbo.Tasks', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Tasks;
END;
GO

CREATE TABLE dbo.Tasks
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tasks PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NULL,
    DueDate DATETIME2 NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedBy NVARCHAR(200) NOT NULL,
    AssignedTo NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tasks_UpdatedAt DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION NOT NULL,
    CONSTRAINT CK_Tasks_Title_NotBlank CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
    CONSTRAINT CK_Tasks_CreatedBy_NotBlank CHECK (LEN(LTRIM(RTRIM(CreatedBy))) > 0),
    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('Pending', 'In Progress', 'Done'))
);
GO

CREATE INDEX IX_Tasks_CreatedBy_Status_DueDate
ON dbo.Tasks (CreatedBy, Status, DueDate)
INCLUDE (Title, AssignedTo, UpdatedAt);
GO

CREATE INDEX IX_Tasks_AssignedTo_Status_DueDate
ON dbo.Tasks (AssignedTo, Status, DueDate)
INCLUDE (Title, CreatedBy, UpdatedAt)
WHERE AssignedTo IS NOT NULL;
GO

CREATE INDEX IX_Tasks_Status_DueDate
ON dbo.Tasks (Status, DueDate)
INCLUDE (Title, CreatedBy, AssignedTo);
GO

CREATE INDEX IX_Tasks_CreatedAt
ON dbo.Tasks (CreatedAt DESC);
GO
