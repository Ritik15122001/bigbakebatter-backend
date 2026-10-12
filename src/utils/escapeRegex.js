/** Escapes user input before it is used inside a MongoDB $regex. */
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
