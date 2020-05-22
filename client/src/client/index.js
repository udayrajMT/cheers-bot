import React, { useState, useEffect, useMemo } from "react";
import { audioPlayer } from "./audioPlayer.js";
import applauseFile from "./assets/audio/applause.mp3";
import applauseFile2 from "./assets/audio/applause4.mp3";
import cheerLongFile from "./assets/audio/cheer-long.mp3";
import laughterFile from "./assets/audio/crowd_laugh_1.wav";
import laughterFile2 from "./assets/audio/crowd_laugh_2.wav";
import useFetchWithInterval from "./hooks/useFetch";

// Max volume when total claps are equal to this scale
const VOLUME_SCALE = 100;
// This object will be shared by client and server
const cheerCollection = {
  "clap": {
    "Applause1": {
      "file": applauseFile,
      "trigger_count": 5,
      "restart_on_change": true,
      "scale": "exp",
      "volume_scale": VOLUME_SCALE,
    },
    "Applause2": {
      "file": applauseFile2,
      "trigger_count": 20,
      "restart_on_change": true,
      "scale": "cubic",
      "volume_scale": VOLUME_SCALE,
    }
    ,
    "Cheering1": {
      "file": cheerLongFile,
      "trigger_count": 30,
      "restart_on_change": false,
      "scale": "quad",
      "volume_scale": VOLUME_SCALE,
    }
  },
  "joy": {
    "Laughter1": {
      "file": laughterFile,
      "trigger_count": 1,
      "restart_on_change": true,
      "scale": "exponential",
      "volume_scale": VOLUME_SCALE,
    },
    "Laughter1": {
      "file": laughterFile2,
      "trigger_count": 5,
      "restart_on_change": true,
      "scale": "exponential",
      "volume_scale": VOLUME_SCALE,
    },
  }
};


const clamp = function (number, min, max) {
  return Math.min(Math.max(number, min), max);
};

const getVolume = (config, count = 0) => {
  const SCALE = config.volume_scale;
  const x = count / SCALE;
  if (config["trigger_count"] > count)
    return 0.0;
  //TODO: implement volume function, based on range_counts = [0,1000] (multiple claps by a person possible)
  switch (config["scale"]) {
    case "quad":
      return clamp(Math.sqrt(x), 0, 1);
    case "exp":
      const base = Math.E;
      const y = (Math.pow(base, x) - 1) / (base - 1)
      return clamp(y, 0, 1);
    case "linear":
    default:
      return clamp(x, 0, 1);
  }
}
const Client = () => {
  const [cheers, updateCheers] = useState({});
  return "Client";
}

const cheerServer = {
  url: `https://cheers-bot.mindtickle.test/cheers`
}

const Player = ({ file, name, config, volume: volumeProp = 50, loop = false }) => {
  const player = useMemo(() => audioPlayer(document.body, file, !!loop), [file]);
  const [volume, updateVolume] = useState(volumeProp);

  useEffect(() => {
    console.log(name, "New prop volume: ", volumeProp);
    updateVolume(volumeProp);
  }, [volumeProp]);

  useEffect(() => {
    if (!volume)return
    // const vol = clamp(volume, 0, 1);
    const vol = getVolume(config, parseInt(volume, 10));
    console.log("New volume:", volume, vol);
    if (vol == 0 || config.restart_on_change)
      player.stop();
    player.setVolume(vol);
    if (vol > 0)
      player.play();
  }, [volume, player]);

  return (
    <div>
      <h3> {name} [{config.trigger_count}]</h3>
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
      <h1>Cheer Player 🔊</h1>
      <h4>Give voice to your reactions 👏😂</h4>
      {Object.entries(cheerVolumes).map(([reaction, volumes]) =>
        Object.entries(volumes).map(([variation, volume]) => {
          const config = cheerCollection[reaction][variation];
          return (
            <Player key={`${reaction}.${variation}`} volume={volume} config={config} name={variation} file={config.file} />
          );
        }))}
    </div>
  );
}
