'use strict';

class DatabaseError extends Error {
  constructor(message) {
    super(message || 'Database operation failed');
    this.name = 'DatabaseError';
    this.status = 500;
  }
}

module.exports = DatabaseError;
