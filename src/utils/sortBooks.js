export const getLastName = (author) => {
  const parts = author.trim().split(/\s+/)
  return parts[parts.length - 1]
}

export const sortAuthors = (authors) => {
  return authors.sort((a, b) => {
    const lastNameA = getLastName(a).toLowerCase()
    const lastNameB = getLastName(b).toLowerCase()
    return lastNameA.localeCompare(lastNameB)
  })
}

export const getAvailableLetters = (sortedAuthors) => {
  const letters = new Set()
  sortedAuthors.forEach(author => {
    const lastName = getLastName(author)
    const firstChar = lastName[0]?.toUpperCase() || ''
    if (/[A-Z]/.test(firstChar)) {
      letters.add(firstChar)
    } else {
      letters.add('#')
    }
  })
  return letters
}

export const findAuthorForLetter = (letter, sortedAuthors) => {
  if (letter === '#') {
    return sortedAuthors.find(a => !/^[A-Z]/i.test(getLastName(a)))
  }
  return sortedAuthors.find(a => getLastName(a).toUpperCase().startsWith(letter))
}
