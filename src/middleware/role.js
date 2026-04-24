const ApiError = require('../utils/ApiError');

function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!allowed.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient role'));
    }
    next();
  };
}

module.exports = requireRole;
