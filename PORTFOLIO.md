# Recent Improvements (2026)

**Best Practice Upgrades:**
- CSS variables for scalable spacing, font sizes, and colors
- Accessibility improvements (focus styles, live region feedback, icon labels)
- Memoized React context providers for performance
- Standardized API error handling in frontend
- Backend JSDoc comments and security notes
- Documentation updated to reflect these improvements

# The Art Museum — Full-Stack Portfolio Project

> A production-ready museum management platform demonstrating modern web engineering with React Native, Node.js, and SQLite. Built to showcase real-world application architecture, testing practices, and business logic implementation.

---

## 🎯 Project Overview

**The Art Museum** is a comprehensive platform for managing museum operations—from ticket sales and exhibitions to membership management and community engagement. This project demonstrates how to build a scalable, maintainable system that handles complex business requirements in a clean, professional architecture.

**Live Features:**
- 🎫 **Online Ticketing** — Secure ticket sales with inventory management and session tracking
- 👥 **Membership System** — Tiered memberships with automated renewal and benefit tracking
- 🛍️ **Gift Shop** — E-commerce integration with 25+ curated products across categories
- 📚 **Exhibition Management** — 25+ exhibitions with artwork galleries and curator notes
- 💬 **Communication Hub** — Contact forms, email integration, and newsletter subscriptions
- 🔐 **Admin Dashboard** — Role-based access with audit logging for all administrative actions
- 📱 **Cross-Platform UI** — React Native app running on iOS, Android, and Web

### Publication Pages

- **Public Hub:** `https://gitmanfel.github.io/art-museum/`
- **Case Study:** `https://gitmanfel.github.io/art-museum/portfolio-showcase.html`
- **Recruiter Edition:** `https://gitmanfel.github.io/art-museum/portfolio-recruiter.html`
- **Hiring Manager Edition:** `https://gitmanfel.github.io/art-museum/portfolio-hiring-manager.html`
- **Architecture Page:** `https://gitmanfel.github.io/art-museum/architecture.html`
- **Share Kit:** `https://gitmanfel.github.io/art-museum/share-kit.html`
- **Publish Playbook:** `https://gitmanfel.github.io/art-museum/publish-playbook.html`

---

## 📊 Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Test Coverage** | 103 tests passing | ✅ 10/10 suites |
| **Backend Endpoints** | 25+ RESTful APIs | ✅ All tested |
| **Database Tables** | 14+ normalized tables | ✅ Production schema |
| **Authentication** | JWT + bcrypt | ✅ Secure |
| **Catalogue Seed Data** | 20+ items per main category | ✅ Ready for demos |
| **Transactions** | Full ACID compliance | ✅ SQLite WAL mode |
| **Code Quality** | ESLint + Prettier | ✅ Consistent |

---

## 🏗️ Architecture

### Three-Layer Design
```
┌─────────────────────────────────────────┐
│        React Native Frontend             │
│  (iOS, Android, Web via Expo)            │
├─────────────────────────────────────────┤
│      Express.js REST API                 │
│  (Middleware, Controllers, Business      │
│   Logic, Authentication, Rate Limiting)  │
├─────────────────────────────────────────┤
│      SQLite Database                     │
│  (Normalized schema, Transactions,       │
│   Relationships, Full-text search)       │
└─────────────────────────────────────────┘
```

### Database Schema (14 Tables)
- **Users** — Complete user profiles with role-based access control
- **Tickets** — Dynamic pricing, inventory, session management
- **Memberships** — Subscription tracking, renewal automation
- **Products** — Inventory with category organization
- **Exhibitions** — Full exhibition metadata and scheduling
- **Artworks** — Gallery collections with media references
- **Collections** — Curated groupings with historical context
- **Orders** — E-commerce transactions with full history
- **Cart Items** — Session-based shopping cart
- **Contact Messages** — CRM integration with seeded demo messages
- **Newsletter Subscribers** — Marketing analytics
- **Admin Audit Logs** — Compliance and security tracking
- **Password Reset Tokens** — Secure credential recovery
- **Inventory Reservations** — Real-time stock management

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x
- **Database:** SQLite3 with better-sqlite3 (WAL mode)
- **Authentication:** JWT with bcrypt hashing
- **Testing:** Jest + Supertest
- **Email:** Nodemailer with SMTP/Sendgrid
- **Security:** CORS, rate limiting, input validation

### Frontend
- **Framework:** React Native 0.73+
- **Build:** Expo (managed workflow)
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Authentication:** SecureStore (device storage)
- **Testing:** Jest with React Native Testing Library

### DevOps & Tools
- **Version Control:** Git + GitHub
- **Package Manager:** npm workspace monorepo
- **Code Quality:** ESLint, Prettier
- **API Documentation:** RESTful conventions
- **Deployment:** Ready for Node.js hosting

---

## 🔐 Security & Compliance

✅ **Authentication** — JWT tokens with 24-hour expiration  
✅ **Authorization** — Role-based access control (RBAC)  
✅ **Password Security** — bcrypt with salt rounds  
✅ **Data Validation** — Input sanitization on all endpoints  
✅ **Cache Control** — Secure header injection  
✅ **Rate Limiting** — 100 requests/15 min per user  
✅ **Audit Logging** — All admin actions tracked  
✅ **ACID Compliance** — SQLite transactions for data integrity  

---

## 📈 Feature Breakdown

### **Ticketing System**
- 25+ ticket types (regular, group, student, VIP, annual passes)
- Real-time inventory tracking
- Session-based reservations to prevent overselling
- Dynamic pricing support

### **E-Commerce**
- 25+ products across 6 categories (books, prints, accessories, stationery, home, collectibles)
- Shopping cart with quantity management
- Order history and purchase tracking
- Secure checkout flow

### **Exhibition Management**
- 25+ curated exhibitions with rich metadata
- 32+ artworks linked to exhibitions
- Timeline view with opening/closing dates
- Image galleries for visual storytelling

### **Member Portal**
- 10 membership tiers with varying benefits
- Automatic renewal reminders
- Membership status dashboard
- Historical transaction tracking

### **Community Features**
- Contact form with seeded demo messages
- Newsletter subscription with seeded demo subscribers
- Email notifications for important events
- Feedback collection system

### **Admin Dashboard**
- User management interface
- Inventory control and stock adjustment
- Exhibition scheduling and content management
- Financial analytics and sales reports
- Comprehensive audit logs for compliance

---

## 🚀 Performance Characteristics

| Operation | Result | Validation |
|-----------|--------|------------|
| Authentication flow | Functional | ✅ Automated tests |
| Catalogue listing | Functional | ✅ 25 exhibitions / 28 products / 25 collections |
| Checkout flow | Functional | ✅ Automated tests |
| Admin endpoints | Functional | ✅ Automated tests |

**Database**: SQLite with WAL mode for reliable local development and transactional integrity.

---

## 📱 Cross-Platform Deployment

### **Web (PWA)**
Runs on Expo Web via port 8094 — responsive design works on all screen sizes

### **Mobile (iOS/Android)**
Expo managed build system provides seamless deployment to App Store and Play Store  
Includes:
- Biometric authentication support
- Offline-first architecture
- Push notifications ready
- Photo gallery integration

---

## 🧪 Testing & Quality Assurance

### Test Coverage Summary
```
✅ Backend test suites: 10 passed
✅ Backend tests: 103 passed
✅ Frontend test suites: 6 passed
✅ Frontend tests: 20 passed

Total: **123 tests across backend and frontend — All passing**
```

### Continuous Quality
- Every endpoint tested with both success and failure scenarios
- Database integrity verified post-operation
- Security boundaries tested (unauthenticated access rejection)
- Performance baselines established

---

## 💡 Engineering Highlights

### Clean Architecture
- **Separation of Concerns** — Routes, Controllers, Services, Database layers
- **DRY Principles** — Reusable middleware and utility functions
- **SOLID Design** — Single responsibility, open/closed, interface segregation
- **Error Handling** — Graceful failures with meaningful error messages

### Database Design
- **Normalized Schema** — Reduced redundancy, improved integrity
- **Foreign Keys** — Enforced relationships between entities
- **Indexes** — Optimized query performance
- **Transaction Support** — Atomic operations for data consistency

### API Design
- **RESTful Conventions** — Standard HTTP methods and status codes
- **Consistent Response Format** — Predictable client experience
- **Rate Limiting** — Protection against abuse
- **Request Validation** — Type-safe endpoints

### Testing Strategy
- **Unit Tests** — Individual function logic
- **Integration Tests** — Multi-component interactions
- **E2E Tests** — Full user workflows
- **Security Tests** — Authentication and authorization boundaries

---

## 🎓 What This Project Demonstrates

### For Frontend Engineers
- React Native cross-platform development
- State management at scale  
- Responsive design patterns
- Integration with backend APIs
- Local data persistence

### For Backend Engineers
- Express.js REST API design
- Database schema design and optimization
- Authentication and authorization
- Email and notification services
- Error handling and logging

### For DevOps Engineers
- Monorepo project structure
- Database migration strategies
- Environment configuration
- Testing automation
- Build and deployment readiness

### For Product Managers
- Feature-rich system supporting real business workflows
- Scalable architecture for growth
- User-centric design (cross-platform, responsive)
- Data integrity and compliance
- Analytics-ready data structure

---

## 🔄 Development Workflow

### Local Setup
1. Clone repository
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Start backend: `npm run dev` (port 5000)
5. Start frontend: `npm start` (Expo on port 8094)

### Testing
```bash
cd backend && npm test    # Run full test suite
npm run test:watch       # Watch mode for TDD
npm run test:coverage    # Generate coverage report
```

### Code Quality
```bash
npm run lint             # Check code style
npm run format           # Auto-format code
```

---

## 📊 Scalability Notes

**Current Configuration**
- SQLite single-file database
- Node.js single instance
- In-process session management

**Scaling Path** (if needed)
- PostgreSQL for multi-instance support
- Redis for session management
- Load balancer (Nginx/HAProxy)
- CDN for static assets
- Horizontal scaling Docker containers

The code is structured to make these transitions straightforward with minimal refactoring.

---

## 🎯 Business Value Delivered

✅ **Revenue Generation** — Ticketing, memberships, gift shop sales  
✅ **Operational Efficiency** — Automated inventory, audit trails, reporting  
✅ **Customer Engagement** — Multiple communication channels, personalization  
✅ **Data-Driven Insights** — Rich datasets for analytics and decision making  
✅ **Brand Presence** — Professional digital platform  
✅ **Accessibility** — Built to serve diverse audiences across devices  

---

## 📄 License & Attribution

This project is presented as a portfolio demonstration. It showcases professional software engineering practices and full-stack development capabilities.

---

## 🤝 Contact & Discussion

This project demonstrates:
- Production-grade backend API design
- Cross-platform mobile/web frontend architecture  
- Data architecture for complex business domains
- Professional testing and quality practices
- Real-world problem-solving approach

**Interested in discussing architecture decisions, technical implementation, or scaling strategies?**

---

### Project Stats
- **Seed Data**: 25 ticket types, 28 products, 25 exhibitions, 25 collections, 33 artworks
- **Recent Communication Seed Data**: 22 contact messages, 22 newsletter subscribers
- **Test Coverage**: 123 tests across backend and frontend suites
- **Database Tables**: 14+ normalized tables
- **API Endpoints**: 25+ RESTful routes
- **Architecture**: Monorepo with React Native frontend and Express + SQLite backend

---

*Built with attention to detail, testing excellence, and scalable architecture.*  
*Ready for production deployment and business growth.*
