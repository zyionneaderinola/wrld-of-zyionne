const WRLD_CHARACTER_SET = [
  // Uppercase
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
  // Lowercase
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
  // Numbers
  '0','1','2','3','4','5','6','7','8','9',
  // Punctuation
  '.','!','?',',',':',';','-','\'','"','(',')'
]

module.exports = mongoose.model('CustomFont', CustomFontSchema)
module.exports.WRLD_CHARACTER_SET = WRLD_CHARACTER_SET