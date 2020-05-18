import React, { useState, useEffect } from "react";
import useInterval from "./useInterval";

// https://scotch.io/tutorials/create-a-custom-usefetch-react-hook
const useFetchWithInterval = (url, options, interval=1000) => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  useInterval(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(url, options);
        const json = await res.json();
        setResponse(json);
      } catch (error) {
        setError(error);
      }
    };
    if(!error)
      fetchData();
  }, interval);
  return { response, error };
};

export default useFetchWithInterval;