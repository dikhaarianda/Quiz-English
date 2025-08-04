# 📚 Quiz English Platform - Complete Documentation

## 🎯 Overview

Quiz English adalah platform pembelajaran bahasa Inggris berbasis web yang memungkinkan siswa mengerjakan quiz interaktif, tutor membuat soal dan memberikan feedback, serta admin mengelola seluruh sistem. Platform ini dibangun dengan teknologi modern dan dirancang untuk kemudahan penggunaan bagi pengguna non-teknis.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React +      │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│   Vite)         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │    │   File Storage  │
│   (Hosting)     │    │   (Auth + API)  │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend

- **React 18** - UI Library
- **Vite** - Build tool dan dev server
- **React Router** - Client-side routing
- **Chart.js** - Data visualization
- **Tailwind CSS** - Styling framework

### Backend

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security** - Data security
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage

### Deployment

- **Vercel** - Frontend hosting
- **Supabase Cloud** - Backend hosting

## 👥 User Roles

### 👨‍🎓 Student

- Mengerjakan quiz interaktif
- Melihat hasil dan progress belajar
- Menerima feedback dari tutor
- Tracking pencapaian dan statistik

### 👨‍🏫 Tutor

- Membuat dan mengelola soal quiz
- Memberikan feedback kepada siswa
- Monitor progress siswa
- Analisis performa pembelajaran

### 👨‍💼 Super Tutor (Admin)

- Mengelola semua pengguna sistem
- Oversight semua soal dan konten
- Analytics platform menyeluruh
- Konfigurasi dan maintenance sistem

## 📁 Project Structure

```
English-Quiz/
├── public/                     # Static files
│   ├── user-guide.html        # User documentation
│   └── favicon.ico
├── src/                       # Source code
│   ├── components/            # Reusable components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities
│   ├── pages/                # Page components
│   └── services/             # API services
├── supabase/                 # Database migrations
│   ├── migrations/           # SQL migration files
│   └── instruction/          # Setup guides
├── DEVELOPMENT_GUIDE.md      # Development documentation
├── API_REFERENCE.md          # API documentation
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
├── MAINTENANCE_GUIDE.md      # Maintenance procedures
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn
- Git
- Supabase account

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd English-Quiz

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Start development server
npm run dev
```

### Demo Accounts

```
Super Tutor (Admin):
- Username: admin
- Password: admin123

Tutor:
- Username: sarah_tutor
- Password: password123

Student:
- Username: john_student
- Password: password123
```

## 📖 Documentation

### 🔧 For Developers

- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Panduan lengkap development
  - System overview dan architecture
  - Technology stack detail
  - Database schema dan relationships
  - Frontend components structure
  - Authentication & authorization
  - Development setup dan best practices

### 🔌 API Documentation

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Dokumentasi API lengkap
  - Authentication endpoints
  - User management APIs
  - Quiz dan question management
  - Analytics dan reporting
  - File upload handling
  - Error handling dan debugging

### 🚀 Deployment

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Panduan deployment
  - Environment setup
  - Database configuration
  - Frontend deployment (Vercel)
  - Domain dan SSL setup
  - CI/CD pipeline
  - Monitoring dan logging

### 🔧 Maintenance

- **[MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)** - Panduan maintenance
  - Daily, weekly, monthly tasks
  - Database maintenance
  - Performance monitoring
  - Security procedures
  - Backup dan recovery
  - Emergency procedures

### 👥 User Guide

- **[public/user-guide.html](./public/user-guide.html)** - Panduan pengguna
  - Panduan untuk siswa
  - Panduan untuk tutor
  - Panduan untuk admin
  - Troubleshooting umum
  - FAQ dan support

## 🎯 Key Features

### ✅ Multi-Role System

- Role-based access control
- Secure authentication
- Permission management

### ✅ Interactive Quiz System

- Multiple choice questions
- Timer functionality
- Real-time scoring
- Progress tracking

### ✅ Analytics & Reporting

- Student progress tracking
- Performance analytics
- Category-wise statistics
- Visual charts dan graphs

### ✅ Feedback System

- Tutor-to-student feedback
- Rating system
- Personalized recommendations

### ✅ File Management

- Image upload untuk questions
- Audio support
- Secure file storage

### ✅ Responsive Design

- Mobile-friendly interface
- Cross-browser compatibility
- Accessible design

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level security
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - XSS dan injection protection
- **Rate Limiting** - API abuse prevention
- **HTTPS Encryption** - Secure data transmission

## 📊 Database Schema

### Core Tables

- **users** - User profiles dan authentication
- **categories** - Quiz categories (Grammar, Vocabulary, etc.)
- **difficulty_levels** - Beginner, Intermediate, Advanced
- **questions** - Quiz questions dengan options
- **quiz_attempts** - Student quiz attempts
- **quiz_answers** - Individual question answers
- **feedback** - Tutor feedback to students

### Relationships

- Users create questions dan give feedback
- Questions belong to categories dan difficulty levels
- Quiz attempts track student progress
- Feedback links tutors, students, dan quiz attempts

## 🚀 Getting Started Guide

### For Students

1. Login dengan akun yang diberikan
2. Pilih quiz dari dashboard
3. Kerjakan soal dengan teliti
4. Lihat hasil dan feedback
5. Track progress melalui charts

### For Tutors

1. Login dengan akun tutor
2. Buat soal melalui Question Management
3. Monitor student progress
4. Berikan feedback melalui Feedback Management
5. Analisis performance data

### For Admins

1. Login dengan akun super tutor
2. Kelola users melalui User Management
3. Monitor platform analytics
4. Review dan approve content
5. Maintain system health

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
supabase start       # Start local Supabase
supabase db reset    # Reset database
supabase db push     # Push migrations

# Deployment
vercel --prod        # Deploy to production
vercel env add       # Add environment variables
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Problems

```javascript
// Check if user is authenticated
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Current user:", user);

// Refresh session if needed
const { data, error } = await supabase.auth.refreshSession();
```

#### Database Connection Issues

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test query permissions
SELECT * FROM users LIMIT 1;
```

#### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

## 📞 Support & Contact

### For Technical Issues

- Check [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) untuk development issues
- Review [API_REFERENCE.md](./API_REFERENCE.md) untuk API problems
- Follow [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) untuk system issues

### For User Issues

- Refer to [user-guide.html](./public/user-guide.html)
- Check FAQ section
- Contact system administrator

### Emergency Procedures

- Follow emergency procedures di [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)
- Check system status pages
- Contact technical team immediately

## 🔄 Contributing

### Development Workflow

1. Fork repository
2. Create feature branch
3. Make changes dengan proper testing
4. Submit pull request
5. Code review dan approval

### Code Standards

- Follow ESLint configuration
- Use consistent naming conventions
- Write clear comments
- Include proper error handling
- Test all changes thoroughly

## 📝 License

This project is proprietary software. All rights reserved.

## 🎉 Acknowledgments

- **React Team** - For the amazing UI library
- **Supabase Team** - For the excellent backend platform
- **Vercel Team** - For seamless deployment experience
- **Chart.js Team** - For beautiful data visualization

---

## 📚 Documentation Index

| Document                                       | Purpose                          | Audience          |
| ---------------------------------------------- | -------------------------------- | ----------------- |
| [README.md](./README.md)                       | Project overview dan quick start | Everyone          |
| [DEVELOPMENT_GUIDE.md](./System_Guide/DEVELOPMENT_GUIDE.md) | Complete development guide       | Developers        |
| [API_REFERENCE.md](./System_Guide/API_REFERENCE.md)         | API documentation                | Developers        |
| [DEPLOYMENT_GUIDE.md](./System_Guide/DEPLOYMENT_GUIDE.md)   | Deployment instructions          | DevOps/Developers |
| [MAINTENANCE_GUIDE.md](./System_Guide/MAINTENANCE_GUIDE.md) | Maintenance procedures           | System Admins     |
| [user-guide.html](./public/user-guide.html)    | User manual                      | End Users         |

---

**Quiz English Platform** - Memudahkan pembelajaran bahasa Inggris untuk semua 🚀

_Last updated: $(date)_
