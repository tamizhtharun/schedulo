  // Role-based authorization middleware for session-based authentication

function authorizeRoles(...roles) {
  return (req, res, next) => {
    console.log('Authorization Check:', {
      requestPath: req.path,
      requestMethod: req.method,
      requiredRoles: roles,
      sessionUser: req.session.user,
      sessionUserRoleType: typeof req.session.user?.role,
      sessionUserRoleValue: req.session.user?.role
    });

    // Check if session exists
    if (!req.session || !req.session.user) {
      console.error('No session found');
      return res.status(403).json({ 
        message: 'Forbidden: No active session', 
        details: { requiredRoles: roles } 
      });
    }

    const userRole = req.session.user.role;
    
    // Check if user role exists
    if (!userRole) {
      console.error('User role not found', { user: req.session.user });
      return res.status(403).json({ 
        message: 'Forbidden: User role not found', 
        details: { requiredRoles: roles } 
      });
    }

    // Support both string and array roles with case-insensitive comparison
    const lowerRoles = roles.map(r => r.toLowerCase());
    let authorized = false;
    if (Array.isArray(userRole)) {
      authorized = userRole.some(r => lowerRoles.includes(r.toLowerCase()));
    } else {
      authorized = lowerRoles.includes(userRole.toLowerCase());
    }

    if (!authorized) {
      console.error('Authorization Failed', {
        userRole,
        requiredRoles: roles
      });
      return res.status(403).json({ 
        message: 'Forbidden: insufficient permissions', 
        details: { 
          userRole, 
          requiredRoles: roles 
        } 
      });
    }

    console.log('Authorization Successful', {
      userRole,
      requiredRoles: roles
    });
    next();
  };
}

module.exports = { authorizeRoles };
