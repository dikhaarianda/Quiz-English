# English Quiz Platform

A comprehensive web-based English learning platform with role-based access, featuring interactive quizzes, progress tracking, and feedback management.

## 🌟 Features

### For Students

- **Interactive Quizzes**: Take quizzes across different categories and difficulty levels
- **Progress Tracking**: Monitor your learning progress with detailed analytics
- **Instant Results**: Get immediate feedback on quiz performance
- **Tutor Feedback**: Receive personalized feedback from tutors
- **One-Time Attempts**: Each quiz can only be taken once to ensure fair assessment

### For Tutors

- **Question Management**: Create, edit, and manage quiz questions
- **Student Monitoring**: Track student progress and performance
- **Feedback System**: Provide detailed feedback and recommendations
- **Analytics Dashboard**: View comprehensive statistics and insights
- **Media Support**: Add images and audio to questions

### For Super Tutors (Admins)

- **User Management**: Manage all users and their roles
- **Complete Access**: Full access to all platform features
- **System Analytics**: View platform-wide statistics
- **Content Moderation**: Oversee all content and feedback

## 🛠️ Technology Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **UI Components**: Custom CSS with Lucide React icons
- **Charts**: Chart.js with React Chart.js 2
- **Notifications**: React Toastify
- **Authentication**: Supabase Auth with Row Level Security

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd english-quiz-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase backend**

   Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173`

## 📚 User Roles & Permissions

### Student Role

- ✅ Register and login
- ✅ Take quizzes (one attempt per quiz)
- ✅ View quiz results and explanations
- ✅ Track personal progress
- ✅ Receive and view tutor feedback
- ✅ Submit feedback after completing quizzes

### Tutor Role

- ✅ All student permissions
- ✅ Create and manage questions
- ✅ View all student results
- ✅ Provide feedback to students
- ✅ Access tutor analytics dashboard
- ✅ Manage quiz categories and difficulties

### Super Tutor Role (Admin)

- ✅ All tutor permissions
- ✅ Manage all users (create, edit, deactivate)
- ✅ Access system-wide analytics
- ✅ Moderate all content and feedback
- ✅ Manage platform settings

## 🎯 Demo Accounts

For testing purposes, you can use these demo accounts:

| Role        | Username     | Password    | Email            |
| ----------- | ------------ | ----------- | ---------------- |
| Super Tutor | admin        | admin123    | admin@demo.com   |
| Tutor       | sarah_tutor  | password123 | tutor@demo.com   |
| Student     | john_student | password123 | student@demo.com |

_Note: Create these accounts through the registration process first._

## 📊 Database Schema

### Core Tables

- **users**: User profiles with role-based access
- **categories**: Quiz categories (Grammar, Vocabulary, Reading, etc.)
- **difficulty_levels**: Beginner, Intermediate, Advanced
- **questions**: Quiz questions with explanations
- **question_options**: Multiple choice answers
- **quiz_attempts**: Student quiz sessions and scores
- **quiz_answers**: Individual question responses
- **feedback**: Tutor-to-student feedback
- **student_feedback**: Student-to-tutor feedback

### Key Features

- **Row Level Security (RLS)**: Secure data access based on user roles
- **Auto-grading**: Automatic quiz scoring and analytics
- **File Storage**: Support for question images and audio
- **Real-time Updates**: Live progress tracking

## 🔧 Development

### Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Utility libraries (Supabase config)
├── pages/             # Page components
├── services/          # API service layer
└── styles/            # CSS styles

supabase/
├── migrations/        # Database migrations
└── functions/         # Edge functions (if any)
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. **Database Changes**: Add migrations in `supabase/migrations/`
2. **API Services**: Update `src/services/supabaseService.js`
3. **UI Components**: Add to `src/components/` or `src/pages/`
4. **Authentication**: Modify `src/contexts/AuthContext.jsx`

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Role-based Permissions**: Granular access control
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Restricted file types and sizes

## 📱 Responsive Design

The platform is fully responsive and works on:

- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop computers (1024px+)
- 🖥️ Large screens (1440px+)

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📈 Performance

- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: Automatic image optimization
- **Caching**: Efficient data caching strategies
- **Bundle Splitting**: Optimized JavaScript bundles

## 🧪 Testing

### Manual Testing Checklist

#### Authentication

- [ ] User registration with different roles
- [ ] Login with email and username
- [ ] Password reset functionality
- [ ] Session persistence

#### Quiz Functionality

- [ ] Quiz creation and management
- [ ] Question creation with multiple options
- [ ] Quiz taking experience
- [ ] Auto-grading accuracy
- [ ] Results display

#### Role-based Access

- [ ] Student permissions
- [ ] Tutor permissions
- [ ] Super tutor permissions
- [ ] Unauthorized access prevention

#### Feedback System

- [ ] Tutor feedback creation
- [ ] Student feedback submission
- [ ] Feedback display and management

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**

   - [ ] Production Supabase project
   - [ ] Environment variables configured
   - [ ] Domain and SSL certificate

2. **Database**

   - [ ] All migrations applied
   - [ ] Sample data removed (if needed)
   - [ ] Backup strategy in place

3. **Security**

   - [ ] RLS policies reviewed
   - [ ] CORS settings configured
   - [ ] Rate limiting enabled

4. **Performance**
   - [ ] Build optimization
   - [ ] CDN configuration
   - [ ] Monitoring setup

### Deployment Platforms

The application can be deployed on:

- **Vercel** (Recommended for React apps)
- **Netlify**
- **AWS Amplify**
- **Traditional hosting** with static file serving

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow React best practices
- Use TypeScript for new components (optional)
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

1. **Documentation**: Check this README and SUPABASE_SETUP.md
2. **Issues**: Create a GitHub issue for bugs
3. **Discussions**: Use GitHub Discussions for questions
4. **Community**: Join our Discord/Slack (if available)

### Common Issues

- **Build Errors**: Check Node.js version and dependencies
- **Database Issues**: Verify Supabase configuration
- **Authentication Problems**: Check environment variables
- **Permission Errors**: Review RLS policies

## 🔮 Roadmap

### Upcoming Features

- [ ] **Mobile App**: React Native version
- [ ] **Advanced Analytics**: More detailed reporting
- [ ] **Gamification**: Points, badges, leaderboards
- [ ] **Offline Mode**: PWA with offline capabilities
- [ ] **Multi-language**: Platform localization
- [ ] **AI Integration**: Smart question generation
- [ ] **Video Support**: Video questions and explanations
- [ ] **Collaborative Features**: Study groups and peer review

### Performance Improvements

- [ ] **Caching Strategy**: Redis integration
- [ ] **Database Optimization**: Query optimization
- [ ] **CDN Integration**: Global content delivery
- [ ] **Real-time Features**: WebSocket integration

## 📊 Analytics & Monitoring

The platform includes built-in analytics for:

- User engagement metrics
- Quiz completion rates
- Performance trends
- Error tracking
- Usage patterns

## 🎨 Customization

### Theming

- CSS custom properties for easy theming
- Dark mode support (planned)
- Brand customization options

### Configuration

- Environment-based configuration
- Feature flags for A/B testing
- Customizable quiz settings

---

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **React Team** for the amazing frontend framework
- **Lucide** for the beautiful icon set
- **Chart.js** for the charting capabilities
- **Vite** for the fast build tool

---

**Happy Learning! 📚✨**

For detailed setup instructions, please see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
