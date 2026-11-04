# TheAlmighties

Formal file & message sharing portal. Cloudflare Pages + R2 + GetPantry + Telegram Bot.

## Setup

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Hacky842/TheAlmighties.git
git push -u origin main
```

### 2. R2 bucket
Cloudflare Dashboard -> R2 -> Create bucket -> name: `thealmighties-files`

### 3. Cloudflare Pages
Workers & Pages -> Create -> Pages -> Connect to Git -> select `TheAlmighties`
- Framework preset: None
- Build command: (empty)
- Build output directory: `public`

Project name: `thealmighties` -> https://thealmighties.pages.dev

### 4. Settings -> Variables and Secrets (Production)
- TELEGRAM_BOT_TOKEN
- PANTRY_ID
- ADMIN_TELEGRAM_ID
- INITIAL_PASSWORD
- WEBHOOK_SECRET (any random string)

### 5. Settings -> Bindings -> R2 bucket
- Variable name: `BUCKET`
- Bucket: `thealmighties-files`

Then redeploy.

### 6. Telegram webhook
Open in browser:
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://thealmighties.pages.dev/api/telegram-webhook&secret_token=<WEBHOOK_SECRET>

### 7. Admin commands (only ADMIN_TELEGRAM_ID)
/setpassword, /addchat, /delchat, /addmember, /delmember, /status
