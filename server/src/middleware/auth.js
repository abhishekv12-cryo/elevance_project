import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models.js';
import { ah } from '../utils/ah.js';

export const optionalAuth = ah(async (req, _res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try { req.user = await User.findById(jwt.verify(token, config.jwtSecret).id); } catch { /* invalid token */ }
  }
  next();
});
export const auth = [optionalAuth, (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'Please log in first.' })];
