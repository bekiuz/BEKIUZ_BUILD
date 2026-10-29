# BEKIUZ BUILD

**BEKIUZ BUILD** — O‘zbek tilida oddiy talabdan uy qavat rejasini va dastlabki qurilish materiali hisobini tayyorlashga mo‘ljallangan AI yordamchi.

## Hozirgi MVP

- O‘zbek tilida uy talabini oddiy matn bilan yozish: masalan, “7 metr eni, 5 metr bo‘yi, beton plita 30 sm, 3 xona, shifer tom”.
- Matndan uy eni, bo‘yi, beton qalinligi va xona sonini shakllarga avtomatik ko‘chirish.
- Bekiuz AI orqali xona nomlari va joylashuvining konseptual rejasini yaratish.
- SVG qavat chizmasini ko‘rsatish va yuklab olish.
- Plita betonining hajmi (m³), taxminiy massasi (tonna), g‘isht miqdori va tom qoplamasini hisoblash.
- Hisobotni chop etish yoki brauzer orqali PDF sifatida saqlash.
- Moslashuvchan, mobilga mos Uzbek-language web UI; 3D demo-model olib tashlangan.

## Hisoblash farazlari

Hisoblar hozircha miqdoriy taxmin. Beton uchun 2.4 tonna/m³ zichlik; devor g‘ishti uchun taxminan 394 dona/m³ va 5% zaxira; tom uchun tanlangan qiyalik, 30 sm karniz, 10% zaxira, bir listga qabul qilingan foydali qoplash maydoni qo‘llanadi. Devor hisobida eshik/deraza o‘lchamlari taxminiy standart sifatida olinadi. Bu ko‘rsatkichlarni foydalanuvchi yoki mahalliy quruvchi tasdiqlashi kerak.

Beton plitaning qalinligi foydalanuvchi kiritgan qiymat bo‘yicha arifmetik hisoblanadi, ammo 30 sm plita har bir uy uchun to‘g‘ri degani emas. Fundament, armatura, ustun/to‘sin, tom tayanchlari, grunt va barcha xavfsizlikka oid konstruktiv yechimlarni tegishli mutaxassis belgilashi va tekshirishi shart. AI chizmasi konseptualdir; tasdiqlangan ishchi arxitektura yoki konstruktiv loyiha emas.

## AI ulanishi

Frontend quyidagi Bekiuz AI Worker endpointiga ulanadi:

`https://bekiuz-ai.bekiuz282.workers.dev/api/plan`

Ulanish holati `/api/health` orqali tekshiriladi. Worker manba kodiga xona joylashuvini qaytaruvchi reja formati qo‘shilgan.

**Muhim deploy eslatmasi:** GitHub Actions deploy run’ida “Deploy Worker” qadami SKIPPED holatida tugagan. Cloudflare Worker’ning yangi kodini jonli muhitga chiqarish uchun repo Actions secrets quyidagilar bilan sozlangan bo‘lishi kerak:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Ularni GitHub’dagi [Bekiuz AI repository Actions secrets](https://github.com/bekiuz/bekiuz-ai/settings/secrets/actions) bo‘limida sozlang va [Deploy Bekiuz AI Worker workflow](https://github.com/bekiuz/bekiuz-ai/actions/workflows/deploy-worker.yml) ishga tushiring. Tokenni kodga kiritmang va chatga yubormang. Deploydan keyin `/api/health` ni va `/api/plan` ni jonli so‘rov bilan tekshiring.

## Repo va sayt

- Repo: https://github.com/bekiuz/BEKIUZ_BUILD
- Website: https://bekiuz.github.io/BEKIUZ_BUILD/
- Build/validation Actions: https://github.com/bekiuz/BEKIUZ_BUILD/actions

## Build

`node scripts/build.mjs` statik sayt fayllarini `dist/` ichiga nusxalaydi.
