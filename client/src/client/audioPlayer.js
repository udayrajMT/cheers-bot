export const audioPlayer = (wrapper, audioPath, loop = false) => {
  const audioElement = new Audio(audioPath);
  // insert only once
  // if (wrapper.querySelectorAll(`audio[src="${audioPath}"]`).length > 0) {
  // }

  audioElement.loop = loop;
  wrapper.appendChild(audioElement);

  const play = () => {
    audioElement.currentTime = 0;
    audioElement.play();
  };

  const stop = () => {
    audioElement.currentTime = 0;
    audioElement.pause();
  };
  const pause = () => {
    audioElement.pause();
  };

  const setVolume = (volume = 0.5) => {
    audioElement.volume = volume;
  };

  const volume = () => {
    return audioElement.volume;
  };
  const time = () => {
    return audioElement.currentTime;
  };

  return { play, stop, pause, time, volume, setVolume };
};
