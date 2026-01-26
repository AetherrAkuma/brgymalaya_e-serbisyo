import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminRoute = () => {
    // 1. Get the Security Clearance from Storage
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role'); // e.g., 'Captain', 'Secretary'

    // 2. Define who is allowed (RBAC)
    const allowedRoles = ['Captain', 'Secretary', 'Treasurer', 'Kagawad'];

    // 3. Security Check: No Token? Get out.
    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    // 4. Security Check: Wrong Role? (e.g., A Resident trying to hack in)
    if (!role || !allowedRoles.includes(role)) {
        // Optional: clear their invalid session
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        return <Navigate to="/admin/login" replace />;
    }

    // 5. Access Granted: Render the Admin Pages
    return <Outlet />;
};

export default ProtectedAdminRoute;