import React, { useState, useEffect, useMemo } from "react";
import { audioPlayer } from "./audioPlayer.js";
import applauseFile from "./assets/audio/applause.mp3";
import laughterFile from "./assets/audio/laughter.mp3";
import useFetchWithInterval from "./hooks/useFetch";
// This object will be shared by client and server
const cheerCollection = {
  "clap": {
    "name" : "Applause",
    "file": applauseFile,
    "time_window": 10000,
    "trigger_count": 5,
    "scale": "linear"
  },
  "joy": {
    "name": "Laughter",
    "file": laughterFile,
    "time_window": 10000,
    "trigger_count": 1,
    "scale": "linear"
  }
};


const clamp = function (number, min, max) {
  return Math.min(Math.max(number, min), max);
};
const VOLUME_SCALE = 2;

const getVolume = (reaction, count = 0) => {
  if (cheerCollection[reaction]["trigger_count"] > count)
    return 0.0;
  //TODO: implement volume function, based on range_counts = [0,1000] (multiple claps by a person possible)
  switch (cheerCollection[reaction]["scale"]) {
    case "linear":
      return clamp(count, 0, VOLUME_SCALE) / VOLUME_SCALE;
    default:
      return 1.0;
  }
}

const processCheerCounts = (cheerCounts) => {
  const cheerVolumes = {};
  for (let reaction in cheerCollection) {
    cheerVolumes[reaction] = getVolume(reaction, cheerCounts[reaction]);
  }
  return cheerVolumes;
}

const Client = () => {
  const [cheers, updateCheers] = useState({});
  return "Client";
}

const cheerServer = {
  url: `https://cheers-bot.mindtickle.test/cheers`
}

const Player = ({ file, name, volume: volumeProp=50, loop = false }) => {
  const player = useMemo(()=>audioPlayer(document.body, file, !!loop), [file]);
  const [volume, updateVolume] = useState(volumeProp);
  
  useEffect(()=>{
    console.log(name, "New prop volume: ", volumeProp);
    updateVolume(volumeProp);
  }, [volumeProp]);

  useEffect(() => {
    const vol = clamp(volume, 0, 1);
    player.stop();
    player.setVolume(vol);
    player.play();
  }, [volume, player]);

  return (
    <div>
      <h3> {name} </h3>
      <input
        type="number"
        value={volume}
        onChange={e => {
          updateVolume(e.target.value);
        }}
      />
      <button
        onClick={() => {
          player.play();
        }}
      >
        Play
      </button>
      <button
        onClick={() => {
          player.pause();
        }}
      >
        Pause
      </button>
      <button
        onClick={() => {
          player.stop();
        }}
      >
        Stop
      </button>
    </div>
  );
};

export default function App() {
  const cheers = useFetchWithInterval(cheerServer.url, {}, 1000);
  if (!cheers.response) {
    return cheers.error ? (<div>Error!</div>): (<div>Loading...</div>);
  }

  console.log("Cheer stats: ", cheers.response);
  const cheerVolumes = processCheerCounts(cheers.response);

  return (
    <div className="App">
      <h1>Cheer Player</h1>
      <h4> Play multiple cheers simultaneously with volume controlled by your reactions!</h4>
      {Object.entries(cheerCollection).map(([reaction, config])=>{
        return (
          <Player key={reaction} volume={cheerVolumes[reaction]} name={config.name} file={config.file} />
        );
      })}
    </div>
  );
}
