'use strict';

class DuplicateSessionError extends Error {
  constructor(message) {
    super(message || 'Duplicate session - already logged for this date/plan/week/day');
    this.name = 'DuplicateSessionError';
    this.status = 409;
  }
}

module.exports = DuplicateSessionError;
