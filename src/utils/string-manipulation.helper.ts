//create a function that receives a string and capitalize the first letter of each word
export function capitalize(str: string) {
  return str
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
