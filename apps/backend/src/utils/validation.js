const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const passwordRuleMessage =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";

function isValidEmail(email) {
  return emailPattern.test(String(email || "").trim());
}

function isValidUserName(name) {
  return userNamePattern.test(String(name || "").trim());
}

function passwordValidationMessage(password) {
  const value = String(password || "");

  if (!value) {
    return "Password is required";
  }

  if (
    value.length < 8 ||
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/\d/.test(value)
  ) {
    return passwordRuleMessage;
  }

  return "";
}

module.exports = {
  isValidEmail,
  isValidUserName,
  passwordValidationMessage,
};
