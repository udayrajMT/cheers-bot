import React, { useState, useEffect, useMemo } from "react";
import { audioPlayer } from "./audioPlayer.js";
import applauseFile from "./assets/audio/applause.mp3";
import laughterFile from "./assets/audio/laughter.mp3";
import useFetchWithInterval from "./hooks/useFetch";
// This object will be shared by client and server
const cheerCollection = {
  "clap": {
    "Applause1": {
      "name": "Applause",
      "file": applauseFile,
      "trigger_count": 5,
      "scale": "linear"
    },
    "Applause2": {
      "name": "Applause",
      "file": applauseFile,
      "trigger_count": 20,
      "scale": "linear"
    }
  },
  "joy": {
    "Laughter1": {
      "file": laughterFile,
      "trigger_count": 1,
      "scale": "linear"
    },
  }
};


const clamp = function (number, min, max) {
  return Math.min(Math.max(number, min), max);
};
// Max volume when total claps are equal to this scale
const VOLUME_SCALE = 100;

const getVolume = (config, count = 0) => {
  if (config["trigger_count"] > count)
    return 0.0;
  //TODO: implement volume function, based on range_counts = [0,1000] (multiple claps by a person possible)
  switch (config["scale"]) {
    case "linear":
      return clamp(count, 0, VOLUME_SCALE) / VOLUME_SCALE;
    case "quad":
      const QUAD_SCALE = Math.pow(VOLUME_SCALE, 2);
      return clamp(Math.pow(count, 2), 0, QUAD_SCALE) / QUAD_SCALE;
    case "cubic":
      const CUBIC_SCALE = Math.pow(VOLUME_SCALE, 3);
      return clamp(Math.pow(count, 3), 0, CUBIC_SCALE) / CUBIC_SCALE;
    case "exp":
      const EXP_SCALE = Math.pow(2, VOLUME_SCALE);
      return clamp(Math.pow(2, count), 0, EXP_SCALE) / EXP_SCALE;
    default:
      return 1.0;
  }
}
const Client = () => {
  const [cheers, updateCheers] = useState({});
  return "Client";
}

const cheerServer = {
  url: `https://cheers-bot.mindtickle.test/cheers`
}

const Player = ({ file, name, reaction, variation, volume: volumeProp = 50, loop = false }) => {
  const player = useMemo(() => audioPlayer(document.body, file, !!loop), [file]);
  const [volume, updateVolume] = useState(volumeProp);

  useEffect(() => {
    console.log(name, "New prop volume: ", volumeProp);
    updateVolume(volumeProp);
  }, [volumeProp]);

  useEffect(() => {
    // const vol = clamp(volume, 0, 1);
    const vol = getVolume(cheerCollection[reaction][variation], parseInt(volume, 10));
    console.log("New volume:", volume, vol);
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

const processCheerCounts = (cheerCounts) => {
  const cheerVolumes = {};
  for (let reaction in cheerCounts) {
    cheerVolumes[reaction] = {};
    for (let variation in cheerCollection[reaction]) {
      cheerVolumes[reaction][variation] = getVolume(cheerCollection[reaction][variation], cheerCounts[reaction]);
    }
  }
  return cheerVolumes;
}

export default function App() {
  const cheers = useFetchWithInterval(cheerServer.url, {}, 1000);
  if (!cheers.response) {
    return cheers.error ? (<div>Error!</div>) : (<div>Loading...</div>);
  }

  console.log("Cheer stats: ", cheers.response);
  const cheerVolumes = processCheerCounts(cheers.response);

  return (
    <div className="App">
      <h1>Cheer Player</h1>
      <h4> Play multiple cheers simultaneously with volume controlled by your reactions!</h4>
      {Object.entries(cheerVolumes).map(([reaction, volumes]) =>
        Object.entries(volumes).map(([variation, volume]) => {
          const config = cheerCollection[reaction][variation];
          return (
            <Player key={`${reaction}.${variation}`} volume={volume} reaction={reaction} variation={variation} name={variation} file={config.file} />
          );
        }))}
    </div>
  );
}
