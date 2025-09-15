@echo off &setlocal
@SETLOCAL
@SET PATHEXT=%PATHEXT:;.JS;=;%
mongo  "%~dp0\data_retrieve.js" %*
PAUSE
