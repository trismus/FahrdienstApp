import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user has one of the specified roles
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId || !req.session.role) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.session.role;

    // Admin always has access
    if (userRole === 'admin') {
      return next();
    }

    // Check if user has one of the required roles
    if (roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};

// Convenience middleware for specific roles
export const isAdmin = hasRole(['admin']);

export const isOperator = hasRole(['dispatcher', 'admin']);

export const isDriver = hasRole(['driver', 'admin']);

// Middleware for routes that require either being the user themselves or an admin
export const isSelfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId || !req.session.role) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = parseInt(req.params.id);
  const sessionUserId = req.session.userId;
  const userRole = req.session.role;

  if (userRole === 'admin' || userId === sessionUserId) {
    return next();
  }

  return res.status(403).json({ error: 'Insufficient permissions' });
};
