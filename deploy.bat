@echo off
echo 🚀 Автодеплой запущен...

setlocal enabledelayedexpansion

REM Добавляем изменения
echo 📦 Добавляем изменения в git...
git add .
git commit -m "Разделение логики работы приложения  Controller → Service → Model"
git push origin master

echo ✅ Деплой завершен
pause
