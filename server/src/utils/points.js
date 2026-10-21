import { User } from '../models.js';
/** Atomic add/subtract, never below 0. */
export const addPoints = (userId, delta) =>
  User.updateOne({ _id: userId }, [{ $set: { points: { $max: [0, { $add: ['$points', delta] }] } } }]);
