import { soundOptions, DEFAULT_SOUND, SOUND_VOLUME } from '../config/soundConfig.js'

const SOUND_ENABLED_KEY = 'library_sound_enabled'
const SOUND_TYPE_KEY = 'library_sound_type'

let audioContext = null
let currentSound = null

export function loadSoundPreferences() {
  const enabled = localStorage.getItem(SOUND_ENABLED_KEY)
  const type = localStorage.getItem(SOUND_TYPE_KEY)

  return {
    enabled: enabled === null ? true : enabled === 'true',
    type: type || DEFAULT_SOUND
  }
}

export function saveSoundPreferences(enabled, type) {
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
  if (type) {
    localStorage.setItem(SOUND_TYPE_KEY, type)
  }
}

export function getSoundUrl(soundType) {
  return soundOptions[soundType]?.file || soundOptions[DEFAULT_SOUND].file
}

export function playSound(soundType) {
  const preferences = loadSoundPreferences()

  if (!preferences.enabled) {
    return
  }

  try {
    const soundUrl = getSoundUrl(preferences.type)

    if (currentSound) {
      currentSound.pause()
      currentSound.currentTime = 0
    }

    currentSound = new Audio(soundUrl)
    currentSound.volume = SOUND_VOLUME
    currentSound.play().catch(error => {
      console.error('[Sound] Playback failed:', error)
    })
  } catch (error) {
    console.error('[Sound] Failed to play:', error)
  }
}

export function playScanSound() {
  playSound('scan')
}
