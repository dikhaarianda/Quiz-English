# 🔧 Quiz English Platform - Maintenance Guide

## 📋 Table of Contents

1. [Daily Maintenance Tasks](#daily-maintenance-tasks)
2. [Weekly Maintenance Tasks](#weekly-maintenance-tasks)
3. [Monthly Maintenance Tasks](#monthly-maintenance-tasks)
4. [Database Maintenance](#database-maintenance)
5. [Performance Monitoring](#performance-monitoring)
6. [Security Maintenance](#security-maintenance)
7. [Backup & Recovery](#backup--recovery)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Emergency Procedures](#emergency-procedures)
10. [Maintenance Scripts](#maintenance-scripts)

---

## 📅 Daily Maintenance Tasks

### 1. System Health Check

```bash
# Check application status
curl -I https://your-domain.com
# Expected: HTTP/2 200

# Check API endpoints
curl -H "apikey: your-anon-key" \
     https://your-project.supabase.co/rest/v1/users?limit=1
# Expected: JSON response with user data
```

### 2. Error Log Review

```sql
-- Check application errors (last 24 hours)
SELECT
  level,
  message,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurrence
FROM application_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND level IN ('ERROR', 'CRITICAL')
GROUP BY level, message
ORDER BY occurrences DESC;
```

### 3. Performance Metrics

```sql
-- Check database performance
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- queries taking more than 1 second
ORDER BY mean_time DESC
LIMIT 10;
```

### 4. User Activity Monitoring

```sql
-- Daily active users
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users
FROM application_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- New registrations today
SELECT COUNT(*) as new_users_today
FROM users
WHERE DATE(created_at) = CURRENT_DATE;
```

---

## 📊 Weekly Maintenance Tasks

### 1. Database Cleanup

```sql
-- Clean old logs (keep last 30 days)
DELETE FROM application_logs
WHERE created_at < NOW() - INTERVAL '30 days';

-- Clean incomplete quiz attempts (older than 24 hours)
DELETE FROM quiz_attempts
WHERE is_completed = false
  AND started_at < NOW() - INTERVAL '24 hours';

-- Update statistics
ANALYZE;
```

### 2. Performance Analysis

```sql
-- Table sizes analysis
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Index usage analysis
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
```

### 3. User Engagement Metrics

```sql
-- Weekly quiz completion rates
SELECT
  DATE_TRUNC('week', completed_at) as week,
  COUNT(*) as total_attempts,
  AVG(score) as average_score,
  COUNT(DISTINCT student_id) as unique_students
FROM quiz_attempts
WHERE is_completed = true
  AND completed_at >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', completed_at)
ORDER BY week DESC;

-- Popular categories
SELECT
  c.name as category,
  COUNT(*) as attempts,
  AVG(qa.score) as avg_score
FROM quiz_attempts qa
JOIN categories c ON qa.category_id = c.id
WHERE qa.completed_at >= NOW() - INTERVAL '1 week'
  AND qa.is_completed = true
GROUP BY c.name
ORDER BY attempts DESC;
```

### 4. Security Review

```bash
# Check for suspicious login attempts
# Review authentication logs in Supabase Dashboard

# Check for unusual API usage patterns
# Monitor rate limiting and blocked requests

# Review user permissions and roles
# Ensure no unauthorized privilege escalations
```

---

## 🗓️ Monthly Maintenance Tasks

### 1. Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies (test in development first)
npm update

# Check for security vulnerabilities
npm audit
npm audit fix

# Update Supabase CLI
npm install -g @supabase/cli@latest
```

### 2. Database Optimization

```sql
-- Reindex tables for better performance
REINDEX DATABASE postgres;

-- Update table statistics
ANALYZE VERBOSE;

-- Check for unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0
  AND schemaname = 'public';

-- Vacuum tables to reclaim space
VACUUM ANALYZE;
```

### 3. Storage Cleanup

```javascript
// Clean up unused uploaded files
const cleanupUnusedFiles = async () => {
  // Get all files in storage
  const { data: files } = await supabase.storage.from("quiz-files").list();

  // Get referenced files from database
  const { data: questions } = await supabase
    .from("questions")
    .select("image_url, audio_url")
    .not("image_url", "is", null)
    .not("audio_url", "is", null);

  const referencedFiles = new Set();
  questions.forEach((q) => {
    if (q.image_url) referencedFiles.add(extractFileName(q.image_url));
    if (q.audio_url) referencedFiles.add(extractFileName(q.audio_url));
  });

  // Delete unreferenced files
  const filesToDelete = files.filter((file) => !referencedFiles.has(file.name));

  for (const file of filesToDelete) {
    await supabase.storage.from("quiz-files").remove([file.name]);
  }

  console.log(`Cleaned up ${filesToDelete.length} unused files`);
};
```

### 4. Backup Verification

```bash
# Test database backup restoration
# 1. Download latest backup from Supabase
# 2. Restore to test environment
# 3. Verify data integrity
# 4. Test application functionality

# Verify file storage backups
# 1. Check backup storage location
# 2. Verify file integrity
# 3. Test restoration process
```

---

## 🗄️ Database Maintenance

### 1. Regular Maintenance Queries

```sql
-- Check database size
SELECT
  pg_size_pretty(pg_database_size('postgres')) as database_size;

-- Check connection usage
SELECT
  count(*) as active_connections,
  max_conn,
  max_conn - count(*) as available_connections
FROM pg_stat_activity,
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') mc;

-- Check long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';
```

### 2. Index Maintenance

```sql
-- Check index bloat
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Create missing indexes based on query patterns
-- Example: If queries frequently filter by student_id and completed_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_attempts_student_completed
ON quiz_attempts(student_id, completed_at DESC)
WHERE is_completed = true;
```

### 3. Data Archiving

```sql
-- Archive old quiz attempts (older than 1 year)
CREATE TABLE quiz_attempts_archive AS
SELECT * FROM quiz_attempts
WHERE completed_at < NOW() - INTERVAL '1 year';

-- Archive related quiz answers
CREATE TABLE quiz_answers_archive AS
SELECT qa.* FROM quiz_answers qa
JOIN quiz_attempts_archive qaa ON qa.attempt_id = qaa.id;

-- Delete archived data from main tables
DELETE FROM quiz_answers
WHERE attempt_id IN (SELECT id FROM quiz_attempts_archive);

DELETE FROM quiz_attempts
WHERE id IN (SELECT id FROM quiz_attempts_archive);
```

---

## 📈 Performance Monitoring

### 1. Application Performance Metrics

```javascript
// Frontend performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === "navigation") {
      console.log("Page Load Time:", entry.loadEventEnd - entry.loadEventStart);
    }

    if (entry.entryType === "resource") {
      console.log("Resource Load:", entry.name, entry.duration);
    }
  });
});

performanceObserver.observe({ entryTypes: ["navigation", "resource"] });

// API response time monitoring
const monitorApiCall = async (apiFunction, ...args) => {
  const start = performance.now();
  try {
    const result = await apiFunction(...args);
    const duration = performance.now() - start;

    // Log slow API calls (>2 seconds)
    if (duration > 2000) {
      console.warn(`Slow API call: ${apiFunction.name} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `API call failed: ${apiFunction.name} after ${duration}ms`,
      error
    );
    throw error;
  }
};
```

### 2. Database Performance Monitoring

```sql
-- Monitor query performance
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 100  -- Only queries called more than 100 times
ORDER BY mean_time DESC;

-- Monitor table bloat
CREATE OR REPLACE VIEW table_bloat AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_dead_tup,
  n_live_tup,
  CASE
    WHEN n_live_tup > 0
    THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
    ELSE 0
  END as dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY dead_tuple_percent DESC;
```

### 3. Resource Usage Monitoring

```bash
# Monitor server resources (if self-hosted)
#!/bin/bash

# CPU usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'

# Memory usage
echo "Memory Usage:"
free -m | awk 'NR==2{printf "%.2f%%\n", $3*100/$2}'

# Disk usage
echo "Disk Usage:"
df -h | awk '$NF=="/"{printf "%s\n", $5}'

# Network connections
echo "Active Connections:"
netstat -an | grep :80 | wc -l
```

---

## 🔒 Security Maintenance

### 1. Security Audits

```sql
-- Check for users with elevated privileges
SELECT
  id,
  username,
  role,
  is_active,
  created_at
FROM users
WHERE role IN ('tutor', 'super_tutor')
ORDER BY created_at DESC;

-- Check for suspicious login patterns
SELECT
  user_id,
  COUNT(*) as login_attempts,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM application_logs
WHERE message LIKE '%login%'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 10  -- More than 10 login attempts
ORDER BY login_attempts DESC;
```

### 2. Access Control Review

```sql
-- Review RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables without RLS
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
```

### 3. API Security

```javascript
// Rate limiting check
const checkRateLimit = async (userId) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { count } = await supabase
    .from("api_requests")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo.toISOString());

  if (count > 1000) {
    // 1000 requests per hour limit
    throw new Error("Rate limit exceeded");
  }
};

// Input validation
const validateInput = (input, type) => {
  switch (type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    case "username":
      return /^[a-zA-Z0-9_]{3,20}$/.test(input);
    case "password":
      return input.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(input);
    default:
      return false;
  }
};
```

---

## 💾 Backup & Recovery

### 1. Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
PROJECT_ID="your-project-id"

# Database backup
echo "Starting database backup..."
supabase db dump --db-url $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# File storage backup
echo "Starting file storage backup..."
mkdir -p $BACKUP_DIR/files_$DATE
# Download all files from Supabase storage
# (Implementation depends on your storage structure)

# Compress backups
echo "Compressing backups..."
tar -czf $BACKUP_DIR/full_backup_$DATE.tar.gz $BACKUP_DIR/db_backup_$DATE.sql $BACKUP_DIR/files_$DATE/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: full_backup_$DATE.tar.gz"
```

### 2. Recovery Procedures

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
TEMP_DIR="/tmp/restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Starting restore from $BACKUP_FILE..."

# Extract backup
mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Restore database
echo "Restoring database..."
psql $DATABASE_URL < $TEMP_DIR/db_backup_*.sql

# Restore files
echo "Restoring files..."
# Upload files back to Supabase storage
# (Implementation depends on your storage structure)

# Clean up
rm -rf $TEMP_DIR

echo "Restore completed successfully"
```

### 3. Disaster Recovery Plan

```markdown
## Disaster Recovery Checklist

### Immediate Response (0-1 hour):

1. [ ] Assess the scope of the issue
2. [ ] Notify stakeholders
3. [ ] Switch to maintenance mode if needed
4. [ ] Begin recovery procedures

### Recovery Process (1-4 hours):

1. [ ] Identify root cause
2. [ ] Restore from latest backup
3. [ ] Verify data integrity
4. [ ] Test critical functionality
5. [ ] Monitor system stability

### Post-Recovery (4+ hours):

1. [ ] Full system testing
2. [ ] Performance monitoring
3. [ ] User communication
4. [ ] Post-mortem analysis
5. [ ] Update procedures
```

---

## 🚨 Common Issues & Solutions

### 1. Database Connection Issues

```sql
-- Issue: Too many connections
-- Solution: Check and kill idle connections
SELECT
  pid,
  usename,
  application_name,
  state,
  query_start
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '1 hour';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '1 hour';
```

### 2. Performance Issues

```javascript
// Issue: Slow page loads
// Solution: Implement lazy loading and code splitting

// Before
import Dashboard from "./Dashboard";

// After
const Dashboard = React.lazy(() => import("./Dashboard"));

// Issue: Large API responses
// Solution: Implement pagination
const getQuestions = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  return { data, error };
};
```

### 3. Authentication Issues

```javascript
// Issue: Users getting logged out frequently
// Solution: Implement token refresh
const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error("Session refresh failed:", error);
    // Redirect to login
    window.location.href = "/login";
  }

  return data;
};

// Auto-refresh before token expires
setInterval(refreshSession, 50 * 60 * 1000); // 50 minutes
```

### 4. File Upload Issues

```javascript
// Issue: File upload failures
// Solution: Implement retry logic and validation
const uploadFileWithRetry = async (file, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Validate file before upload
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large (max 5MB)");
      }

      const result = await fileService.uploadImage(file);

      if (result.success) {
        return result;
      }

      throw new Error(result.error);
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

---

## 🚨 Emergency Procedures

### 1. System Down Emergency

```bash
# Emergency Response Checklist

# 1. Immediate Assessment
curl -I https://your-domain.com
# Check if frontend is accessible

curl -H "apikey: your-key" https://your-project.supabase.co/rest/v1/
# Check if API is accessible

# 2. Enable Maintenance Mode
# Create maintenance.html and deploy
echo "System under maintenance. Please try again later." > maintenance.html

# 3. Check System Status
# Vercel status: https://vercel-status.com
# Supabase status: https://status.supabase.com

# 4. Rollback if needed
vercel rollback
# Or restore from backup if database issue
```

### 2. Data Corruption Emergency

```sql
-- Emergency data recovery steps

-- 1. Stop all write operations
-- Revoke write permissions temporarily

-- 2. Assess corruption scope
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM quiz_attempts;

-- 3. Restore from backup
-- Use latest clean backup
-- Restore to temporary database first

-- 4. Verify data integrity
-- Run data validation queries
-- Check referential integrity

-- 5. Switch to restored database
-- Update connection strings
-- Test functionality
```

### 3. Security Breach Emergency

```sql
-- Security incident response

-- 1. Immediate containment
-- Disable affected user accounts
UPDATE users SET is_active = false
WHERE id IN (SELECT suspicious_user_ids);

-- 2. Audit trail
SELECT * FROM application_logs
WHERE created_at >= 'incident_start_time'
  AND (level = 'ERROR' OR message LIKE '%security%');

-- 3. Reset compromised credentials
-- Force password reset for affected users
-- Rotate API keys
-- Update authentication tokens

-- 4. System hardening
-- Review and update RLS policies
-- Check for unauthorized data access
-- Update security configurations
```

---

## 🔧 Maintenance Scripts

### 1. Health Check Script

```javascript
// health-check.js
const healthCheck = async () => {
  const checks = [];

  // Database connectivity
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    checks.push({
      service: "Database",
      status: error ? "FAIL" : "OK",
      message: error?.message || "Connected",
    });
  } catch (error) {
    checks.push({
      service: "Database",
      status: "FAIL",
      message: error.message,
    });
  }

  // API endpoints
  try {
    const response = await fetch("/api/health");
    checks.push({
      service: "API",
      status: response.ok ? "OK" : "FAIL",
      message: response.ok ? "Responsive" : "Not responding",
    });
  } catch (error) {
    checks.push({
      service: "API",
      status: "FAIL",
      message: error.message,
    });
  }

  // File storage
  try {
    const { data, error } = await supabase.storage
      .from("quiz-files")
      .list("", { limit: 1 });

    checks.push({
      service: "Storage",
      status: error ? "FAIL" : "OK",
      message: error?.message || "Accessible",
    });
  } catch (error) {
    checks.push({
      service: "Storage",
      status: "FAIL",
      message: error.message,
    });
  }

  return checks;
};

// Run health check
healthCheck().then((results) => {
  console.log("Health Check Results:");
  results.forEach((check) => {
    console.log(`${check.service}: ${check.status} - ${check.message}`);
  });
});
```

### 2. Database Cleanup Script

```sql
-- cleanup.sql
-- Run this script weekly

BEGIN;

-- Clean old application logs
DELETE FROM application_logs
WHERE created_at < NOW() - INTERVAL '30 days';

-- Clean incomplete quiz attempts
DELETE FROM quiz_attempts
WHERE is_completed = false
  AND started_at < NOW() - INTERVAL '24 hours';

-- Clean orphaned quiz answers
DELETE FROM quiz_answers
WHERE attempt_id NOT IN (SELECT id FROM quiz_attempts);

-- Clean orphaned question options
DELETE FROM question_options
WHERE question_id NOT IN (SELECT id FROM questions);

-- Update table statistics
ANALYZE;

-- Log cleanup results
INSERT INTO application_logs (level, message, metadata)
VALUES ('INFO', 'Database cleanup completed',
        json_build_object('timestamp', NOW()));

COMMIT;
```

### 3. Performance Monitoring Script

```javascript
// performance-monitor.js
const monitorPerformance = async () => {
  const metrics = {
    timestamp: new Date().toISOString(),
    database: {},
    api: {},
    frontend: {},
  };

  // Database metrics
  const { data: dbStats } = await supabase.rpc("get_database_stats");

  metrics.database = {
    connections: dbStats.active_connections,
    slow_queries: dbStats.slow_query_count,
    table_sizes: dbStats.table_sizes,
  };

  // API response times
  const apiTests = [
    { name: "users", endpoint: "/api/users?limit=1" },
    { name: "questions", endpoint: "/api/questions?limit=1" },
    { name: "quiz_attempts", endpoint: "/api/quiz-attempts?limit=1" },
  ];

  for (const test of apiTests) {
    const start = Date.now();
    try {
      await fetch(test.endpoint);
      metrics.api[test.name] = Date.now() - start;
    } catch (error) {
      metrics.api[test.name] = -1; // Error indicator
    }
  }

  // Frontend metrics (if running in browser)
  if (typeof window !== "undefined") {
    const navigation = performance.getEntriesByType("navigation")[0];
    metrics.frontend = {
      load_time: navigation.loadEventEnd - navigation.loadEventStart,
      dom_ready:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      first_paint:
        performance.getEntriesByName("first-paint")[0]?.startTime || 0,
    };
  }

  // Store metrics
  await supabase.from("performance_metrics").insert(metrics);

  return metrics;
};

// Run every 5 minutes
setInterval(monitorPerformance, 5 * 60 * 1000);
```

---

Dokumentasi maintenance ini memberikan panduan lengkap untuk menjaga sistem Quiz English tetap berjalan optimal, termasuk prosedur darurat dan script otomatis untuk memudahkan maintenance rutin.
