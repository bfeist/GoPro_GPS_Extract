export const delayMillis = (delayMs: number): Promise<void> => new Promise(resolve => setTimeout(resolve, delayMs));

export const greet = (name: string): string => `Hello ${name}`

export const extractGPS = async (): Promise<boolean> => {
  console.log('extracting GPS')

  console.log('done')
  return true
}