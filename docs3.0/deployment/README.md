# Deployment Documentation

## Overview

Wheely Good Pizza Tracker is designed to run locally on a single machine. This guide covers how to prepare, deploy, and maintain the application in a production environment.

## System Requirements

### Minimum Hardware

- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB free space
- Display: 1280x720 resolution

### Recommended Hardware

- CPU: 4 cores
- RAM: 8GB
- Storage: 20GB SSD
- Display: 1920x1080 resolution

### Software Requirements

- Windows 10/11 or modern Linux
- Node.js 20.x or later
- Modern web browser (Chrome/Firefox/Edge)

## Installation

### 1. Prepare Environment

```bash
# Install Node.js 20.x
# Windows: Download from nodejs.org
# Linux:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Application Setup

```bash
# Clone repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install

# Build application
npm run build
```

### 3. Production Start

```bash
# Start the application
npm start
```

## Database Management

### Location

The SQLite database is stored in `pizza-truck.db` in the application root.

### Backup Strategy

1. **Daily Backup**

   ```bash
   # Windows (PowerShell)
   Copy-Item pizza-truck.db "backups/pizza-truck-$(Get-Date -Format 'yyyy-MM-dd').db"

   # Linux
   cp pizza-truck.db "backups/pizza-truck-$(date +%Y-%m-%d).db"
   ```

2. **Restore from Backup**
   ```bash
   # Stop application
   # Copy backup file
   cp backups/pizza-truck-2025-09-26.db pizza-truck.db
   # Restart application
   ```

### Maintenance

- Regular backups
- Weekly vacuum
- Monthly integrity check
- Quarterly old backup cleanup

## Security

### File Permissions

```bash
# Linux
chmod 640 pizza-truck.db
chown application:application pizza-truck.db
```

### Windows Security

- Use NTFS permissions
- Restrict folder access
- Enable BitLocker
- Use Windows Defender

### Network Security

- Application runs on localhost
- No external connections
- Firewall rules if needed
- Regular OS updates

## Monitoring

### Application Logs

- Check `npm` logs
- Monitor system logs
- Watch for errors
- Track performance

### Database Health

```bash
# Check database integrity
sqlite3 pizza-truck.db "PRAGMA integrity_check;"

# Optimize database
sqlite3 pizza-truck.db "VACUUM;"
```

### System Monitoring

- CPU usage
- Memory usage
- Disk space
- Network activity

## Maintenance Procedures

### Daily Tasks

- Verify application status
- Check error logs
- Backup database
- Review disk space

### Weekly Tasks

- Review all logs
- Clean temporary files
- Vacuum database
- Check for updates

### Monthly Tasks

- Full system backup
- Performance review
- Security audit
- Update documentation

## Troubleshooting

### Common Issues

1. **Application Won't Start**

   - Check Node.js version
   - Verify port availability
   - Check file permissions
   - Review error logs

2. **Database Issues**

   - Check file permissions
   - Verify disk space
   - Run integrity check
   - Restore from backup

3. **Performance Problems**
   - Check system resources
   - Review database size
   - Clear temporary files
   - Restart application

### Recovery Procedures

1. **Database Corruption**

   ```bash
   # Stop application
   # Backup corrupt file
   cp pizza-truck.db pizza-truck.corrupt
   # Restore from backup
   cp backups/latest.db pizza-truck.db
   # Start application
   ```

2. **Application Crash**
   ```bash
   # Check logs
   # Stop any remaining processes
   # Clear temporary files
   # Restart application
   npm start
   ```

## Backup Strategy

### Database Backups

1. **Automated Daily Backup**

   ```bash
   # Create backup script
   #!/bin/bash
   BACKUP_DIR="backups"
   DATE=$(date +%Y-%m-%d)
   cp pizza-truck.db "$BACKUP_DIR/pizza-truck-$DATE.db"
   ```

2. **Retention Policy**
   - Keep daily backups for 1 week
   - Keep weekly backups for 1 month
   - Keep monthly backups for 1 year

### Configuration Backup

- Save environment settings
- Document system configuration
- Backup startup scripts
- Store documentation offline

## Disaster Recovery

### Preparation

1. Document recovery procedures
2. Test backups regularly
3. Maintain offline copies
4. Train staff on recovery

### Recovery Steps

1. Assess the issue
2. Stop application
3. Backup current state
4. Restore from backup
5. Verify functionality
6. Document incident

## Support

### Local Support

- Train staff on basic maintenance
- Document common issues
- Provide troubleshooting guide
- Maintain contact list

### Emergency Procedures

1. Stop application
2. Secure database
3. Contact support
4. Document incident
5. Follow recovery plan

## Updates

### Application Updates

1. Backup everything
2. Pull latest code
3. Install dependencies
4. Build application
5. Test thoroughly
6. Deploy update

### System Updates

1. Schedule maintenance
2. Backup data
3. Update OS
4. Update Node.js
5. Test application
6. Resume operations
