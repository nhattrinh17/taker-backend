/**
 * Generate 4 digit OTP
 * @returns 4 digit number
 */
export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}

/**
 * Make phone number with country code
 * @param phone
 * @returns phone number with country code
 */
export function makePhoneNumber(phone: string) {
  if (phone.startsWith('0')) {
    return `84${phone.slice(1)}`;
  }
  return phone;
}

/**
 * Make otp to text
 * @param otp
 * @returns text of otp
 */
export function otpToText(otp: number): string {
  const otpString = otp.toString();
  let result = '';
  for (let i = 0; i < otpString.length; i++) {
    result += otpString[i];
    if (i !== otpString.length - 1) {
      result += '. ';
    }
  }
  return result;
}

/**
 * Function to verify phone number in Vietnam
 * @param phone
 * @returns boolean
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
  return phoneRegex.test(phone);
}
