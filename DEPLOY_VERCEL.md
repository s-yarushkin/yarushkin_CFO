# Deploy to Vercel

Цель: чтобы сайт открывался по ссылке и не требовал локального запуска через терминал.

## 1. Залить проект в GitHub

В папке проекта:

```bash
git init
git add .
git commit -m "Findir MVP v0.8.2"
git branch -M main
git remote add origin https://github.com/YOUR_LOGIN/YOUR_REPO.git
git push -u origin main
```

Если репозиторий уже существует:

```bash
git add .
git commit -m "Findir MVP v0.8.2"
git push
```

## 2. Подключить Vercel

1. Открыть Vercel.
2. New Project.
3. Import Git Repository.
4. Выбрать репозиторий.
5. Framework Preset: Next.js.
6. Deploy.

## 3. Добавить Environment Variables в Vercel

В проекте Vercel:

Settings → Environment Variables

Добавить:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

После добавления переменных нажать Redeploy.

## 4. Проверить

На сайте в левом блоке должно быть:

```text
Данные загружены из Supabase.
```
