const dns = require('dns');
const path = require('path');
const fs = require('fs');

const disposableDomains = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'disposableDomains.json'), 'utf-8')
);
const disposableSet = new Set(disposableDomains);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailFormat(email) {
  return EMAIL_REGEX.test(email);
}

function isDisposableEmail(domain) {
  return disposableSet.has(domain.toLowerCase());
}

async function checkDomainMx(domain) {
  const records = await dns.promises.resolveMx(domain);
  return records && records.length > 0;
}

module.exports = { validateEmailFormat, isDisposableEmail, checkDomainMx };
