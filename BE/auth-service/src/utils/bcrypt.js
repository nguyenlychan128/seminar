const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}

async function comparePassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
