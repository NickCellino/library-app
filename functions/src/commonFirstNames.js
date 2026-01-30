/**
 * Common first names for author detection
 * Source: US Census / SSA data via namecensus.com
 */

export const COMMON_FIRST_NAMES = new Set([
  // Male names (top 100)
  'james', 'robert', 'john', 'michael', 'david', 'william', 'richard', 'joseph',
  'thomas', 'christopher', 'charles', 'daniel', 'matthew', 'anthony', 'mark',
  'donald', 'steven', 'andrew', 'paul', 'joshua', 'kenneth', 'kevin', 'brian',
  'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey', 'ryan', 'jacob',
  'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
  'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'patrick', 'frank',
  'raymond', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam',
  'nathan', 'henry', 'zachary', 'douglas', 'peter', 'kyle', 'noah', 'ethan',
  'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'sean', 'austin',
  'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse',
  'bryan', 'billy', 'bruce', 'gabriel', 'joe', 'logan', 'alan', 'juan', 'albert',
  'willie', 'elijah', 'wayne', 'randy', 'vincent', 'mason', 'roy', 'ralph',
  'bobby', 'russell', 'bradley', 'philip', 'eugene',

  // Female names (top 100)
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan',
  'jessica', 'sarah', 'karen', 'lisa', 'nancy', 'betty', 'sandra', 'margaret',
  'ashley', 'kimberly', 'emily', 'donna', 'michelle', 'carol', 'amanda',
  'melissa', 'deborah', 'stephanie', 'dorothy', 'rebecca', 'sharon', 'laura',
  'cynthia', 'amy', 'kathleen', 'angela', 'shirley', 'brenda', 'emma', 'anna',
  'pamela', 'nicole', 'samantha', 'katherine', 'christine', 'helen', 'debra',
  'rachel', 'carolyn', 'janet', 'maria', 'catherine', 'heather', 'diane',
  'olivia', 'julie', 'joyce', 'victoria', 'ruth', 'virginia', 'lauren', 'kelly',
  'christina', 'joan', 'evelyn', 'judith', 'andrea', 'hannah', 'cheryl', 'megan',
  'jacqueline', 'martha', 'madison', 'teresa', 'gloria', 'janice', 'sara', 'ann',
  'abigail', 'kathryn', 'sophia', 'frances', 'jean', 'judy', 'alice', 'isabella',
  'julia', 'grace', 'denise', 'amber', 'beverly', 'danielle', 'marilyn',
  'charlotte', 'theresa', 'natalie', 'diana', 'brittany', 'doris', 'kayla',
  'alexis', 'lori', 'marie',

  // Additional common author first names (international)
  'agatha', 'virginia', 'ernest', 'franz', 'leo', 'fyodor', 'oscar', 'edgar',
  'jules', 'victor', 'alexandre', 'charlotte', 'jane', 'emily', 'anne', 'sylvia',
  'harper', 'toni', 'maya', 'zora', 'ursula', 'octavia', 'margaret', 'doris',
  'alice', 'shirley', 'flannery', 'carson', 'eudora', 'willa', 'edith', 'kate',
  'virginia', 'dorothy', 'pearl', 'daphne', 'iris', 'muriel', 'agatha', 'ngaio',
  'dorothy', 'p.d.', 'ruth', 'sue', 'minette', 'val', 'ann', 'martha', 'sarah',

  // Common German/European names (for authors like Heinrich von Kleist)
  'heinrich', 'johann', 'wolfgang', 'friedrich', 'ludwig', 'franz', 'hermann',
  'hans', 'karl', 'ernst', 'wilhelm', 'gottfried', 'rainer', 'stefan', 'thomas',
  'günter', 'bertolt', 'max', 'georg', 'erich', 'albert', 'sigmund', 'carl',

  // Common British names
  'nigel', 'graham', 'colin', 'ian', 'hugh', 'clive', 'trevor', 'derek', 'barry',
  'geoffrey', 'neville', 'reginald', 'alistair', 'hamish', 'angus', 'rupert',

  // Diminutives and variants
  'mike', 'chris', 'dan', 'matt', 'tony', 'steve', 'andy', 'josh', 'ken', 'tim',
  'tom', 'bob', 'bill', 'rick', 'jim', 'joe', 'sam', 'ben', 'nick', 'alex', 'pat',
  'kate', 'liz', 'beth', 'sue', 'jen', 'meg', 'kim', 'deb', 'becky', 'vicky',

  // Additional names found in testing
  'craig', 'morris', 'riley', 'becky', 'hannah', 'dean', 'lee', 'ray', 'neil',
  'glen', 'ross', 'lloyd', 'cecil', 'clyde', 'lynn', 'dale', 'perry', 'cody',
  'chad', 'wade', 'brett', 'blake', 'drew', 'troy', 'seth', 'ivan', 'omar',
  'neil', 'kurt', 'leon', 'luis', 'carl', 'earl', 'gene', 'joel', 'lyle', 'marc',
  'neal', 'todd', 'troy', 'dana', 'jill', 'tina', 'gail', 'vera', 'faye', 'nina',
  'rosa', 'alma', 'ida', 'ivy', 'ada', 'ora', 'eva', 'ava', 'mia', 'zoe'
])

/**
 * Check if a word is a common first name
 * @param {string} word - Word to check
 * @returns {boolean}
 */
export function isCommonFirstName(word) {
  return COMMON_FIRST_NAMES.has(word.toLowerCase().replace(/[.,]/g, ''))
}
