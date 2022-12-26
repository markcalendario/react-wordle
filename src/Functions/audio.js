export default function playSound(sound, loop) {
  let audio = new Audio(sound)
  loop ? audio.loop = true : audio.loop = false
  audio.play()
}