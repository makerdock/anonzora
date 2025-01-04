export function encodeJson(obj: any): string {
  if (Array.isArray(obj)) {
    return '[' + obj.map(encodeJson).join(',') + ']'
  }

  if (typeof obj === 'object' && obj !== null) {
    return (
      '{' +
      Object.keys(obj)
        .sort()
        .map((key) => `"${key}":${encodeJson(obj[key])}`)
        .join(',') +
      '}'
    )
  }

  return JSON.stringify(obj)
}
