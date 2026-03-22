# Barangay E-Serbisyo Client

This is the redesigned frontend client for the Barangay E-Serbisyo system, built to match the comprehensive server API endpoints.

## Features

### Public Portal
- **Announcements**: View public announcements with pinning support
- **Document Types**: Browse available document types with requirements and fees
- **QR Verification**: Verify document authenticity using QR codes
- **System Settings**: View public system configuration

### Resident Portal
- **Registration**: Secure resident registration with validation
- **Login**: JWT-based authentication with role management
- **Dashboard**: View request status and history
- **Document Requests**: Submit document requests with file uploads
- **Transaction History**: Track payment and document status

### Admin Portal
- **Document Types Management**: Create, edit, and configure document types
- **Request Processing**: Verify, process payments, and issue documents
- **Payment Processing**: Handle payments, exemptions, and OR numbers

## Technology Stack

- **React 19** - Frontend framework
- **Material-UI (MUI)** - UI component library
- **React Router v7** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and development server

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── PDFGenerator.jsx # PDF generation component
│   └── RequestModal.jsx # Request modal (existing)
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication context
├── hooks/             # Custom hooks
│   └── useFileUpload.js # File upload hook
├── layouts/           # Layout components
│   ├── AdminLayout.jsx
│   ├── PublicLayout.jsx
│   └── ResidentLayout.jsx
├── pages/             # Page components
│   ├── Announcements.jsx
│   ├── DocumentTypes.jsx
│   ├── QRVerification.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── RequestDocument.jsx (enhanced)
│   ├── ResidentDashboard.jsx
│   ├── TransactionHistory.jsx
│   └── admin/         # Admin pages
│       ├── AdminAnnouncements.jsx
│       ├── AdminDashboard.jsx
│       ├── AdminDocumentTypes.jsx
│       ├── AdminLogin.jsx
│       ├── AdminOfficials.jsx
│       ├── AdminPayments.jsx
│       ├── AdminRequest.jsx
│       ├── AdminResidents.jsx
│       ├── AdminSettings.jsx
│       └── AdminAuditLogs.jsx
├── services/          # API services
│   └── api.js         # Centralized API endpoints
└── App.jsx            # Main application component
```

## API Integration

The client is fully integrated with the server API endpoints:

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/resident/register` - Resident registration
- `POST /api/v1/setup/superadmin` - Super admin setup

### Public Endpoints
- `GET /api/v1/public/announcements` - Get announcements
- `GET /api/v1/public/document-types` - Get document types
- `GET /api/v1/public/settings` - Get system settings
- `GET /api/v1/public/verify/:qrHash` - QR verification

### Resident Endpoints
- `GET /api/v1/requests/resident/me` - Get resident requests
- `POST /api/v1/requests` - Submit document request
- `PUT /api/v1/residents/me/id-proof` - Update ID proof

### Admin Endpoints
- `GET /api/v1/admin/settings` - Get system settings
- `PUT /api/v1/admin/settings/:setting_key` - Update settings
- `GET /api/v1/requests/pending` - Get pending requests
- `PUT /api/v1/requests/:request_id/verify` - Verify requests
- `POST /api/v1/payments` - Process payments
- `PUT /api/v1/requests/:request_id/ready` - Mark ready for pickup
- `PUT /api/v1/requests/:request_id/issue` - Issue documents
- `GET /api/v1/requests/:request_id/generate-pdf` - Generate PDFs

## File Handling

The client supports secure file handling:
- **File Upload**: Encrypted file uploads via `/api/v1/files/upload`
- **File Retrieval**: Secure file downloads with proper authentication
- **File Validation**: Client-side validation for size and type
- **PDF Generation**: Server-side PDF generation with digital signatures

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Different permissions for Residents, Officials, and Super Admin
- **Input Validation**: Client-side validation with server-side verification
- **Secure File Handling**: Encrypted file uploads and downloads
- **Audit Logging**: Comprehensive audit trail for admin actions

## Installation

1. Navigate to the client directory:
   ```bash
   cd brgymalaya_e-serbisyo/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Configuration

The client is configured via environment variables in `.env`:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:5000

# Feature Flags
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_ONLINE_PAYMENT=false

# Network Context
VITE_NETWORK_CONTEXT=LAN
```

## Usage

### Public Portal
- Visit `http://localhost:5173/` for announcements
- Visit `http://localhost:5173/document-types` for document types
- Visit `http://localhost:5173/verify/:qrHash` for QR verification

### Resident Portal
1. Register at `http://localhost:5173/register`
2. Login at `http://localhost:5173/login`
3. Access dashboard at `http://localhost:5173/dashboard`
4. Submit requests at `http://localhost:5173/request`

### Admin Portal
1. Login at `http://localhost:5173/admin/login`
2. Access admin dashboard at `http://localhost:5173/admin/dashboard`
3. Manage requests at `http://localhost:5173/admin/requests`
4. Process payments at `http://localhost:5173/admin/payments`

## Development

### Adding New Features

1. **API Services**: Add new endpoints to `src/services/api.js`
2. **Components**: Create reusable components in `src/components/`
3. **Pages**: Add new pages in `src/pages/` or `src/pages/admin/`
4. **Routing**: Update routes in `src/App.jsx`
5. **Authentication**: Use `useAuth()` hook for protected routes

### File Upload

Use the `useFileUpload` hook for file operations:

```javascript
import { useFileUpload } from '../hooks/useFileUpload';

function MyComponent() {
  const { uploading, uploadError, uploadedFile, uploadFile } = useFileUpload();

  const handleFileUpload = async (file) => {
    try {
      const result = await uploadFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
      });
      console.log('File uploaded:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
}
```

### Authentication

Use the `useAuth` hook for authentication:

```javascript
import { useAuth } from '../contexts/AuthContext';

function ProtectedComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the server is running and CORS is enabled
2. **Authentication Errors**: Check JWT tokens and user roles
3. **File Upload Errors**: Verify file size and type restrictions
4. **API Connection**: Check the API base URL in `.env`

### Server Requirements

Ensure the server is running on port 5000 with all endpoints available. Refer to the server documentation for setup instructions.

## License

This project is part of the Barangay E-Serbisyo system. Please refer to the main project license.