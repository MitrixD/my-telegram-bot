const TelegramApi = require("node-telegram-bot-api");
const { gameOptions, playAgainOptions } = require("./options");
const sequelize = require("./db");
const UserModel = require("./models");

const token = "5272647417:AAG_O0hgsdl6Q3OvR01hpuUrVd1J2cV-BAQ";

const bot = new TelegramApi(token, { polling: true });

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(chatId, "Сыграем в игру?!");
  await bot.sendMessage(
    chatId,
    "Я загадываю число от 0 до 9, а ты будешь отгадывать."
  );
  chats[chatId] = Math.floor(Math.random() * 10);
  await bot.sendMessage(chatId, "Отгадывай!", gameOptions);
};

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log("БД упала.");
  }

  bot.setMyCommands([
    { command: "/start", description: "Приветствие" },
    { command: "/info", description: "Информация о тебе" },
    { command: "/game", description: "Поиграй со мною" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    try {
      const name = `${msg.from.first_name} @${msg.from.username}`;

      if (text === "/start") {
        await UserModel.create({ chatId });
        await bot.sendMessage(chatId, `О, привет! А я тебя знаю!`);
        return bot.sendSticker(
          chatId,
          "https://chpic.su/_data/stickers/v/ValakasGlad/ValakasGlad_003.webp"
        );
      }
      if (text === "/info" || text === "info") {
        const user = await UserModel.findOne({ chatId });
        await bot.sendMessage(
          chatId,
          `Тебя зовут ${name}, в игре у тебя верных ответов - ${user.right} и неверных - ${user.wrong}.`
        );
        return await bot.sendSticker(
          chatId,
          "https://chpic.su/_data/stickers/v/ValakasGlad/ValakasGlad_011.webp"
        );
      }
      if (text === "/game" || text === "game") {
        return startGame(chatId);
      }
      return bot.sendMessage(chatId, "Неизвестная команда, попробуй еще раз!");
    } catch (e) {
      return bot.sendMessage(chatId, "Произошла неизвестная ошибка!");
    }
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;
    if (data === "/again") {
      return startGame(chatId);
    }
    const user = await UserModel.findOne({ chatId });
    if (data == chats[chatId]) {
      user.right++;
      await bot.sendMessage(
        chatId,
        `Поздравляю, ты отгадал, это цифра - ${chats[chatId]}!`,
        playAgainOptions
      );
    } else {
      user.wrong++;
      await bot.sendMessage(
        chatId,
        `К сожалению, ты не отгадал, это была цифра - ${chats[chatId]}`,
        playAgainOptions
      );
    }
    await user.save();
  });
};

start();
