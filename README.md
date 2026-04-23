# UCLICK-Y — Hotel Booking Platform

A production-ready hotel booking platform with Flutter mobile app, NestJS backend, and Next.js partner dashboard.

## Architecture

```
uclicky-project/
├── backend/                    # NestJS API server
│   ├── prisma/                 # Database schema + seed
│   │   ├── schema.prisma       # 11 models with enums
│   │   └── seed.ts             # Admin + sample data
│   └── src/
│       ├── auth/               # Twilio OTP + Google OAuth + JWT
│       ├── profiles/           # User profile CRUD
│       ├── properties/         # Hotel search + details
│       ├── rooms/              # Room types + availability
│       ├── bookings/           # Booking creation (server-side pricing)
│       ├── payments/           # KBZPay + Stripe + Mock adapters
│       ├── partners/           # Property + booking management
│       ├── admin/              # System administration
│       ├── email/              # SendGrid email service
│       └── notifications/      # In-app notifications
│
├── flutter_app/                # Flutter mobile app (iOS + Android)
│   └── lib/
│       ├── core/               # API client, theme, router, storage
│       └── features/           # Feature-based modules
│           ├── auth/           # Phone OTP + Google sign-in
│           ├── profile/        # Profile completion + settings
│           ├── properties/     # Hotel browsing + search + detail
│           ├── bookings/       # Create, view, cancel bookings
│           ├── payments/       # KBZPay + Card payment flow
│           └── home/           # Main home screen
│
└── partner-dashboard/          # Next.js web dashboard
    └── app/
        ├── login/              # Partner OTP login
        ├── dashboard/          # Stats overview
        ├── properties/         # Property CRUD
        ├── rooms/              # Room type management
        └── bookings/           # Approve/reject bookings

└── admin-dashboard/            # Next.js admin panel
    └── app/
        ├── login/              # Email/password + OTP login
        ├── dashboard/          # System-wide stats
        ├── partners/           # Approve/reject partners
        ├── properties/         # Approve/reject properties
        ├── users/              # All users management
        └── bookings/           # All bookings overview
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Flutter SDK 3.2+
- Xcode (macOS, for iOS simulator)
- Android Studio (for Android SDK/emulator)
- VS Code with Flutter + Dart extensions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in real values
cp .env.example .env
# Edit .env with your Twilio, Google, SendGrid, KBZPay credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed sample data
npx prisma db seed

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000/api`
Swagger docs at `http://localhost:3000/api/docs`

### 2. Flutter App Setup

```bash
cd flutter_app

# Install dependencies
flutter pub get

# Update the API URL in lib/core/constants/app_constants.dart
# For simulator: http://localhost:3000/api (iOS) or http://10.0.2.2:3000/api (Android)
# For real device: http://YOUR_IP:3000/api

# Run on iOS Simulator
flutter run -d iPhone

# Run on Android Emulator
flutter run -d emulator

# Run on both simultaneously (two terminals)
flutter run -d iPhone
flutter run -d emulator
```

### 3. Partner Dashboard Setup

```bash
cd partner-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server (runs on port 3001)
npm run dev
```

The partner dashboard will be at `http://localhost:3001`
Login with the sample partner phone: +959111222333

### 4. Admin Dashboard Setup

```bash
cd admin-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server (runs on port 3002)
npm run dev
```

The admin dashboard will be at `http://localhost:3002`
Login with: admin@myanmartravel.com / admin123

### 5. Required API Keys


| Service | Purpose | Get from |
|---------|---------|----------|
| Twilio | OTP SMS | https://console.twilio.com |
| Google OAuth | Social login | https://console.cloud.google.com |
| SendGrid | Emails | https://app.sendgrid.com |
| KBZPay | Myanmar payments | KBZPay merchant portal |
| Stripe | Card payments | https://dashboard.stripe.com |

### 4. Twilio Setup
1. Create account at twilio.com
2. Go to Verify → Services → Create new service
3. Copy the Service SID to `TWILIO_VERIFY_SERVICE_SID`
4. Copy Account SID and Auth Token from dashboard

### 5. Google Sign-In Setup
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials (iOS + Android)
3. For iOS: Add `GoogleService-Info.plist` to `ios/Runner/`
4. For Android: Add `google-services.json` to `android/app/`
5. Register SHA-1 fingerprint for Android

## API Endpoints

### Auth
- `POST /api/auth/send-otp` — Send OTP via Twilio
- `POST /api/auth/verify-otp` — Verify OTP, get JWT
- `POST /api/auth/google` — Google sign-in
- `POST /api/auth/admin-login` — Admin email/password login
- `GET  /api/auth/me` — Get current user

### Profile
- `GET  /api/profile` — Get profile
- `PUT  /api/profile` — Update profile
- `POST /api/profile/complete` — Complete profile (first login)

### Uploads (Image Upload)
- `POST /api/uploads/avatar` — Upload user avatar (multipart)
- `POST /api/uploads/property/:id` — Upload property images (max 10)
- `POST /api/uploads/room/:id` — Upload room images (max 10)
- `POST /api/uploads/document` — Upload documents (license, ID)
- `DELETE /api/uploads` — Delete uploaded file by URL

### Properties
- `GET /api/properties/search` — Search with filters
- `GET /api/properties/:id` — Property details + rooms

### Rooms
- `GET /api/rooms/property/:id` — Rooms for a property
- `GET /api/rooms/:id/availability` — Check availability

### Bookings
- `POST /api/bookings` — Create booking (server-side pricing)
- `GET  /api/bookings/my` — My bookings
- `GET  /api/bookings/:id` — Booking details
- `POST /api/bookings/:id/cancel` — Cancel booking

### Payments
- `POST /api/payments/create/:bookingId` — Initiate KBZPay or Stripe payment
- `POST /api/payments/kbzpay/webhook` — KBZPay callback
- `POST /api/payments/stripe/webhook` — Stripe card callback
- `GET  /api/payments/:bookingId/status` — Payment status
- `POST /api/payments/simulate/:bookingId` — [DEV] Simulate payment

### Partner
- `POST /api/partner/register` — Register as partner
- `GET  /api/partner/bookings` — View bookings
- `POST /api/partner/bookings/:id/approve` — Approve → email sent
- `POST /api/partner/bookings/:id/reject` — Reject → refund triggered
- `POST /api/partner/properties` — Create property
- `POST /api/partner/properties/:id/rooms` — Add room type

### Admin
- `GET  /api/admin/dashboard` — System stats
- `GET  /api/admin/partners/pending` — Pending partner applications
- `POST /api/admin/partners/:id/approve` — Approve partner
- `POST /api/admin/partners/:id/reject` — Reject partner
- `GET  /api/admin/properties/pending` — Pending property listings
- `POST /api/admin/properties/:id/approve` — Approve property
- `POST /api/admin/properties/:id/reject` — Reject property
- `GET  /api/admin/users` — List all users (paginated)
- `GET  /api/admin/bookings` — List all bookings (paginated)

## Default Login
- Admin: admin@myanmartravel.com / admin123
- Partner: partner@goldenpalace.com (use OTP: +959111222333)

## Key Design Decisions
- **Price is NEVER trusted from frontend** — server calculates totals
- **Payment abstraction layer** — swap KBZPay/Stripe/Mock without code changes
- **Dual payment methods** — KBZPay (Myanmar mobile wallet) + Stripe (international cards)
- **Mock adapter in dev** — `NODE_ENV=development` auto-uses mock payments
- **Image upload** — local storage in dev, ready for S3/CloudFlare R2 in production
- **Clean Architecture** — feature-based modules, repository pattern
- **JWT stored in flutter_secure_storage** — Keychain (iOS) / Keystore (Android)
- **Admin dashboard** — separate Next.js app on port 3002 with dark theme
- **Partner dashboard** — separate Next.js app on port 3001 with Booking.com blue theme

## Running All 4 Services

```bash
# Terminal 1 — Backend API
cd backend && npm run start:dev          # → localhost:3000

# Terminal 2 — Partner Dashboard
cd partner-dashboard && npm run dev       # → localhost:3001

# Terminal 3 — Admin Dashboard
cd admin-dashboard && npm run dev         # → localhost:3002

# Terminal 4 — Flutter Mobile App
cd flutter_app && flutter run             # → iOS/Android simulator
```