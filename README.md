# Pizza Truck Operations Management System

> A comprehensive food truck operations management platform built with React, TypeScript, and SQLite

## 🍕 Overview

The Pizza Truck Operations Management System is a complete solution for managing all aspects of a food truck business. From inventory tracking to point-of-sale, cash management to financial reporting, this platform handles the day-to-day operations of running a successful pizza truck.

### Key Features

- **📦 Inventory Management** - FIFO (First In, First Out) tracking with automatic stock consumption
- **🛒 Point of Sale** - Real-time sales processing with ingredient validation
- **💰 Cash Session Management** - Opening/closing cash drawer tracking
- **📊 Financial Reporting** - Revenue, profit, expense analytics with KPI dashboards
- **🧾 Recipe Management** - Bill of Materials (BOM) with automatic cost calculation
- **💳 Expense Tracking** - Categorized business expense monitoring
- **👥 User Authentication** - Secure login with role-based access control
- **📱 Responsive Design** - Modern web interface that works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pizza-truck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser to `http://localhost:5081` (development)
   - Login with demo credentials:
     - Email: `admin@pizzatruck.com`
     - Password: `admin123`

### Database

The system uses a local SQLite database (`pizza-truck.db`) that is automatically created on first run. This provides:
- ✅ **Portability** - Database file can be easily copied/backed up
- ✅ **No external dependencies** - No database server required
- ✅ **Easy export** - Simple file-based data storage

## 🏗️ System Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Radix UI with shadcn/ui design system
- Tailwind CSS for styling
- TanStack Query for state management
- Wouter for routing

**Backend:**
- Node.js with Express.js
- TypeScript with ES modules
- SQLite with Drizzle ORM
- Passport.js for authentication
- Zod for validation

**Key Design Principles:**
- **Type Safety** - Full TypeScript coverage across frontend and backend
- **Data Integrity** - FIFO inventory tracking with audit trails
- **Security** - Secure authentication with password hashing
- **Performance** - Optimized queries and caching strategies

## 📋 Core Features

### Inventory Management

**FIFO Inventory Tracking:**
- Automatic first-in-first-out consumption of ingredients
- Individual lot tracking with purchase dates and costs
- Low stock alerts and real-time quantity monitoring
- Manual stock adjustments with audit trails

**Purchase Management:**
- Supplier management and purchase order creation
- Automatic inventory lot creation from purchases
- Cost tracking for accurate profit calculations

### Point of Sale System

**Sales Processing:**
- Real-time product selection and pricing
- Automatic ingredient validation before sale completion
- Multiple payment method support (cash, card, etc.)
- Instant inventory depletion using FIFO methodology

**Receipt Management:**
- Detailed transaction records
- Line item tracking with ingredients consumed
- Sales analytics and reporting

### Recipe Management (Bill of Materials)

**Product Recipes:**
- Define ingredient requirements for each menu item
- Automatic cost calculation based on current ingredient prices
- Stock validation to prevent overselling
- Recipe scaling and portion control

### Financial Management

**Cash Session Control:**
- Opening and closing cash drawer management
- Daily cash reconciliation
- Cash flow tracking and reporting

**Expense Tracking:**
- Categorized business expense recording
- Automatic expense categorization
- Monthly and yearly expense reports

**Analytics & Reporting:**
- Revenue and profit analysis
- Inventory turnover reports
- Cost of goods sold (COGS) calculations
- Key Performance Indicator (KPI) dashboards

## 👥 User Roles & Permissions

### Administrator (ADMIN)
- Full system access
- User management
- Financial reporting
- System configuration

### Cashier (CASHIER)
- Point of sale operations
- Cash session management
- Basic inventory viewing
- Sales reporting

### Kitchen Staff (KITCHEN)
- Recipe management
- Inventory consumption tracking
- Product preparation workflows

## 🔐 Security Features

**Authentication:**
- Email-based login system
- Secure password hashing with crypto.scrypt
- Session-based authentication with express-session
- Automatic password migration from legacy systems

**Authorization:**
- Role-based access control
- Protected API endpoints
- Secure route protection on frontend

**Data Protection:**
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- Password hash sanitization in API responses

## 📊 Database Schema

The system uses SQLite with the following core entities:

### Users & Authentication
- **users** - User accounts with roles and authentication
- **sessions** - Express session storage

### Inventory Management
- **ingredients** - Raw materials and supplies
- **suppliers** - Vendor information
- **purchases** - Purchase orders and receipts
- **purchase_items** - Individual items in purchases
- **inventory_lots** - FIFO lot tracking
- **stock_movements** - Inventory adjustment audit trail

### Product & Recipe Management
- **products** - Menu items and offerings
- **recipe_items** - Bill of Materials for products

### Sales & Financial
- **cash_sessions** - Cash drawer management
- **sales** - Sales transactions
- **sale_items** - Individual items in sales
- **expenses** - Business expense tracking

## 🔧 Development

### Project Structure

```
pizza-truck/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # Utilities and contexts
│   │   ├── pages/         # Route components
│   │   └── App.tsx        # Main app component
├── server/                 # Express backend
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route handlers
│   ├── seed.ts            # Database seeding
│   ├── sqlite-storage.ts  # SQLite storage implementation
│   └── storage.ts         # Storage interface
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Zod schemas and types
└── pizza-truck.db         # SQLite database file
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Database
npm run db:generate  # Generate database migrations
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (database GUI)

# Production Build
npm run build        # Build for production
npm start            # Start production server
```

### Environment Variables

```bash
# Required for production
SESSION_SECRET=your-secret-key-here

# Optional (auto-configured for development)
DATABASE_URL=./pizza-truck.db
NODE_ENV=development
```

## 🎯 Business Use Cases

### Daily Operations
1. **Opening the Truck**
   - Start cash session with opening amount
   - Check inventory levels and low stock alerts
   - Review daily sales targets

2. **Processing Sales**
   - Select products from menu
   - System validates ingredient availability
   - Process payment and update inventory
   - Generate receipt

3. **Inventory Management**
   - Record new purchases and deliveries
   - Adjust stock levels for waste/loss
   - Monitor FIFO rotation

4. **Closing the Truck**
   - Close cash session with final count
   - Review daily sales reports
   - Plan next day's inventory needs

### Weekly/Monthly Operations
- Analyze sales trends and popular items
- Review supplier costs and negotiate pricing
- Generate financial reports for accounting
- Plan menu changes based on ingredient costs

## 📈 Reporting & Analytics

### Sales Reports
- Daily, weekly, monthly sales summaries
- Product performance analysis
- Peak hour identification
- Payment method breakdowns

### Inventory Reports
- Current stock levels and valuations
- FIFO lot aging analysis
- Waste and shrinkage tracking
- Supplier performance metrics

### Financial Reports
- Profit and loss statements
- Cost of goods sold analysis
- Expense categorization and trends
- Cash flow projections

## 🛠️ Maintenance & Backup

### Database Backup
```bash
# Simple file copy (SQLite advantage)
cp pizza-truck.db backup/pizza-truck-$(date +%Y%m%d).db
```

### Log Management
- Application logs are automatically rotated
- Error logging with detailed stack traces
- Performance monitoring and alerts

### Updates & Migrations
- Schema changes handled by Drizzle migrations
- Data integrity checks before updates
- Rollback capabilities for failed migrations

## 📞 Support & Troubleshooting

### Common Issues

**Application won't start:**
- Check that the dev port 5081 is available
- On macOS, port 5000 is often reserved by AirPlay/Control Center. Use 5081 for development (`npm run dev`).
- Verify Node.js version (18+ required)
- Ensure all dependencies are installed

**Login issues:**
- Verify demo credentials: admin@pizzatruck.com / admin123
- Check browser console for authentication errors
- Clear browser cache and cookies

**Database errors:**
- Check pizza-truck.db file permissions
- Verify SQLite database integrity
- Review server logs for detailed error messages

### Performance Optimization
- Regular database maintenance with VACUUM
- Index optimization for frequently queried data
- Cache invalidation strategies for real-time updates

## 🔮 Future Enhancements

### Planned Features
- Mobile app for iOS/Android
- Online ordering integration
- Multi-location support
- Advanced analytics with machine learning
- Integration with accounting software
- Customer loyalty program

### Technical Improvements
- Real-time notifications with WebSockets
- Offline-first capabilities with service workers
- Enhanced data visualization with charts
- API rate limiting and throttling
- Automated testing suite

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

---

*Built with ❤️ for food truck entrepreneurs*

---

## Full Documentation

See the modular docs under `docs/`.

- Start here: `docs/README.md`
- End-to-end guide: `docs/end-to-end.md`
- Architecture: `docs/architecture.md`
- API: `docs/api.md`
- Frontend: `docs/frontend.md`
- Backend: `docs/backend.md`
- Database: `docs/database.md`
- Security: `docs/security.md`
- Operations: `docs/operations.md`
- Roadmap: `docs/roadmap.md`