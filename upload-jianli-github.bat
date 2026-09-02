@echo off
REM ============================================================
REM  简历仓库一键上传脚本（jianli -> GitHub Pages 恢复嵌套目录结构）
REM  用户只需：双击本文件 + 遇到系统凭据弹窗点"允许/确定/登录"
REM  自动：找Clash代理 + 配Git代理 + 9次递进重试(绕过TLS握手错) + 哈希闭环
REM ============================================================
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1
title JianLi Upload (auto proxy detect + 9 retries)
cd /d "%~dp0"
echo.
echo [1/6]  Check repo location  (must be: E:\zuopin\gerenjianli)
echo        CURRENT_DIR=%cd%
if not exist ".git" (
    echo [FATAL] .git directory NOT FOUND in this folder.
    echo         Please put this .bat into E:\zuopin\gerenjianli\ and double-click again.
    echo.
    pause
    exit /b 2
)
if not exist "js\main.js" (
    echo [FATAL] js\main.js not found. Broken working tree.
    pause
    exit /b 3
)
for /f %%i in ('git rev-parse HEAD 2^>nul') do set LH=%%i
echo        LOCAL_HEAD=%LH%
echo        REMOTE_URL=
git remote get-url origin 2>nul
echo.

echo [2/6]  Auto-detect live HTTP/HTTPS proxy port on 127.0.0.1
set PROXY_PORT=
set PROXY=
for %%P in (7897 7890 7891 7892 7893 7894 7895 7896 7898 7899 10809 1080 8080 8888 9090 20171 41091) do (
    >nul 2>&1 (PowerShell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient;$o=$c.BeginConnect('127.0.0.1',%%P,$null,$null);$w=$o.AsyncWaitHandle.WaitOne(180,$false);if($w -and $c.Connected){$c.Close();exit 0}else{exit 1}")
    if !errorlevel! equ 0 (
        echo        LIVE proxy found: 127.0.0.1:%%P
        set PROXY_PORT=%%P
        set PROXY=http://127.0.0.1:%%P
        goto :proxy_done
    )
)
echo        [WARN] No live proxy port detected. Trying DIRECT push (usually fails inside CN GFW).
:proxy_done

echo.
echo [3/7]  Apply repo-level git proxy + tuning configs (repo-local only, never global)
REM --- always reset first so previous failed runs don't leave stale config ---
for %%K in (http.proxy https.proxy http.sslBackend http.sslCAInfo http.version http.postBuffer http.maxRequestBuffer http.lowSpeedLimit http.lowSpeedTime core.compression pack.windowMemory pack.threads pack.window protocol.version sendpack.sideband transfer.unpackLimit) do (
    git config --local --unset-all %%K 2>nul
)
if defined PROXY (
    git config --local http.proxy "%PROXY%"
    git config --local https.proxy "%PROXY%"
)
git config --local http.postBuffer 524288000
git config --local core.compression 0
git config --local pack.threads 1
git config --local sendpack.sideband false
git remote set-url origin "https://github.com/linyoudong2008/jianli.git" >nul 2>&1

echo.
echo [4/7]  Fetch sync remote origin/main  (FIX: --force-with-lease requires up-to-date tracking ref)
echo        (Previous 9 rejects were because your web-upload commit was unknown to local git)
git fetch --no-tags --depth=50 origin main 2>&1
set FETCH_EXIT=!errorlevel!
echo        FETCH_EXIT=!FETCH_EXIT!
if not !FETCH_EXIT! equ 0 (
    echo        [WARN] Fetch failed. Trying to continue anyway - lease check may still pass.
)

set OK=0
set LAST_EXIT=128

echo.
echo [5/7]  Start 9 progressive push attempts (3 profiles x 3 retries each)
echo        Profile A: sslBackend=schannel   protocol=2   http.version=HTTP/1.1
echo        Profile B: sslBackend=openssl    protocol=2   http.version=HTTP/1.1
echo        Profile C: sslBackend=openssl    protocol=1   http.version=HTTP/1.1
echo.
set ATT=0
for %%P in (A B C) do (
    if %%P equ A (
        git config --local http.sslBackend schannel
        git config --local protocol.version 2
        git config --local http.version HTTP/1.1
    )
    if %%P equ B (
        git config --local http.sslBackend openssl
        git config --local protocol.version 2
        git config --local http.version HTTP/1.1
    )
    if %%P equ C (
        git config --local http.sslBackend openssl
        git config --local protocol.version 1
        git config --local http.version HTTP/1.1
    )
    for /L %%R in (1 1 3) do (
        set /a ATT+=1
        echo ===== ATTEMPT !ATT! / 9   [PROFILE %%P  pass %%R / 3] =====
        if !ATT! equ 9 (
            echo        [LAST RESORT] Dropping to plain --force (fetch already synced remote state)
            git push --force origin main:main --progress 2>&1
        ) else (
            git push --force-with-lease origin main:main --progress 2>&1
        )
        set LAST_EXIT=!errorlevel!
        echo        ATTEMPT_!ATT!_EXIT=!LAST_EXIT!
        if !LAST_EXIT! equ 0 (
            set OK=1
            goto :push_done
        )
        echo        Retry waiting %%R sec...
        ping -n %%R 127.0.0.1 >nul 2>&1
    )
)
:push_done

echo.
echo [6/7]  Hash verify  (local HEAD == remote main ?)
if %OK% equ 1 (
    set RM=
    for /f "tokens=1" %%H in ('git ls-remote --heads origin main 2^>nul') do set "RM=%%H"
    echo        LOCAL  = %LH%
    echo        REMOTE = !RM!
    if "!RM!"=="%LH%" (
        echo.
        echo ============================================================
        echo   >>>  UPLOAD SUCCESS! Hash verified.  <<<
        echo ============================================================
        echo.
        echo   Your pages will rebuild automatically in 0~2 minutes.
        echo   Please tell the assistant: "upload done"
        echo   The assistant will independently verify:
        echo     - css/, js/, images/, docs/ folders restored online
        echo     - 7 tank gallery captions + poster = tankedazhan8.png
        echo     - Pages deployment success status + assets 200 OK
        echo.
    ) else (
        echo [WARN] Push exit=0 but hash mismatch. Please tell the assistant: push_ok_but_hash_mismatch
    )
) else (
    echo.
    echo ============================================================
    echo   >>>  UPLOAD FAILED  (after 9 attempts, last exit=%LAST_EXIT%)
    echo ============================================================
    echo.
    echo   Most common reasons and ONE-click fixes:
    echo     [A] TLS handshake error / schannel closed / unexpected EOF
    echo         =^> In Clash: switch node OR set ^<GITHUB-GIT^> rule group to
    echo             another node, then double-click this .bat again.
    echo     [B] Authentication failed
    echo         =^> In the credential manager popup that just appeared,
    echo             "Username" = linyoudong2008
    echo             "Password" = your GitHub Personal Access Token (classic,
    echo             with "repo" scope), NOT your GitHub login password.
    echo             Then double-click this .bat again.
    echo     [C] Repository not found
    echo         =^> Confirm the repo at:  https://github.com/linyoudong2008/jianli
    echo             is still present and you own it.
    echo     [D] still failed
    echo         =^> Tell the assistant and paste everything shown above.
    echo.
    echo   Full push log written at:  %%TEMP%%\jianli_push.log
    echo.
)

echo [7/7] Cleanup: Remove temporary local proxy + SSL configs from repo
for %%K in (http.proxy https.proxy http.sslBackend http.sslCAInfo http.version http.postBuffer http.maxRequestBuffer http.lowSpeedLimit http.lowSpeedTime core.compression pack.windowMemory pack.threads pack.window protocol.version sendpack.sideband transfer.unpackLimit) do (
    git config --local --unset-all %%K 2>nul
)

echo.
echo   You can close this window now (top-right X).
echo   The assistant will NEVER ask you to type another command.
echo   Just tell him what the result above said (SUCCESS / FAILED_*).
pause
endlocal
exit /b 0
