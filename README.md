# TheAlmighties

Formal message & file sharing portal. Cloudflare Pages + GetPantry + Telegram Bot. (No R2 / no storage needed.)
Files go straight to Telegram, so max file size is 50 MB (Telegram bot limit).

## Setup
1. Push to GitHub (Hacky842/TheAlmighties)
2. Cloudflare -> Workers & Pages -> Create -> Pages -> Connect to Git
   - Framework: None, Build command: empty, Output directory: `public`
3. Settings -> Variables and Secrets (Production):
   TELEGRAM_BOT_TOKEN, PANTRY_ID, ADMIN_TELEGRAM_ID, INITIAL_PASSWORD, WEBHOOK_SECRET
4. Retry deployment
5. Webhook:
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://thealmighties.pages.dev/api/telegram-webhook&secret_token=<WEBHOOK_SECRET>

## Admin commands (only ADMIN_TELEGRAM_ID)
/setpassword, /addchat, /delchat, /addmember, /delmember, /status
