
const ProtectedRoute = ({ children, allowedRoles, userRole }) => {
  // Check if the current user's role is in the list of allowed roles
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-10 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">You do not have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;