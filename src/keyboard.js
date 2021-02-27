const kb = require('./keyboard-buttons');
module.exports = {
    home: [
            [{
                text: 'Установить ТИМ',
                callback_data: 'setTIM'
            }],
            [{
                text: 'Установить ПЙ',
                callback_data: 'setPI'
            }],
            [{
                text: 'О SocioBot`e',
                callback_data: 'about'
            }]
    ],
    kTIM: [
        [{text: 'Дон', callback_data: 'Дон Кихот'}, {text: 'Дюма', callback_data: 'Дюма'},{text: 'Гюго', callback_data: 'Гюго'}, {text: 'Роб', callback_data: 'Робеспьер'}],
        [{text: 'Гам', callback_data: 'Гамлет'}, {text: 'Макс', callback_data: 'Максим Горький'},{text: 'Жук', callback_data: 'Маршал Жуков'}, {text: 'Есь', callback_data: 'Есенин'}],
        [{text: 'Нап', callback_data: 'Наполеон'}, {text: 'Баль', callback_data: 'Бальзак'},{text: 'Джек', callback_data: 'Джек Лондон'}, {text: 'Драй', callback_data: 'Драйзер'}],
        [{text: 'Штир', callback_data: 'Штирлиц'}, {text: 'Дост', callback_data: 'Достоевский'},{text: 'Гек', callback_data: 'Гексли'}, {text: 'Габен', callback_data: 'Габен'}],

        [{text: 'Назад', callback_data: 'back'}]
    ],
    kPI: [
        [{text: 'ВЛЭФ - Сократ', callback_data: 'Сократ (ВЛЭФ)'}, {text: 'ЛФЭВ - Бертье', callback_data: 'Бертье (ЛФЭВ)'}],
        [{text: 'ВЭЛФ - Ахматова', callback_data: 'Ахматова (ВЭЛФ)'}, {text: 'ЛЭВФ - Паскаль', callback_data: 'Паскаль (ЛЭВФ)'}],
        [{text: 'ВФЭЛ - Твардовский', callback_data: 'Твардовский (ВФЭЛ)'}, {text: 'ЛФВЭ - Платон', callback_data: 'Платон (ЛФВЭ)'}],
        [{text: 'ВФЛЭ - Наполеон', callback_data: 'Наполеон (ВФЛЭ)'}, {text: 'ЛВЭФ - Эйнштейн', callback_data: 'Эйнштейн (ЛВЭФ)'}],
        [{text: 'ВЭФЛ - Толстой', callback_data: 'Толстой (ВЭФЛ)'}, {text: 'ЛВФЭ - Лао Цзы', callback_data: 'Лао Цзы (ЛВФЭ)'}],
        [{text: 'ВЛФЭ - Ленин', callback_data: 'Ленин (ВЛФЭ)'}, {text: 'ЛЭФВ - Августин', callback_data: 'Августин (ЛЭФВ)'}],
        [{text: 'ЭФЛВ - Бухарин', callback_data: 'Бухарин (ЭФЛВ)'}, {text: 'ФЛВЭ - Аристипп', callback_data: 'Аристипп (ФЛВЭ)'}],
        [{text: 'ЭЛВФ - Андерсен', callback_data: 'Андерсен( ЭЛВФ)'}, {text: 'ФВЭЛ - Чехов', callback_data: 'Чехов (ФВЭЛ)'}],
        [{text: 'ЭВЛФ - Газали', callback_data: 'Газали (ЭВЛФ)'}, {text: 'ФЭВЛ - Дюма', callback_data: 'Дюма (ФЭВЛ)'}],
        [{text: 'ЭВФЛ - Пастернак', callback_data: 'Пастернак (ЭВФЛ)'}, {text: 'ФЛЭВ - Эпикур', callback_data: 'Эпикур (ФЛЭВ)'}],
        [{text: 'ЭЛФВ - Руссо', callback_data: 'Руссо (ЭЛФВ)'}, {text: 'ФЭЛВ - Борджа', callback_data: 'Борджа (ФЭЛВ)'}],
        [{text: 'ЭФВЛ - Пушкин', callback_data: 'Пушкин (ЭФВЛ)'}, {text: 'ФВЛЭ - Гёте', callback_data: 'Гёте (ФВЛЭ)'}],

        [{text: 'Назад', callback_data: 'back'}]
    ]
};