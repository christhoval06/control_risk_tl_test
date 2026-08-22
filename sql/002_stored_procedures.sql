CREATE OR ALTER PROCEDURE dbo.Task_Create
    @Id UNIQUEIDENTIFIER,
    @Title NVARCHAR(200),
    @Description NVARCHAR(2000) = NULL,
    @DueDate DATETIME2 = NULL,
    @Status NVARCHAR(20),
    @CreatedBy NVARCHAR(200),
    @AssignedTo NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Tasks
    (
        Id,
        Title,
        Description,
        DueDate,
        Status,
        CreatedBy,
        AssignedTo,
        CreatedAt,
        UpdatedAt
    )
    VALUES
    (
        @Id,
        LTRIM(RTRIM(@Title)),
        @Description,
        @DueDate,
        @Status,
        @CreatedBy,
        @AssignedTo,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE Id = @Id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Task_GetById
    @Id UNIQUEIDENTIFIER,
    @UserId NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE Id = @Id
      AND (CreatedBy = @UserId OR AssignedTo = @UserId);
END;
GO

CREATE OR ALTER PROCEDURE dbo.Task_List
    @UserId NVARCHAR(200),
    @Status NVARCHAR(20) = NULL,
    @AssignedTo NVARCHAR(200) = NULL,
    @Search NVARCHAR(200) = NULL,
    @SortBy NVARCHAR(30) = 'dueDate',
    @SortDirection NVARCHAR(4) = 'asc',
    @Page INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SafePage INT = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    DECLARE @SafePageSize INT = CASE
        WHEN @PageSize < 1 THEN 20
        WHEN @PageSize > 100 THEN 100
        ELSE @PageSize
    END;
    DECLARE @Offset INT = (@SafePage - 1) * @SafePageSize;

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE (CreatedBy = @UserId OR AssignedTo = @UserId)
      AND (@Status IS NULL OR Status = @Status)
      AND (@AssignedTo IS NULL OR AssignedTo = @AssignedTo)
      AND (
          @Search IS NULL
          OR Title LIKE '%' + @Search + '%'
          OR Description LIKE '%' + @Search + '%'
      )
    ORDER BY
      CASE WHEN @SortBy = 'dueDate' AND @SortDirection = 'asc' THEN DueDate END ASC,
      CASE WHEN @SortBy = 'dueDate' AND @SortDirection = 'desc' THEN DueDate END DESC,
      CASE WHEN @SortBy = 'status' AND @SortDirection = 'asc' THEN Status END ASC,
      CASE WHEN @SortBy = 'status' AND @SortDirection = 'desc' THEN Status END DESC,
      CASE WHEN @SortBy = 'createdAt' AND @SortDirection = 'asc' THEN CreatedAt END ASC,
      CASE WHEN @SortBy = 'createdAt' AND @SortDirection = 'desc' THEN CreatedAt END DESC,
      CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @SafePageSize ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Task_Update
    @Id UNIQUEIDENTIFIER,
    @UserId NVARCHAR(200),
    @Title NVARCHAR(200),
    @Description NVARCHAR(2000) = NULL,
    @DueDate DATETIME2 = NULL,
    @Status NVARCHAR(20),
    @AssignedTo NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Tasks
    SET Title = LTRIM(RTRIM(@Title)),
        Description = @Description,
        DueDate = @DueDate,
        Status = @Status,
        AssignedTo = @AssignedTo,
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id
      AND CreatedBy = @UserId;

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE Id = @Id
      AND (CreatedBy = @UserId OR AssignedTo = @UserId);
END;
GO

CREATE OR ALTER PROCEDURE dbo.Task_UpdateStatus
    @Id UNIQUEIDENTIFIER,
    @UserId NVARCHAR(200),
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Tasks
    SET Status = @Status,
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id
      AND (CreatedBy = @UserId OR AssignedTo = @UserId);

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE Id = @Id
      AND (CreatedBy = @UserId OR AssignedTo = @UserId);
END;
GO

CREATE OR ALTER PROCEDURE dbo.Task_Delete
    @Id UNIQUEIDENTIFIER,
    @UserId NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.Tasks
    WHERE Id = @Id
      AND CreatedBy = @UserId;

    SELECT @@ROWCOUNT AS DeletedCount;
END;
GO
