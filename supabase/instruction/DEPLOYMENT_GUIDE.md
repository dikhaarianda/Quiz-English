# Deployment Guide - English Quiz Platform

This guide covers deploying your English Quiz Platform to production.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel is ideal for React applications with excellent performance and easy setup.

#### Steps:

1. **Prepare your repository**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables**
   In Vercel dashboard, go to Settings > Environment Variables:

   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   ```

4. **Configure Domain**
   - Add your custom domain in Vercel settings
   - Update Supabase redirect URLs

### Option 2: Netlify

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Deploy to Netlify**

   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder
   - Or connect your Git repository

3. **Configure Environment Variables**
   In Netlify dashboard, go to Site Settings > Environment Variables

4. **Set up redirects**
   Create `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Option 3: AWS Amplify

1. **Connect repository**

   - Go to AWS Amplify Console
   - Connect your GitHub repository

2. **Configure build settings**

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - "**/*"
   ```

3. **Set environment variables**
   Add your Supabase credentials in Amplify console

## 🔧 Production Configuration

### Supabase Production Setup

1. **Create Production Project**

   - Create a new Supabase project for production
   - Use a different database password
   - Choose appropriate region

2. **Run Migrations**

   - Execute all migration files in order
   - Verify all tables and functions are created

3. **Configure Authentication**

   - Set production site URL
   - Configure redirect URLs
   - Set up email templates
   - Enable email confirmations

4. **Set up Storage**

   - Verify all buckets are created
   - Test file upload functionality
   - Configure CORS if needed

5. **Security Settings**
   - Review RLS policies
   - Set up rate limiting
   - Configure CORS origins
   - Enable audit logging

### Environment Variables

Create production environment variables:

```env
# Production Supabase
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Optional production settings
VITE_APP_NAME=English Quiz Platform
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### Build Optimization

1. **Optimize Bundle Size**

   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

2. **Analyze Bundle**

   ```bash
   npx vite-bundle-analyzer dist
   ```

3. **Performance Checklist**
   - [ ] Enable gzip compression
   - [ ] Set up CDN for static assets
   - [ ] Configure caching headers
   - [ ] Optimize images
   - [ ] Enable service worker (PWA)

## 🔒 Security Checklist

### Pre-deployment Security

- [ ] Remove all console.log statements
- [ ] Verify no sensitive data in client code
- [ ] Check all environment variables are set
- [ ] Review RLS policies
- [ ] Test authentication flows
- [ ] Verify file upload restrictions
- [ ] Check CORS configuration

### Post-deployment Security

- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set up backup strategy
- [ ] Test all user roles and permissions
- [ ] Verify SSL certificate
- [ ] Check security headers

## 📊 Monitoring & Analytics

### Set up Monitoring

1. **Error Tracking**

   - Integrate Sentry or similar service
   - Monitor JavaScript errors
   - Track API failures

2. **Performance Monitoring**

   - Use Vercel Analytics or Google Analytics
   - Monitor Core Web Vitals
   - Track user engagement

3. **Database Monitoring**
   - Monitor Supabase dashboard
   - Set up alerts for high usage
   - Track query performance

### Health Checks

Create monitoring endpoints:

- Database connectivity
- Authentication service
- File storage access
- API response times

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🧪 Testing in Production

### Post-deployment Testing

1. **Functional Testing**

   - [ ] User registration and login
   - [ ] Quiz creation and taking
   - [ ] File uploads
   - [ ] Feedback system
   - [ ] Role-based access

2. **Performance Testing**

   - [ ] Page load times
   - [ ] API response times
   - [ ] Database query performance
   - [ ] File upload/download speeds

3. **Security Testing**
   - [ ] Authentication bypass attempts
   - [ ] SQL injection tests
   - [ ] File upload security
   - [ ] XSS prevention

## 📱 PWA Configuration (Optional)

To make your app installable:

1. **Add Web App Manifest**
   Create `public/manifest.json`:

   ```json
   {
     "name": "English Quiz Platform",
     "short_name": "EnglishQuiz",
     "description": "Interactive English learning platform",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#667eea",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Add Service Worker**
   - Implement caching strategy
   - Enable offline functionality
   - Add push notifications

## 🔧 Maintenance

### Regular Maintenance Tasks

1. **Weekly**

   - [ ] Check error logs
   - [ ] Monitor performance metrics
   - [ ] Review user feedback

2. **Monthly**

   - [ ] Update dependencies
   - [ ] Review security logs
   - [ ] Backup database
   - [ ] Performance optimization

3. **Quarterly**
   - [ ] Security audit
   - [ ] User experience review
   - [ ] Feature usage analysis
   - [ ] Infrastructure review

### Backup Strategy

1. **Database Backups**

   - Supabase automatic backups
   - Manual exports for critical data
   - Test restoration process

2. **File Storage Backups**

   - Regular storage bucket backups
   - Version control for critical files

3. **Code Backups**
   - Git repository backups
   - Environment configuration backups

## 🚨 Incident Response

### Common Issues and Solutions

1. **Database Connection Issues**

   - Check Supabase status
   - Verify connection strings
   - Review rate limits

2. **Authentication Problems**

   - Check JWT token expiration
   - Verify redirect URLs
   - Review RLS policies

3. **File Upload Failures**
   - Check storage bucket permissions
   - Verify file size limits
   - Review CORS settings

### Emergency Contacts

- Supabase Support: [support@supabase.com](mailto:support@supabase.com)
- Hosting Provider Support
- Development Team Contacts

## 📈 Scaling Considerations

### Performance Optimization

1. **Database Optimization**

   - Add database indexes
   - Optimize queries
   - Consider read replicas

2. **Frontend Optimization**

   - Implement code splitting
   - Add service worker caching
   - Optimize images and assets

3. **Infrastructure Scaling**
   - CDN implementation
   - Load balancing
   - Auto-scaling configuration

### Feature Scaling

- Multi-language support
- Advanced analytics
- Mobile app development
- API rate limiting
- Microservices architecture

---

## 🎉 Deployment Checklist

Before going live:

- [ ] All migrations applied to production database
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Authentication tested
- [ ] File uploads working
- [ ] All user roles tested
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team trained on production environment

**Your English Quiz Platform is ready for production! 🚀**

For any deployment issues, refer to the troubleshooting section in the main README or contact your development team.
