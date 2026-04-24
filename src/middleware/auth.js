const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function auth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    let payload;
    try {
      payload = verifyToken(token);
    } catch (_e) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

    req.user = user;
    req.auth = payload;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
