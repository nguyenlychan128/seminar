'use strict';

function validateUserDeactivate(req, res, next) {
  const { action } = req.body;

  if (!action) {
    return res.status(400).json({
      message: "'action' field is required",
    });
  }

  const validActions = ['deactivate', 'reactivate'];
  if (!validActions.includes(action)) {
    return res.status(400).json({
      message: "Invalid action. Must be 'deactivate' or 'reactivate'",
    });
  }

  next();
}

module.exports = {
  validateUserDeactivate,
};
