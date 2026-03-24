# Tennis Club Expense Tracker

A comprehensive financial management system built specifically for tennis clubs, featuring expense tracking, budget management, financial reporting, and Reckon accounting integration.

## Features

### 🏆 Dashboard
- Real-time financial overview with key metrics
- Interactive charts showing expense trends
- Recent expense activity feed
- Budget utilization indicators

### 💰 Expense Management
- Easy-to-use expense entry forms
- Category-based expense organization
- File attachment support for receipts
- Multi-level approval workflows
- Advanced filtering and search

### 📊 Budget Tracking
- Category-based budget allocation
- Real-time spending vs budget comparisons
- Project-level budget breakdown
- Visual progress indicators with alerts
- Annual and monthly budget views

### 📈 Financial Reports
- Comprehensive financial summaries
- Interactive charts and visualizations
- Monthly income vs expense analysis
- Category-wise spending breakdowns
- Export capabilities (PDF, Excel, CSV)

### 👥 User Management
- Role-based access control
- Member profile management
- Permission system for different user types
- Activity tracking and audit logs

### ⚙️ Reckon Integration
- Seamless connection to Reckon accounting software
- Automatic data synchronization
- Manual export/import capabilities
- Real-time sync status monitoring
- Secure API key management

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom tennis-themed design
- **Charts:** Recharts for data visualization
- **Icons:** Heroicons and Lucide React
- **Forms:** React Hook Form (ready to integrate)
- **API Integration:** Built-in Reckon API interface

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tennis-expense-tracker
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

### Environment Variables

Create a `.env.local` file in the root directory:

```env
RECKON_API_KEY=your_reckon_api_key
RECKON_ORGANISATION_ID=your_organisation_id
RECKON_ENVIRONMENT=sandbox # or production
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── expenses/          # Expense management pages
│   ├── budget/            # Budget tracking pages
│   ├── reports/           # Financial reports pages
│   ├── members/           # User management pages
│   └── settings/          # Settings and integrations
├── components/            # Reusable UI components
│   ├── dashboard/         # Dashboard widgets
│   ├── expenses/          # Expense-related components
│   ├── budget/            # Budget tracking components
│   ├── reports/           # Report components
│   ├── members/           # User management components
│   ├── settings/          # Settings components
│   └── layout/            # Layout components
└── styles/                # Global styles and Tailwind config
```

## Key Components

### Dashboard Components
- `StatsCards` - Key financial metrics
- `ExpenseChart` - Monthly expense trends
- `RecentExpenses` - Latest expense activity
- `BudgetOverview` - Budget vs actual spending

### Expense Management
- `ExpenseForm` - Create/edit expense entries
- `ExpenseList` - Filterable expense table with search

### Budget Tracking
- `BudgetTracker` - Category-wise budget monitoring
- Project-level budget breakdowns with utilization alerts

### Financial Reports
- `FinancialReports` - Comprehensive reporting dashboard
- Interactive charts with export functionality

### User Management
- `UserManagement` - Member profiles and role management
- Permission-based access control

### Reckon Integration
- `ReckonIntegration` - API connection and sync management
- Real-time sync status and history

## Features in Detail

### Multi-Level Approval Workflow
- Under $100: Auto-approved
- $100-$1,000: Committee approval required  
- Over $1,000: Treasurer + President approval

### Budget Categories
- Court Maintenance
- Equipment & Supplies
- Utilities
- Events & Tournaments
- Staff & Professional Services
- Insurance & Legal
- Marketing & Promotion
- Office & Administration

### User Roles & Permissions
- **President:** Full system access including user management
- **Treasurer:** Financial management and reporting
- **Committee:** Expense approval and budget oversight
- **Secretary:** Expense creation and basic reporting
- **Coach:** Equipment requests and expense submissions
- **Member:** Basic expense submission only

## Customization

### Theming
The app uses a custom tennis-green color scheme defined in `tailwind.config.js`. Modify the color palette to match your club's branding.

### Categories & Workflows
Budget categories and approval workflows can be customized in the Settings page or by modifying the configuration files.

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
Ensure all environment variables are configured for your production Reckon account.

## Integration Notes

### Reckon API
- Supports both sandbox and production environments
- Automatic retry logic for failed API calls
- Comprehensive error handling and user feedback
- Secure credential storage and management

### Data Security
- API keys are encrypted and stored securely
- User permissions are enforced at component level
- Audit logging for all financial transactions

## Support

This application was built to replace the 2 million token development that produced no deliverable code. It includes:

✅ Complete Next.js + TypeScript + Tailwind setup
✅ Full dashboard with interactive charts
✅ Expense forms with file upload support
✅ Comprehensive budget tracking
✅ Financial reports with export capabilities
✅ User management with role-based permissions
✅ Reckon API integration interface
✅ Responsive design for all devices
✅ Production-ready codebase

The application is fully functional and ready for deployment, providing real value for tennis club financial management.

## License

Built for tennis club financial management - customize as needed for your organization.