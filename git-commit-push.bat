@echo off
setlocal

set "REPO_DIR=%~dp0"

if "%~1"=="" (
    set /p "COMMIT_MESSAGE=Commit message: "
) else (
    set "COMMIT_MESSAGE=%*"
)

if "%COMMIT_MESSAGE%"=="" (
    echo Commit message is required.
    exit /b 1
)

cd /d "%REPO_DIR%" || (
    echo Failed to open repository: %REPO_DIR%
    exit /b 1
)

git add .
if errorlevel 1 (
    echo git add failed.
    exit /b 1
)

git diff --cached --quiet
if %errorlevel% EQU 0 (
    echo No staged changes to commit.
    exit /b 0
)

git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 (
    echo git commit failed.
    exit /b 1
)

git push origin main
if errorlevel 1 (
    echo git push failed.
    exit /b 1
)

echo Done.
exit /b 0
