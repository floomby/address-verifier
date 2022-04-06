import https from "https";
import fs from "fs";
import express from "express";
import Web3 from "web3";
import cors from "cors";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import assert from "assert";
import path from "path";
import { Client, Intents } from "discord.js";

import { discordKey, isDev, dburl, httpsPort, url } from "./config.js";
import { WalletsModel, LinkUsedModel } from "./dataModel.js";

// Harmony testnet, web3 will not work without a provider set.
const web3 = new Web3("https://api.s0.b.hmny.io/");

let credentials;
credentials = {};

if (isDev) {
  credentials.key = fs.readFileSync("./sslcert/cert.key", "utf8");
  credentials.cert = fs.readFileSync("./sslcert/cert.pem", "utf8");
} else {
  credentials.key = fs.readFileSync(
    "/etc/letsencrypt/live/discord-bot.floomby.us/privkey.pem",
    "utf8"
  );
  credentials.cert = fs.readFileSync(
    "/etc/letsencrypt/live/discord-bot.floomby.us/cert.pem",
    "utf8"
  );
  credentials.ca = fs.readFileSync(
    "/etc/letsencrypt/live/discord-bot.floomby.us/chain.pem",
    "utf8"
  );
}

const addWalletAddress = async (discordUid, address) => {
  const doc = await WalletsModel.findOne({ discordUid });
  if (doc?._doc.addresses.includes(address)) {
    return { success: false };
  }
  await WalletsModel.findOneAndUpdate(
    { discordUid },
    { $push: { addresses: address } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { success: true };
};

const createLink = async (discordUid) => {
  const id = uuidv4();
  await new LinkUsedModel({
    id,
    used: false,
    discordUid,
  }).save();
  return id;
};

(async () => {
  mongoose.connect(dburl, {});
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "MongoDB connection error:"));

  const app = express();
  if (isDev) {
    app.use(cors());
  }

  if (!isDev) app.use(express.static("../frontend/dist"));

  app.get("/verify", async (req, res) => {
    try {
      const doc = await LinkUsedModel.findOneAndUpdate(
        { id: req.query.id, used: false },
        { $set: { used: true } }
      );
      const address = await web3.eth.accounts.recover(
        doc._doc.id,
        req.query.signature
      );
      const ret = await addWalletAddress(doc._doc.discordUid, address);
      res.send(ret);
    } catch (err) {
      res.send({ invalid: true });
      console.error(err);
    }
  });

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(httpsPort, () => {
    console.log(`Running on port ${httpsPort}`);
  });

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

  client.on("ready", () => {
    client.api.applications(client.user.id).commands.post({
      data: {
        name: "add-wallet",
        description: "Add a verified wallet address to your records.",
        options: [],
      },
    });

    client.api.applications(client.user.id).commands.post({
      data: {
        name: "addresses-of",
        description:
          "Get all verified wallet addresses associated with a user.",
        options: [
          {
            type: 6,
            name: "user",
            description: "The user for which the addresses are retrieved.",
            required: true,
          },
        ],
      },
    });

    client.api.applications(client.user.id).commands.post({
      data: {
        name: "remove-addresses",
        description: "Removes a verified addresses from your records.",
        options: [
          {
            type: 3,
            name: "addresses",
            description: "Comma separated list of addresses to remove.",
            required: true,
          },
        ],
      },
    });

    client.ws.on("INTERACTION_CREATE", async (interaction) => {
      const commandId = interaction.data.id;
      const commandName = interaction.data.name;

      if (commandName == "add-wallet") {
        try {
          if (!interaction.member) {
            client.api
            .interactions(interaction.id, interaction.token)
            .callback.post({
              data: {
                type: 4,
                data: {
                  content: "Running this command outside of a guild is not supported.",
                },
              },
            });
            return;
          }
          const user = await client.users.fetch(interaction.member.user.id);
          const id = await createLink(interaction.member.user.id);
          const linkUrl = `${url}?id=${id}`;

          user.send(linkUrl);
          client.api
            .interactions(interaction.id, interaction.token)
            .callback.post({
              data: {
                type: 4,
                data: {
                  content: "A link to verify an address has been dmed to you.",
                },
              },
            });
        } catch (err) {
          console.error(err);
        }
      } else if (commandName == "addresses-of") {
        try {
          const discordUid = interaction.data.options[0].value;
          const doc = await WalletsModel.findOne({ discordUid });
          let content;
          if (doc?._doc?.addresses.length > 0) {
            content = `User has the following address${
              doc._doc.addresses.length === 1 ? "" : "es"
            } verified:${
              doc._doc.addresses.length === 1 ? " " : "\n"
            }${doc._doc.addresses.join("\n")}`;
          } else {
            content = "No addresses found for this user.";
          }
          client.api
            .interactions(interaction.id, interaction.token)
            .callback.post({
              data: {
                type: 4,
                data: {
                  content,
                },
              },
            });
        } catch (err) {
          console.error(err);
        }
      } else if (commandName == "remove-addresses") {
        try {
          if (!interaction.member) {
            client.api
            .interactions(interaction.id, interaction.token)
            .callback.post({
              data: {
                type: 4,
                data: {
                  content: "Running this command outside of a guild is not supported.",
                },
              },
            });
            return;
          }
          const addresses = interaction.data.options[0].value
            .split(",")
            .map((a) => a.trim());
          const discordUid = interaction.member.user.id;
          const ret = await WalletsModel.updateOne(
            { discordUid },
            {
              $pull: {
                addresses: {
                  $in: addresses,
                },
              },
            }
          );
          const content =
            ret.modifiedCount > 0
              ? `Address${adrresses.length == 1 ? "" : "es"} removed.`
              : "Nothing done.";
          client.api
            .interactions(interaction.id, interaction.token)
            .callback.post({
              data: {
                type: 4,
                data: {
                  content,
                },
              },
            });
        } catch (err) {
          console.error(err);
        }
      }
    });
  });

  client.login(discordKey);
})();
