@echo off
@rem Maven Wrapper Script for Windows

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

set MAVEN_WRAPPER_JAR_PATH=%APP_HOME%\.mvn\wrapper\maven-wrapper.jar

if not exist "%MAVEN_WRAPPER_JAR_PATH%" (
    echo Downloading Maven wrapper...
    if not exist "%APP_HOME%\.mvn\wrapper" mkdir "%APP_HOME%\.mvn\wrapper"
    powershell -command "& { iwr https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.1.0/maven-wrapper-3.1.0.jar -OutFile '%MAVEN_WRAPPER_JAR_PATH%' }"
)

@rem Execute Maven
java %MAVEN_OPTS% -classpath "%MAVEN_WRAPPER_JAR_PATH%" "-Dmaven.multiModuleProjectDirectory=%APP_HOME%" org.apache.maven.wrapper.MavenWrapperMain %*

if ERRORLEVEL 1 goto fail

:end
@rem End local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" endlocal

:fail
exit /b 1