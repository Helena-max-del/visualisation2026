export async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Failed to load: ${path}`)
  return response.json()
}

export async function loadText(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Failed to load: ${path}`)
  return response.text()
}
