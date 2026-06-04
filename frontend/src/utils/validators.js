/**
 * 校验手机号 (11位中国大陆手机号)
 */
export function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 校验密码 (6-20位，字母+数字)
 */
export function isValidPassword(password) {
  if (!password || password.length < 6 || password.length > 20) return false;
  return /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * 校验身份证号 (18位)
 */
export function isValidIdCard(idCard) {
  if (!idCard || idCard.length !== 18) return false;
  if (!/^\d{17}[\dXx]$/.test(idCard)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i];
  }
  return checkCodes[sum % 11] === idCard[17].toUpperCase();
}

/**
 * 校验姓名 (2-20个中文字符)
 */
export function isValidRealName(name) {
  return /^[一-龥]{2,20}$/.test(name);
}

/**
 * 校验用户名 (4-20位字母数字)
 */
export function isValidUsername(username) {
  return /^[a-zA-Z0-9]{4,20}$/.test(username);
}
