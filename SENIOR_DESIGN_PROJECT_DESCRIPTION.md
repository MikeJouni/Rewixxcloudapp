SENIOR DESIGN PROJECT DESCRIPTION
Rewixx Cloud Platform Enhancement

________________________________________________________________________________

COMPANY OVERVIEW

Rewixx is a cloud-based job management platform built for field service businesses—contractors, technicians, and trade professionals across industries. The platform provides a unified system for managing customers, jobs, employees, expenses, inventory, and financials. Deployed on Microsoft Azure, Rewixx replaces fragmented spreadsheets and paper-based workflows with a scalable digital solution adaptable to any service-based business.

________________________________________________________________________________

CURRENT STATE

The existing codebase is a production-ready, full-stack web application:

  • Frontend: React 19 with Ant Design UI components, TailwindCSS, and React Query
  • Backend: Java Spring Boot REST API with JWT authentication and PostgreSQL database
  • Auxiliary Service: Python FastAPI for receipt OCR and barcode scanning
  • Deployment: Dockerized microservices on Azure Container Apps

Implemented Features:

  • Multi-Tenant Architecture: Each registered user has an isolated profile with their own
    separate database records. All customers, jobs, employees, and financial data are
    scoped to the individual user account, ensuring complete data privacy between businesses.

  • Customer Management: Full CRUD operations with search, filtering, and pagination.
    Store contact details, addresses, and customer history.

  • Job Tracking: Create and manage jobs with status tracking, priority levels, timelines,
    pricing, materials, and receipt image attachments. Link jobs to customers and employees.

  • Employee Management: Add team members, track active/inactive status, and manage
    employee profiles and contact information.

  • Expense Tracking: Record business expenses by type, link to jobs or customers,
    track billable items, and manage vendor information.

  • Contract Management: Create, update, and track contracts associated with jobs.

  • Receipt & Barcode Scanning: OCR-powered receipt processing and product barcode
    lookup via integrated Python microservice.

  • Business Analytics: Generate revenue, labor, and expense reports with PDF and
    Excel export capabilities.

  • Authentication: Secure login via email/password or Google OAuth with JWT tokens.

________________________________________________________________________________

REWIXX JOBX CLOUD PLATFORM — ADDED FEATURES PROJECT SCOPE

1. AI Assistant Tab
   • Dedicated AI tab in the main navigation with functional action buttons
   • Natural language commands to execute tasks: "Create a job for customer X,"
     "Show unpaid invoices," "Schedule employee Y for tomorrow"
   • AI-powered insights: job profitability analysis, scheduling recommendations,
     expense anomaly detection
   • Conversational interface integrated with backend APIs to read/write data

2. Customer Portal & Communication
   • Self-service portal where clients view job status, invoices, and payment history
   • Automated email notifications for job updates and appointment reminders

3. Scheduling & Calendar System
   • Interactive calendar with drag-and-drop job scheduling
   • Employee availability management and assignment optimization
   • Conflict detection for double-bookings

4. Enhanced Reporting Dashboard
   • Quick action buttons for common reports: revenue summary, outstanding invoices,
     employee hours, job status breakdown
   • One-click report generation from saved system data (customers, jobs, expenses, payments)
   • Interactive charts (revenue trends, job completion rates, employee utilization)
   • Customizable dashboard widgets
   • Export filtered reports to PDF/Excel with pre-configured templates

5. Custom Tabs / Industry Extensions
   • Framework for adding custom navigation tabs per business type
   • Configurable modules for industry-specific workflows (e.g., permit tracking
     for contractors, fleet management for service companies, equipment maintenance logs)
   • Plugin architecture allowing future vertical expansions without core code changes

6. Multi-User Account Management
   • Allow account owners to invite and add team members to their organization
   • Role-based permissions (Admin, Manager, Technician, Read-Only)
   • Shared access to customers, jobs, and company data within the same account
   • User activity logs and audit trails

Optional / Stretch Goals:
   • Stripe integration for user to receive online payments from customers
   • Estimate/quote builder with itemized materials and labor
   • Convert approved estimates directly into jobs
   • Invoice generation with payment tracking and overdue reminders

________________________________________________________________________________

TECHNICAL ENVIRONMENT

Layer                Technologies
-----------------    ------------------------------------------------------------
Frontend             React 19, TypeScript, Ant Design, TailwindCSS, React Query, Axios
Backend              Java 21, Spring Boot 2.7, Spring Security, JPA/Hibernate, Maven
Database             PostgreSQL
AI Integration       OpenAI API / Claude API (new development)
Cloud                Microsoft Azure Container Apps, Docker
APIs                 REST, JWT Authentication, Veryfi (OCR), SerpAPI, Stripe
Tools                Git/GitHub, VS Code, IntelliJ IDEA

________________________________________________________________________________

PRIMARY CONTACT

Mohammed Jouni
Founder, Rewixx
Email: Moe@rewixx.com
Phone: 313-349-8500

________________________________________________________________________________

University of Michigan-Dearborn — Senior Design Project Proposal
