// Generate faculty ID in format YYxxxxxx 
const generateFacultyId = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `${year}${random}`;
};

// Generate 6 character password with letters and numbers
const generatePassword = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
};

module.exports = { generateFacultyId, generatePassword };