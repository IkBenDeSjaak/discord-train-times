import 'dotenv/config';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';
import format from 'date-fns-tz/format';

export function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use node-fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭', '😄', '😌', '🤓', '😎', '😤', '🤖', '😶‍🌫️', '🌏', '📸', '💿', '👋', '🌊', '✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export async function getDeparturesFromStationToStation(fromStation, toStation) {
  const allDeparturesFromStation = await fetchDepartures(fromStation);

  const departuresFromStationToStation = allDeparturesFromStation[toStation]

  return departuresFromStationToStation
}

async function fetchDepartures(stationCode) {
  const url = `https://gateway.apiportal.ns.nl/reisinformatie-api/api/v2/departures?station=` + stationCode;

  const res = await fetch(url, {
    headers: {
      'Host': 'gateway.apiportal.ns.nl',
      'Ocp-Apim-Subscription-Key': '04f898885e074855b13d732e47683d3d',
      'Content-Type': 'application/json',
    }
  });

  if (res.ok) {
    const data = await res.json();

    const departures = {}

    for (const departure of data.payload.departures) {
      if (departures[departure.direction] === undefined) {
        departures[departure.direction] = []
      }

      departures[departure.direction].push(convertDateToTimeString(departure.plannedDateTime))
    }

    return departures;
  }
}

const convertDateToTimeString = (date) => {
  const dateObject = new Date(date);
  //dateObject.setTime(dateObject.getTime() + (2 * 60 * 60 * 1000))

  return format(dateObject, 'HH:mm')
}