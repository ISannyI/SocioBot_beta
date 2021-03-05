const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const mongoose = require('mongoose');
const keyboard = require('./keyboard');
const adminBota = config.ADMIN_BOT;
const adminsBot = config.ADMINS_BOT.userId
const adminChatBot = config.ADMIN_CHAT;

//-------------------data  bases--------------------------------
mongoose.Promise = global.Promise;
mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then('MongoDB connect').catch(e => console.log(e));
require('./models/user.model');
require('./models/chat.model');
require('./models/data.model');
const User = mongoose.model('users');
const Chat = mongoose.model('chats');
const DataUsr = mongoose.model('usrData');
//-------------------run bot------------------------------------

const bot = new TelegramBot(config.TOKEN, {
    polling: true
});

console.log('Telegram bot started ...');

//----------------------------------Reminder/Auto kick users---------------------------------

setInterval(() => {
    const date = new Date().getUTCHours()
    if (date === 8){
        notActivUser()
    }

}, 60*60*1000)

//----------------------------------Pars mod message--------------------------------
bot.on('message', msg => {
    // console.log(msg)

    if (msg.chat.type === 'group'|| msg.chat.type === 'supergroup') {
        const userId = msg.from.id;
        const name = msg.from.first_name;
        const nikName = msg.from.username;
        const chatId = msg.chat.id;
        const chatTitle = msg.chat.title;
        const chatNikName = msg.chat.username;
        const msgId = msg.message_id
        //----------------------------check chat&users----------------------
        checkChat(chatId, chatTitle, chatNikName, userId);
        checkUser(userId, name, nikName, msg.date);

//--------------------------message text----------------------------------
        if (msg.text) {
//--------------------------Admin bot message----------------------------------
            if (msg.chat.id === adminChatBot) {
                if (msg.reply_to_message) {
                    const text = msg.reply_to_message.text
                    if (text.startsWith('msg_')) {
                        sendHTML(text.slice(4, text.indexOf('&')), msg.text, text.slice(text.search('&')+1, text.indexOf('\n')))
                    }
                } else if (msg.text.startsWith('/chat_')) {
                    adminGetChatUsers(msg.text.slice(6, 30), chatId, msgId)
                } else if (msg.text.startsWith('/del_')) {
                    adminDeleteUserDB(msg.text.slice(5, 29), chatId, msgId)
                } else if (msg.text.startsWith('/delchat_')) {
                    adminDeleteChatDB(msg.text.slice(9, 33), chatId, msgId)
                }
            }

//--------------------------Chat-------------------------------------------------
            Chat.findOne({chatId})
                .then(chat=>{
                    if (chat.notActivUser){
                        checkDate(chatId, userId, msg.date)
                    }
//--------------------------Reputation User Group-------------------------
                    if (chat.reputation&&msg.reply_to_message){
                        const userIdReply = msg.reply_to_message.from.id
                        const userNameReply = msg.reply_to_message.from.first_name
                        if (msg.text.startsWith('+') && userIdReply && userIdReply !== userId || msg.text.startsWith('👍') && userIdReply && userIdReply !== userId || msg.text.endsWith('👍') && userIdReply && userIdReply !== userId) {
                            repUser(chatId, userId, userIdReply, userNameReply, true, msgId)
                        } else if (msg.text.startsWith('-') && userIdReply && userIdReply !== userId || msg.text.startsWith('👎') && userIdReply && userIdReply !== userId || msg.text.endsWith('👎') && userIdReply && userIdReply !== userId){
                            repUser(chatId, userId, userIdReply, userNameReply, false, msgId)
                        }
                    }
//--------------------------Level User Chat---------------------------------------
                    if (chat.level){
                        const data = msg.text.split(/(?:,| |\n)+/);
                        const level = Math.floor(data.length/5);
                        levelUser(chatId, userId, level)
                    } else if (!chat.notActivUser&&!chat.reputation&&!chat.level&&!chat.cleanData){
//---------------------------Clean data chat---------------------------------------
                        cleanData(chatId)
                    }
                })
        }
    }
});

//-----------------------------Pars mod in\out chat users---------------------------

bot.on('new_chat_members', msg => {
    Chat.findOne({chatId: msg.chat.id})
        .then(cht=>{
            const chatId = msg.chat.id;
            newChatMember(cht._id, msg.new_chat_member.id, msg.new_chat_member.first_name, msg.new_chat_member.username);
            if (cht.welcome){
                const name = msg.new_chat_member.first_name;
                const text = cht.welcome.replace('$name' , `<b>${name}</b>`);
                const chatNikName = msg.chat.username;
                if (chatNikName) {
                    bot.sendMessage(chatId, text, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Правила чата',
                                        url: `https://t.me/${msg.chat.username}/${cht.rulesMsgId}`
                                    }
                                ]
                            ]
                        }
                    });
                } else {
                    bot.sendMessage(chatId, text, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Правила чата',
                                        url: `https://t.me/c/${chatId.toString().substring(4)}/${cht.rulesMsgId}`
                                    }
                                ]
                            ]
                        }
                    });
                }
            }
        });
});
bot.on('left_chat_member', msg => {
    Chat.findOne({chatId: msg.chat.id})
        .then(cht=> {
            leftChatMember(cht._id, msg.left_chat_member.id)
        });
});

//--------------------------------Commands Test------------------------------------------------

bot.onText(/\/test/, msg => {
    if (msg.from.id === adminBota && msg.text.startsWith('/test')) {

    }
});

//---------------------------------Commands for FavChat----------------------------------------

bot.onText(/\/тык(.+)/, msg => {
    if (msg.chat.id === config.FAF_CHAT && msg.text.startsWith('/тык')) {
        const nikName = checkNikName(msg.text);
        const text = checkText(msg.text);
        const chatId = msg.chat.id;
        const message_id = msg.message_id;
        /*const nikNameRep = msg.reply_to_message.from.first_name;
        console.log(nikNameRep)*/
            /*if (nikNameRep){
                sendHTML(msg.chat.id,`<b>${msg.from.first_name}</b> тыкнул пальчиком в бочек <a href="tg://user?id=${msg.reply_to_message.from.id}">${msg.reply_to_message.from.first_name}</a>`);
                bot.deleteMessage(msg.chat.id, msg.message_id)
            } else {

            }*/
        User.findOne({nikName: nikName.slice(1)})
            .then(usr => {
                sendHTML(chatId,`<b>${msg.from.first_name}</b> тыкнул${text} <a href="tg://user?id=${usr.userId}">${usr.name}</a>`);
                bot.deleteMessage(chatId, message_id);
            })
            .catch(e => {
                sendHTML(chatId, `<b>${msg.from.first_name}</b> эпично машет веточкой во все стороны, то и гляди, кого нибудь заденет`);
                bot.deleteMessage(chatId, message_id);
            })
    }

});
bot.onText(/\/обнять(.+)/, msg => {
    if (msg.chat.id === config.FAF_CHAT && msg.text.startsWith('/обнять')) {
        const nikName = checkNikName(msg.text);
        const text = checkText(msg.text);
        if (nikName.length>1) {
            User.findOne({nikName: nikName.slice(1)})
                .then(s=> {
                    sendHTML(msg.chat.id,`<b>${msg.from.first_name}</b> обнял${text}<a href="tg://user?id=${s.userId}">${s.name}</a>`);
                    bot.deleteMessage(msg.chat.id, msg.message_id)
                        .catch(e=>console.log(`При выполнении команды /обнять, сообщение небыло найдено`))
                })
                .catch(e=> {
                    sendHTML(msg.chat.id,`<b>${msg.from.first_name}</b> подошел и нежно обнял <a href="tg://user?id=${s.userId}">${s.name}</a>`);
                    bot.deleteMessage(msg.chat.id, msg.message_id)
                        .catch(e=>console.log(`При выполнении команды /обнять, сообщение небыло найдено`))
            });
        }
    }
});

//---------------------------------Admin Commands bot-------------------------------------------

bot.onText(/\/chats/, msg => {
    if (msg.chat.id === adminChatBot && msg.text.startsWith('/chats')) {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        Chat.find()
            .then(chat => {
                const html = chat.map((f,i) => {
                    if (f.chatNikName) {
                        return `<b>${i+1}. ${f.chatTitle}</b> - @${f.chatNikName}\nПодробнее /chat_${f._id}`
                    } else {
                        return `<b>${i+1}. ${f.chatTitle}</b> - приватный чат\nПодробнее /chat_${f._id}`
                    }
                }).join('\n');
                sendHTML(chatId, `Список чатов:\n${html}`, messageId)
            })
            .catch(e => {
                sendHTML(chatId, `Сохраненные чаты отсутствуют в БД`, messageId)
            })
    }
});
bot.onText(/\/user/, msg => {
    if (adminsBot.includes(msg.from.id) && msg.text.startsWith('/user')) {
        if (msg.reply_to_message) {
            adminUserCheck(msg.reply_to_message.from.id)
        } else {
            adminUserCheck(msg.text.slice(6, msg.text.indexOf('@')))
        }
    }
});
bot.onText(/\/message(.+)/, msg => {
    if (msg.chat.id === adminChatBot && msg.text.startsWith('/message')) {
        adminMessageChats(msg.text.slice(9))
    }
});

bot.onText(/\/welcome(.+)/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/welcome')||msg.chat.type === 'supergroup' && msg.text.startsWith('/welcome')) {
        const chatId = msg.chat.id;
        const text = msg.text.slice(9);
        Promise.all([
            bot.getChatAdministrators(chatId),
            Chat.findOne({chatId: chatId})
        ])
            .then(([adm, cht]) => {
                const adminId = adm.map((a) => {return a.user.id});
                const check = adminId.includes(msg.from.id);
                if (check) {
                    cht.welcome = text;
                    cht.save()
                        .then(_=>sendHTML(chatId, `Приветствие новых участников чата установлено`, msg.message_id))
                        .catch(e=>console.log(e))
                }
            })
    }
});
bot.onText(/\/rules/, msg => {
    if (msg.chat.type === 'group' && msg.text.endsWith('/rules')||msg.chat.type === 'supergroup' && msg.text.endsWith('/rules')) {
        const chatId = msg.chat.id;
        Promise.all([
            bot.getChatAdministrators(chatId),
            Chat.findOne({chatId})
        ])
            .then(([adm, cht]) => {
                const adminId = adm.map((a) => {return a.user.id});
                const check = adminId.includes(msg.from.id);
                if (check) {
                    cht.rulesMsgId = msg.message_id;
                    cht.save()
                        .then(s=>sendHTML(chatId, `Правила чата установлены`, msg.message_id))
                }
            })
    }
});
bot.onText(/\/kick/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/kick')||msg.chat.type === 'supergroup' && msg.text.startsWith('/kick')) {
        const chatId = msg.chat.id;
        const adminId = msg.from.id;
        const userId = msg.reply_to_message.from.id;
        bot.getChatMember(chatId, adminId)
            .then(mem => {
                if (mem.status === 'creator'||mem.status === 'administrator') {
                    bot.getChatMember(chatId, userId)
                        .then(usr => {
                            if (usr.status === 'creator') {
                                sendHTML(chatId, `Владельца <b>${msg.reply_to_message.from.first_name}</b> невозможно выгнать из чата`)
                            } else if (usr.status === 'administrator') {
                                sendHTML(chatId, `Что-бы выгнать <b>${msg.reply_to_message.from.first_name}</b> из чата, его необходимо разжаловать из администраторов`)
                            } else if (usr.status === 'member'||usr.status === 'restricted') {
                                bot.kickChatMember(chatId, userId)
                                    .then(kick => {
                                        sendHTML(chatId, `Данный пользователь <b>${msg.reply_to_message.from.first_name}</b> выгнан из чата`)
                                        bot.unbanChatMember(chatId, userId);
                                    })
                                    .catch(err => sendHTML(chatId, `Исключить участника <b>${msg.reply_to_message.from.first_name}</b> из чата не удалось`));
                            } else if (usr.status === 'left') {
                                sendHTML(chatId, `Участник <b>${msg.reply_to_message.from.first_name}</b> уже вышел из чата`)
                            } else if (usr.status === 'kicked') {
                                sendHTML(chatId, `Участник <b>${msg.reply_to_message.from.first_name}</b> уже забанен`)
                            }
                        })
                }
            })
    }
});
bot.onText(/\/ban/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/ban')||msg.chat.type === 'supergroup' && msg.text.startsWith('/ban')) {
        const chatId = msg.chat.id;
        const adminId = msg.from.id;
        const userId = msg.reply_to_message.from.id;
        bot.getChatMember(chatId, adminId)
            .then(mem => {
                if (mem.status === 'creator'||mem.status === 'administrator') {
                    bot.getChatMember(chatId, userId)
                        .then(usr => {
                            if (usr.status === 'creator') {
                                sendHTML(chatId, `Владельца <b>${msg.reply_to_message.from.first_name}</b> невозможно забанить`)
                            } else if (usr.status === 'administrator') {
                                sendHTML(chatId, `Что-бы забанить <b>${msg.reply_to_message.from.first_name}</b>, его необходимо разжаловать из администраторов`)
                            } else if (usr.status === 'member'||usr.status === 'restricted'||usr.status === 'left') {
                                bot.kickChatMember(chatId, userId)
                                    .then(kick => {
                                        sendHTML(chatId, `Участник <b>${msg.reply_to_message.from.first_name}</b> забанен`)
                                    })
                                    .catch(err => sendHTML(chatId, `Забанить участника <b>${msg.reply_to_message.from.first_name}</b> не удалось`));
                            } else if (usr.status === 'kicked') {
                                sendHTML(chatId, `Участник <b>${msg.reply_to_message.from.first_name}</b> уже забанен`)
                            }
                        })
                }
            })
    }
});
bot.onText(/\/mute(.+)/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/mute')||msg.chat.type === 'supergroup' && msg.text.startsWith('/mute')) {
        const chatId = msg.chat.id;
        const adminId = msg.from.id;
        const userId = msg.reply_to_message.from.id;
        const time = parseInt(msg.text.replace(/[^\d]/g, ''));
        bot.getChatMember(chatId, adminId)
            .then(mem => {
                if (mem.status === 'creator'&&time||mem.status === 'administrator'&&time) {
                    bot.getChatMember(chatId, userId)
                        .then(usr => {
                            if (usr.status === 'creator'||usr.status === 'administrator') {
                                sendHTML(chatId, `Администратору <b>${msg.reply_to_message.from.first_name}</b> невозможно наложить молчу`)
                            } else if (usr.status === 'member'||usr.status === 'restricted') {
                                bot.restrictChatMember(chatId, userId, {
                                    can_send_messages: false,
                                    until_date: Math.round(new Date().getTime()/1000.0+time*60)
                                })
                                    .then(mut => sendHTML(chatId, `Пользователю <b>${msg.reply_to_message.from.first_name}</b> наложена "молча" на ${time} минут`))
                                    .catch(err => sendHTML(chatId, `Наложить молчу участнику <b>${msg.reply_to_message.from.first_name}</b> не удалось`))

                            } else if (usr.status === 'left') {
                                sendHTML(chatId, `Участник <b>${msg.reply_to_message.from.first_name}</b> уже вышел из чата`)
                            } else if (usr.status === 'kicked') {
                                sendHTML(chatId, `Участник <b>${msg.reply_to_message.from.first_name}</b> уже забанен`)
                            }
                        })
                }
            })
    }
});
bot.onText(/\/clean/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/clean')||msg.chat.type === 'supergroup' && msg.text.startsWith('/clean')) {
        const chatId = msg.chat.id
        checkAdmin(chatId, msg.from.id)
            .then(admin=>{
                if (admin){
                    Chat.findOne({chatId})
                        .then(chat => {
                            cleanMembers(chat._id)
                            sendHTML(chatId, `Список участников чата обновлен`, msg.message_id)
                        })
                }
            })
    }
});
bot.onText(/\/reminder(.+)/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/reminder')||msg.chat.type === 'supergroup' && msg.text.startsWith('/reminder')) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        checkAdmin(chatId, msg.from.id)
            .then(admin=>{
                if (admin){
                    const text = msg.text
                    const check = /\d+/
                    if (text.match(check)||text.toLowerCase().includes('on')){
                        Chat.findOne({chatId})
                            .then(chat => {
                                toggleSwitch(chat._id, 'reminder', true, text.match(check)[0], msgId)
                            })
                    } else if (text.toLowerCase().includes('off')){
                        Chat.findOne({chatId})
                            .then(chat => {
                                toggleSwitch(chat._id, 'reminder', false, null, msgId)
                            })
                    }
                }
            })
    }
});
bot.onText(/\/reputation(.+)/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/reputation')||msg.chat.type === 'supergroup' && msg.text.startsWith('/reputation')) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        checkAdmin(chatId, msg.from.id)
            .then(admin=>{
                if (admin){
                    if (msg.text.slice(10).toLowerCase().includes('on')){
                        Chat.findOne({chatId})
                            .then(chat => {
                                toggleSwitch(chat._id, 'reputation', true, msgId)
                            })
                    } else if (msg.text.toLowerCase().includes('off')){
                        Chat.findOne({chatId})
                            .then(chat => {
                                toggleSwitch(chat._id, 'reputation', false, msgId)
                            })
                    }
                }
            })
    }
});
bot.onText(/\/level(.+)/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/level')||msg.chat.type === 'supergroup' && msg.text.startsWith('/level')) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        checkAdmin(chatId, msg.from.id)
            .then(admin=>{
                if (admin){
                    if (msg.text.toLowerCase().includes('on')){
                        Chat.findOne({chatId})
                            .then(chat => {
                                toggleSwitch(chat._id, 'level', true, msgId)
                            })
                    } else if (msg.text.toLowerCase().includes('off')){
                        Chat.findOne({chatId})
                            .then(chat => {
                                toggleSwitch(chat._id, 'level', false, msgId)
                            })
                    }
                }
            })
    }
});
bot.onText(/\/settings/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/settings')||msg.chat.type === 'supergroup' && msg.text.startsWith('/settings')) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        checkAdmin(chatId, msg.from.id)
            .then(admin=>{
                if (admin){
                    Chat.findOne({chatId})
                        .then(chat => {
                            const activ = chat.notActivUser ? 'включен' : 'отлючен'
                            const reputation = chat.reputation ? 'включен' : 'отлючен'
                            const level = chat.level ? 'включен' : 'отлючен'
                            sendHTML(chatId,
                                `<b>Настройки чата:</b>\nИсключение неактивных участников чата с предварительным уведомлением (неактивность более <b>${chat.reminderDay}</b> дней, уведомление за день до исключения) - <b>${activ}</b>\nРепутация участников чата - <b>${reputation}</b>\nКарма участников чата - <b>${level}</b>
                                `, msgId
                            )
                        })
                }
            })
    }
});
bot.onText(/\/send/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/send')||msg.chat.type === 'supergroup' && msg.text.startsWith('/send')) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        checkAdmin(chatId, msg.from.id)
            .then(admin=>{
                if (admin){

                }
            })

        if (msg.reply_to_message) {
            sendHTML(adminChatBot, `msg_${chatId}&${msgId}\n<b>Обращение от @${msg.from.username}</b>`)
            bot.forwardMessage(adminChatBot, msg.chat.id, msg.reply_to_message.message_id)
            bot.forwardMessage(adminChatBot, msg.chat.id, msgId)
                .then(s=>sendHTML(chatId, `Сообщение отправленно разработчикам. Благодарим Вас за обратную связь.`, msgId))
        } else {
            sendHTML(adminChatBot, `msg_${chatId}&${msgId}\n<b>Обращение от пользователя бота</b>`)
            bot.forwardMessage(adminChatBot, msg.chat.id, msgId)
                .then(s=>sendHTML(chatId, `Сообщение отправленно разработчикам. Благодарим Вас за обратную связь.`, msgId))
        }
    }
});

//---------------------------------Commands bot-------------------------------------------------

bot.onText(/\/start/, msg => {
    if (msg.chat.type === 'private') {
        const chatId = msg.chat.id;
        const home = keyboard.home;
        bot.sendMessage(chatId, `Выберите дальнейшее действие`, {
            reply_markup: {
                inline_keyboard: home
            }
        })
    }
});
bot.onText(/\/help/, msg => {
    if (msg.text.startsWith('/help')){
        sendHTML(msg.chat.id, `
            Для групповых чатов доступны следующие команды: \n<b>/я</b> - информация о себе \n<b>/кто (репост)</b> - информация о другом пользователе (авторе репоста) \n<b>/инфо</b> - список пользователей чата\n<b>/безтипа</b> - список пользователей чата без типа\n<b>/правила</b> - ссылка на правила чата\n<b>+/👍/-/👎 (репост)</b> - повысить/понизить репутацию автора репоста\n<b>/уровень</b> - узнать репутацию/уровень участников чата\n<b>/уровень (репост)</b> - узнать репутацию/уровень автора репоста\n<b>/помощь</b> - список команд бота\n\nдля администраторов чата:\n<b>/rules (в конце сообщения)</b> - установка правил чата\n<b>/welcome (текст приветствия)</b> - установка приветствия нового участника чата. Для обращения к участнику по имени, используйте $name в тексте приветствия\n<b>/settings</b> - список настроек чата\n<b>/reminder on/число-off</b> - включить-отключить автокик с предварительным уведомлением неактивных участников чата (укажите число дней неактивности в чате, по умолчанию установленно 30 дней, уведомление участника за день до исключения из чата)\n<b>/reputation on-off</b> - включить-отключить репутацию участников чата\n<b>/level on-off</b> - включить-отключить карму участников чата\n<b>/clean</b> - обновить список участников чата\n<b>/mute (время в минутах, репост)</b> - наложить "молчу" на автора репоста указанное время\n<b>/kick (репост)</b> - выгнать из чата автора репоста\n<b>/ban (репост)</b> - забанить автора репоста\n<b>/send (сообщение+репост)</b> - отправить сообщение разработчикам
            `, msg.message_id)
    }
});
bot.onText(/\/инфо/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/инфо')||msg.chat.type === 'supergroup' && msg.text.startsWith('/инфо')){
        Chat.findOne({chatId: msg.chat.id})
            .then(c => {
                sendInfoChat(c._id, msg.chat.id, msg.message_id, true)
            })
    }
});
bot.onText(/\/безтипа/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/безтипа')||msg.chat.type === 'supergroup' && msg.text.startsWith('/безтипа')) {
        Chat.findOne({chatId: msg.chat.id})
            .then(_=> sendInfoChat(_._id, msg.chat.id, msg.message_id, false))
    }
});
bot.onText(/\/я/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/я')||msg.chat.type === 'supergroup' && msg.text.startsWith('/я')){
        const chatId = msg.chat.id;
        const message_id = msg.message_id;
        User.findOne({userId: msg.from.id})
            .then(info => {
                let PI = info.PI ? info.PI : '<b>не установлен</b>';
                let TIM = info.TIM ? info.TIM : '<b>не установлен</b>';
                sendHTML(chatId,`ТИМ - ${TIM}\nПЙ - ${PI}`, message_id);
            })
            .catch(_ => {
                sendHTML(chatId, `Вас нет в нашей базе данных`, message_id)
            })
    }
});
bot.onText(/\/кто/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/кто')||msg.chat.type === 'supergroup' && msg.text.startsWith('/кто')){
        User.findOne({userId: msg.reply_to_message.from.id})
            .then(u => {
                if (u.TIM || u.PI) {
                    sendHTML(msg.chat.id,`<b>${u.name}</b>\nТИМ - ${u.TIM}\nПЙ - ${u.PI}`, msg.message_id)
                } else {
                    sendHTML(msg.chat.id, `Пользователь еще не указал свои данные`, msg.message_id)
                }
            })
            .catch(e => console.error(e))
    }
});
bot.onText(/\/правила/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/правила')||msg.chat.type === 'supergroup' && msg.text.startsWith('/правила')) {
        const chatId = msg.chat.id;
        const chatNikName = msg.chat.username;
        const text = 'Правила чата';
        Chat.findOne({chatId: msg.chat.id})
            .then(cht=>{
                const check = cht.rulesMsgId;
                if (check) {
                    if (chatNikName) {
                        bot.sendMessage(chatId, text, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'прочитать',
                                            url: `https://t.me/${msg.chat.username}/${cht.rulesMsgId}`
                                        }
                                    ]
                                ]
                            }
                        })
                    } else {
                        bot.sendMessage(chatId, text, {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'прочитать',
                                            url: `https://t.me/c/${chatId.toString().substring(4)}/${cht.rulesMsgId}`
                                        }
                                    ]
                                ]
                            }
                        })
                    }
                } else {
                    sendHTML(chatId, `В данном чате, правила еще не установлены`, msg.message_id)
                }
                bot.deleteMessage(chatId, msg.message_id)
            });
    }
});
bot.onText(/\/уровень/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/уровень')||msg.chat.type === 'supergroup' && msg.text.startsWith('/уровень')){
        if (msg.reply_to_message) {
            levelData(msg.chat.id, msg.reply_to_message.from.id, msg.message_id, true)
        } else {
            levelData(msg.chat.id, false, msg.message_id, false)
        }
    }
});
bot.onText(/\/помощь/, msg => {
    if (msg.chat.type === 'group' && msg.text.startsWith('/помощь')||msg.chat.type === 'supergroup' && msg.text.startsWith('/помощь')){
        sendHTML(msg.chat.id, `
            Для групповых чатов доступны следующие команды: \n<b>/я</b> - информация о себе \n<b>/кто (репост)</b> - информация о другом пользователе (авторе репоста) \n<b>/инфо</b> - список пользователей чата\n<b>/безтипа</b> - список пользователей чата без типа\n<b>/правила</b> - ссылка на правила чата\n<b>+/👍/-/👎 (репост)</b> - повысить/понизить репутацию автора репоста\n<b>/уровень</b> - узнать репутацию/уровень участников чата\n<b>/уровень (репост)</b> - узнать репутацию/уровень автора репоста\n<b>/помощь</b> - список команд бота\n\nдля администраторов чата:\n<b>/rules (в конце сообщения)</b> - установка правил чата\n<b>/welcome (текст приветствия)</b> - установка приветствия нового участника чата. Для обращения к участнику по имени, используйте $name в тексте приветствия\n<b>/settings</b> - список настроек чата\n<b>/reminder on/число-off</b> - включить-отключить автокик с предварительным уведомлением неактивных участников чата (укажите число дней неактивности в чате, по умолчанию установленно 30 дней, уведомление участника за день до исключения из чата)\n<b>/reputation on-off</b> - включить-отключить репутацию участников чата\n<b>/level on-off</b> - включить-отключить карму участников чата\n<b>/clean</b> - обновить список участников чата\n<b>/mute (время в минутах, репост)</b> - наложить "молчу" на автора репоста указанное время\n<b>/kick (репост)</b> - выгнать из чата автора репоста\n<b>/ban (репост)</b> - забанить автора репоста\n<b>/send (сообщение+репост)</b> - отправить сообщение разработчикам
            `, msg.message_id)
    }
});

bot.on('callback_query', query => {

    const {chat, message_id} = query.message;
    switch (query.data) {
        case 'setTIM':
            bot.editMessageText(`Выберите свой ТИМ`,{
                reply_markup: {
                    inline_keyboard: keyboard.kTIM
                },
                chat_id: chat.id,
                message_id: message_id
            });
            break;
        case 'setPI':
            bot.editMessageText(`Выберите свой ПЙ`,{
                reply_markup: {
                    inline_keyboard: keyboard.kPI
                },
                chat_id: chat.id,
                message_id: message_id
            });
            break;
        case 'about':
            bot.editMessageText(`
                Данный бот умеет хранить информацию о вашем ТИМе и ПЙ, значения которых можно установить в соответствующих разделах меню бота.\n\nДля просмотра списка команд бота, нажмите /help
            `,{
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Назад', callback_data: 'back'}
                        ]
                    ]
                },
                chat_id: chat.id,
                message_id: message_id,
                parse_mode: 'HTML'
            });
            break;
        case 'back':
            bot.editMessageText(`Выберите дальнейшее действие`,{
                reply_markup: {
                    inline_keyboard: keyboard.home
                },
                chat_id: chat.id,
                message_id: message_id
            });
            break;
        //----------buttons TIM--------
        case 'Дон Кихот':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Дюма':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Гюго':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Робеспьер':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Гамлет':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Максим Горький':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Маршал Жуков':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Есенин':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Наполеон':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Бальзак':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Джек Лондон':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Драйзер':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Штирлиц':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Достоевский':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Гексли':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        case 'Габен':
            saveDataTIM(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ТИМ - ${query.data}`);
            break;
        //------------------------buttons PI---------------------------------
        case 'Сократ (ВЛЭФ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Ахматова (ВЭЛФ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Твардовский (ВФЭЛ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Наполеон (ВФЛЭ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Толстой (ВЭФЛ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Ленин (ВЛФЭ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Бухарин (ЭФЛВ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Андерсен( ЭЛВФ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Газали (ЭВЛФ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Пастернак (ЭВФЛ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Руссо (ЭЛФВ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Пушкин (ЭФВЛ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;

        case 'Бертье (ЛФЭВ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Паскаль (ЛЭВФ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Платон (ЛФВЭ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Эйнштейн (ЛВЭФ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Лао Цзы (ЛВФЭ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Августин (ЛЭФВ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Аристипп (ФЛВЭ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Чехов (ФВЭЛ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Дюма (ФЭВЛ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Эпикур (ФЛЭВ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Борджа (ФЭЛВ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
        case 'Гёте (ФВЛЭ)':
            saveDataPI(chat.id, query.data, query.message);
            bot.answerCallbackQuery(query.id, `Установлен ПЙ - ${query.data}`);
            break;
    }
});
// -------------------------------------Test Commands---------------------------------------------


//--------------------------------------Functions------------------------------------------------

function sendHTML(chatId, html, message_id) {
    const options = {
        reply_to_message_id: message_id,
        parse_mode: 'HTML'
    };
    bot.sendMessage(chatId, html, options);
}
async function sendInfoChat(chatById, chatId, msgId, type){
    const chat = await Chat.findById(chatById);
    const parsIds = chat.userId;
    const users = await User.find({userId: {$in: parsIds}}).sort({name: 1});
    const usersType = users.filter(usr=> usr.TIM || usr.PI);
    const usersNoType = users.filter(usr=> usr.TIM === undefined && usr.PI === undefined);
    const usersNoTypeId = usersNoType.map((u)=>{return u.userId});
    if (type) {
        const html = usersType.map((u, index) => {
            let name = u.name.split(' ');
            let PI = '';
            if (u.PI){
                let sIndPI = u.PI.indexOf('(');
                PI = u.PI.slice(sIndPI);
            }
            return `${index +1}. <b>${name[0]}</b> - ${u.TIM} ${PI}`
        }).join('\n');
        sendHTML(chatId,`<b>Участники нашего чата:</b>\n${html}`, msgId);
    } else {
        const list = await Promise.all(usersNoTypeId.map((i) => {
            return bot.getChatMember(chatId, i)
        }));

        let html = list.map((u, index) => {
            return `${index +1}. <a href="tg://user?id=${u.user.id}">${u.user.first_name}</a>`
        }).join('\n');
        sendHTML(chatId,`<b>Участники чата без типа:</b>\n${html}`, msgId);
    }
}
function saveDataTIM(chatId, data, msg) {
    let string = data;
    let userPromise;
    User.findOne({userId: msg.chat.id})

        .then(user => {
            if (user.TIM !== string) {
                user.TIM = string;
                user.save()
            }
        })
        .catch(_ => {
            userPromise = new User({
                userId: msg.chat.id,
                name: msg.chat.first_name,
                nikName: msg.chat.username,
                TIM: string
            });
            userPromise.save()
        })
}
function saveDataPI(chatId, data, msg) {
    let string = data;
    let userPromise;
    User.findOne({userId: msg.chat.id})

        .then(user => {
            if (user.PI !== string) {
                user.PI = string;
                user.save()
            }
        })
        .catch(_ => {
            userPromise = new User({
                userId: msg.chat.id,
                name: msg.chat.first_name,
                nikName: msg.chat.username,
                PI: string
            });
            userPromise.save()
        })
}
async function checkAdmin(chatId, userId){
    let admin = await bot.getChatMember(chatId, userId)
    return admin.status === 'creator' || admin.status === 'administrator'
}
async function checkMember(chatId, userIds){
    return await Promise.allSettled(userIds.map(i => {
        return bot.getChatMember(chatId, i)
    }))
}
async function checkChat (chatId, chatTitle, chatNikName, userId) {
    let chat = await Chat.findOne({chatId: chatId});
    const count = await bot.getChatMembersCount(chatId)
    if (chat) {
        const check = chat.userId.includes(userId);
        if(!check) {
            chat.userId.push(userId);
        } else if (chat.title !== chatTitle || chat.chatNikName !== chatNikName) {
            chat.chatTitle = chatTitle;
            chat.chatNikName = chatNikName
        }
        if (count>49&&count!==chat.count){
            await cleanMembers(chat._id)
            chat.count = count
        }
        await chat.save()
    } else if (!chat){
        const admin = await bot.getChatAdministrators(chatId);
        const userId = admin.map((adm)=>{return adm.user.id});
        if (chatNikName) {
            chat = new Chat({
                chatId,
                chatTitle,
                chatNikName,
                userId,
                count
            })
        } else if (!chatNikName) {
            chat = new Chat({
                chatId,
                chatTitle,
                userId,
                count
            })
        }
        await chat.save()
            .then(_=>sendHTML(adminChatBot, `В базу был добавлен новый чат ${chatTitle} - @${chatNikName}`));
        await admin.map((u)=>{checkUser(chatId, u.user.id, u.user.first_name, u.user.username)})
    }
}
async function checkUser (userId, name, nikName, date) {
    let user = await User.findOne({userId})
    if (!user) {
        user = new User({
            userId,
            name,
            nikName
        })
    } else if (user.name !== name || user.nikName !== nikName) {
        user.name = name;
        user.nikName = nikName
    }
    await user.save()
}
async function checkDate(chatId, userId, date) {
    let user = await DataUsr.findOne({chatId, userId})
    if (user) {
        user.date = date
    } else {
        user = new DataUsr({
            userId,
            chatId,
            date
        })
    }
    await user.save()
}
async function newChatMember(chatById, userId) {
    const chat = await Chat.findById(chatById);
    const usr = chat.userId.includes(userId);
    if (!usr) {
        chat.userId.push(userId)
        chat.save()
    }
}
function leftChatMember(chatById, userId) {
    Chat.findById(chatById)
        .then(user => {
            const usr = user.userId.includes(userId);
            if (usr) {
                user.userId = user.userId.filter(lftUsr => lftUsr !== userId)
                user.userIdLeft.push(userId)
                user.save()
            }
        })
}
function checkNikName(text) {
    const startInd = text.indexOf('@');
    const startName = text.slice(startInd);
    const masiv = startName.split(' ');
    const check = masiv[0].includes(',');
    let user = masiv[0];
    if (check){
        let endIndx = masiv[0].indexOf(',');
        user = masiv[0].slice(0, endIndx)
    }
    return user
}
function checkText(text) {
    const startInd = text.indexOf(' ');
    const endInd = text.indexOf('@');
    return text.slice(startInd, endInd)
}
async function repUser(chatId, userId, user, name, toggle, msgId) {
    let affectUser = await DataUsr.findOne({chatId, userId})
    let changeUser = await DataUsr.findOne({chatId, userId: user})
    const date = Math.trunc(Date.now()/1000)
    if (!affectUser){
        affectUser = new DataUsr({
            userId,
            chatId
        })
    }
    if (!changeUser){
        changeUser = new DataUsr({
            userId: user,
            chatId
        })
    }
    const time = date - affectUser.dateRep
    if (time > 30) {
        if (toggle){
            changeUser.reputation++
            await changeUser.save().then(()=>sendHTML(chatId, `Репутация <b>${name}</b> увеличена - (<b>${changeUser.reputation}</b>)`, msgId))
        } else {
            changeUser.reputation--
            await changeUser.save().then(()=>sendHTML(chatId, `Репутация <b>${name}</b> понижена - (<b>${changeUser.reputation}</b>)`, msgId))
        }
        affectUser.dateRep = date
        affectUser.save()
    } else {
        sendHTML(chatId, `Слишком часто влиять на репутацию запрещено, попробуйте чуть попозже.`, msgId)
    }
}
async function levelUser(chatId, userId, carma) {
    const usr = await User.findOne({userId});
    let usrData = await DataUsr.findOne({chatId, userId});
    const lvl = [0, 100, 235, 505, 810, 1250, 1725, 2335, 2980, 3760, 4575, 5525, 6510, 7630, 8785, 10075, 11400, 12860, 14355, 15985, 17650, 19450, 21285, 23255, 25260, 27400, 29575, 31885, 34230,36710, 39225, 41875, 44560, 47380, 50235, 53225, 56250, 59410, 62605, 65935]
    if (usrData) {
        usrData.carma = usrData.carma + carma;
        if (lvl[usrData.level+1]<usrData.carma){
            ++usrData.level;
            sendHTML(chatId, `🌟 <b>${usr.name}</b> достиг <b>${usrData.level}</b> уровня!`)
        }
    } else {
        usrData = new DataUsr({
            userId,
            chatId,
            carma
        })
    }
    await usrData.save()
}
async function cleanMembers(byId) {
    let chat = await Chat.findById(byId)
    let userIds = chat.userId.concat(chat.userIdLeft, chat.userIdKick, chat.userIdDel)
    let users = await checkMember(chat.chatId, userIds)
    users.map(i => {
        if (i.status === 'fulfilled') {
            let id = i.value.user.id
            chat.userId = chat.userId.filter(x => x !==id)
            chat.userIdLeft = chat.userIdLeft.filter(x => x !==id)
            chat.userIdKick = chat.userIdKick.filter(x => x !==id)
            chat.userIdDel = chat.userIdDel.filter(x => x !==id)

            if (i.value.status === 'creator'||i.value.status === 'administrator'||i.value.status === 'member'||i.value.status === 'restricted') {
                if (!chat.userId.includes(id)){
                    chat.userId.push(id)
                }
            } else if (i.value.status === 'left') {
                if (!chat.userIdLeft.includes(id)){
                    chat.userIdLeft.push(id)
                }
            } else if (i.value.status === 'kicked') {
                if (!chat.userIdKick.includes(id)){
                    chat.userIdKick.push(id)
                }
            }
        } else if (i.status === 'rejected' && i.reason.response.request.response.body.description === 'Bad Request: user not found'){
            let id = i.reason.response.request._rp_options.form.user_id
            chat.userId = chat.userId.filter(x => x !==id)
            chat.userIdLeft = chat.userIdLeft.filter(x => x !==id)
            chat.userIdKick = chat.userIdKick.filter(x => x !==id)
            chat.userIdDel = chat.userIdDel.filter(x => x !==id)

            if (!chat.userIdDel.includes(id)){
                chat.userIdDel.push(id)
            }
        }
    })
    await chat.save()
}
async function levelData(chatId, userId, msgId, post) {
    if (post) {
        const data = await DataUsr.findOne({userId, chatId});
        const usr = await User.findOne({userId});
        if (data) {
            sendHTML(chatId,`Уровни <b>${usr.name}</b>\nРепутация в чате - <b>${data.reputation}</b> 🏆\nУровень активности - <b>${data.level}</b> 🌟`, msgId);
        } else {
            sendHTML(chatId, `<b>${usr.name}</b> не имеет уровней`, msgId)
        }
    } else {
        const cht = await Chat.findOne({chatId});
        const userIds = cht.userId;
        const data = await DataUsr.find({chatId, userId: {$in: userIds}}).sort({reputation: -1});

        if (data.length>0){
            const dataUsr = data.map(data => {return data.userId});
            const users = await User.find({userId: {$in: dataUsr}});
            // const maxLength = Math.max(...users.map(u => {return u.name.length}));
            const list = data.map(usr => {
                const str = users.find(tmp => tmp.userId === usr.userId);
                return `<b>${str.name}</b> - <b>${usr.reputation}</b> 🏆, <b>${usr.level}</b> 🌟`
            }).join('\n');
            sendHTML(chatId, `<b>Рейтинг участников чата</b>\n${list}`, msgId)
        } else {
            sendHTML(chatId, `<b>Данные участников чата отсутствуют</b>`, msgId)
        }

    }
}
async function toggleSwitch(byId, data, toggle, day, msgId) {
    let chat = await Chat.findById(byId)
    const chatId = chat.chatId
    if (toggle){
        if (data === 'reminder'){
            chat.notActivUser = true
            chat.cleanData = false
            if (day){
                chat.reminderDay = day
            }
            sendHTML(chatId, `Удаление неактивных участников чата <b>включено</b>`, msgId)
        } else if (data === 'reputation'){
            chat.reputation = true
            chat.cleanData = false
            sendHTML(chatId, `Репутация участников чата <b>включено</b>`, msgId)
        } else if (data === 'level'){
            chat.level = true
            chat.cleanData = false
            sendHTML(chatId, `Карма участников чата <b>включено</b>`, msgId)
        }
    } else {
        if (data === 'reminder'){
            chat.notActivUser = false
            sendHTML(chatId, `Удаление неактивных участников чата <b>отключено</b>`, msgId)
        } else if (data === 'reputation'){
            chat.reputation = false
            sendHTML(chatId, `Репутация участников чата <b>отключено</b>`, msgId)
        } else if (data === 'level'){
            chat.level = false
            sendHTML(chatId, `Карма участников чата <b>отключено</b>`, msgId)
        }
    }

    await chat.save()
}
async function cleanData(chatId) {
    const chat = await DataUsr.find({chatId})
    chat.map(i=>{
        DataUsr.findByIdAndDelete(i._id)
    })
    Chat.findOneAndUpdate({chatId}, {cleanData: true})
}
async function notActivUser() {
    const chats = await Chat.find({notActivUser: true})
    for (const chat of chats){
        let data = await DataUsr.find({chatId: chat.chatId, userId: {$in: chat.userId}})
        const chatId = chat.chatId
        const day = chat.reminderDay
        let reminder = []
        let member = []
        for (let i of data) {
            const userId = i.userId
            if (Math.trunc(Date.now()/1000)-i.date > 60*60*24*(day-1) && i.reminder === false){
                let user = await User.findOne({userId})
                const mem = await bot.getChatMember(chatId, userId)
                const status = mem.status
                reminder.push(`<a href="tg://user?id=${userId}">${user.name}</a>`)
                if ( status === 'member' || status === 'restricted'){
                    i.reminder = true
                }
                await i.save()
            } else if (Math.trunc(Date.now()/1000)-i.date > 60*60*24*day && i.reminder === true){
                const user = await User.findOne({userId})
                const mem = await bot.getChatMember(chatId, userId)
                const status = mem.status
                if ( status === 'member' || status === 'restricted'){
                    member.push(`<a href="tg://user?id=${userId}">${user.name}</a>`)
                    await bot.kickChatMember(chatId, userId)
                    await bot.unbanChatMember(chatId, userId)
                }
            }
        }
        let html = []
        if (reminder.length>0) {
            html.push(`<b>Уважаемые:</b>\n<b>${reminder.join('\n')}</b>\n\nЗавтра Вы будете исключены из чата, так как не проявляли свою активность последние <b>${day-1}</b> дней. \nПрисоединяйтесь к нашему общению, нам Вас не хватает =)`)
        }
        if (member.length>0){
            html.push(`\n<b>Исключены за неактивность в чате:</b>\n${member.join('\n')}`)
        }

        if (html.length>0){
            sendHTML(adminChatBot, `${html.join('\n')}`)
        }
    }
}

//-------------------------------------Functions for Admins Bots
async function adminChatList(byId, chatId, chat, title, userIds, msgId) {
    const users = await checkMember(chat, userIds)
    const html = users.map((user, i) => {
        if (user.status === 'fulfilled') {
            return `<b>${i+1}.</b> <a href="tg://user?id=${user.value.user.id}">${user.value.user.first_name}</a> статус ${user.value.status}\nПодробнее /user_${user.value.user.id}`
        } else if (user.status === 'rejected' && user.reason.response.request.response.body.description === 'Bad Request: user not found'){
            return `<b>${i+1}.</b> <a href="tg://user?id=${user.reason.response.request._rp_options.form.user_id}">${user.reason.response.request._rp_options.form.user_id}</a> не найден\nПодробнее /user_${user.reason.response.request._rp_options.form.user_id}`
        }
    }).join('\n')
    sendHTML(chatId, `Список участников чата <b>${title}</b>\n<b>Удалить документ?</b> /delchat_${byId}\n\n${html}`, msgId)
}
async function adminChatListDB(chatId, title, userIds, text, msgId) {
    const users = await User.find({userId: {$in: userIds}})
    const html = users.map((user, i)=>{
        const name = user.name ? user.name : user.userId
        const nik = user.nikName ? ` - @${user.nikName}` : ''
        return `<b>${i+1}.</b> <a href="tg://user?id=${user.userId}">${name}</a>${nik}\nПодробнее /user_${user.userId}`
    }).join('\n')
    sendHTML(chatId, `Список участников <b>${title}</b>\n${text}\n\n${html}`, msgId)
}
async function adminUserCheck(userId) {
    const data = await User.find({userId})
    if (data.length>0){
        const html = data.map((u, i)=>{
            const TIM = u.TIM ? u.TIM : '<b>не установлен</b>'
            const PI = u.PI ? u.PI : '<b>не установлен</b>'
            return `<b>${i+1}.</b> ${u.name} \nТИМ: ${TIM} \nПЙ: ${PI} \n<b>Удалить документ?</b> /del_${u._id} `
        }).join('\n')
        sendHTML(adminChatBot, `В базе с данным ID:\n${html}`)
    } else {
        sendHTML(adminChatBot, `В базе c данным ID записи отсутствуют`)
    }
}
async function adminGetChatUsers(byId, chatId, msgId) {
    let chat = await Chat.findById(byId)
    const userIds = chat.userId.concat(chat.userIdLeft, chat.userIdKick, chat.userIdDel)
    if (chat){
        bot.getChat(chat.chatId)
            .then(c=>{
                adminChatList(byId, chatId, c.id, chat.chatTitle, userIds, msgId)
            })
            .catch(e=>{
                const error = e.response.request.response.body.description
                let text
                if (error === 'Bad Request: chat not found'){
                    text = `<b>Бот исключен из чата</b>\n<b>Удалить документ?</b> /delchat_${byId}`
                    adminChatListDB(chatId, chat.chatTitle, chat.userId, text, msgId)
                }
            })
    } else {
        sendHTML(chatId, `Документ с данным ID в базе не найден`, msgId)
    }
}
async function adminDeleteChatDB(byId, chatId, msgId) {
    const check = await Chat.findById(byId)
    if (check) {
        const del = await Chat.findByIdAndDelete(byId)
        if (del) {
            if (del.chatNikName){
                sendHTML(chatId, `Чат <b>@${del.chatNikName}</b> с ID документом: <b>${byId}</b> удален из базы`)
            } else {
                sendHTML(chatId, `Чат <b>${del.chatTitle}</b> с ID документом: <b>${byId}</b> удален из базы`)
            }
        } else {
            sendHTML(chatId, `Ошибка удаления`)
        }
    } else {
        sendHTML(chatId, `Документ с данным ID в базе не найден`, msgId)
    }
}
async function adminDeleteUserDB(byId, chatId, msgId) {
    const check = await User.findById(byId)
    if (check) {
        const del = await User.findByIdAndDelete(byId)
        if (del) {
            sendHTML(chatId, `Пользователь <b>@${del.nikName}</b> с ID документом: <b>${byId}</b> удален из базы`)
        } else {
            sendHTML(chatId, `Ошибка удаления`)
        }
    } else {
        sendHTML(chatId, `Документ с данным ID в базе не найден`, msgId)
    }
}
async function adminMessageChats(text) {
    const chats = await Chat.find()
    chats.map(chat => {
        bot.getChat(chat.chatId)
            .then(c=>{
                sendHTML(c.id, text)
            })
            .catch(e=>{
                const error = e.response.request.response.body.description
                let text
                if (error === 'Bad Request: chat not found'){
                    text = `Бот исключен из чата`
                    // console.log(text)
                }
            })
    })
}

//-------------------------------------Test Function---------------------------------------------
