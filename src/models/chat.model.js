const mongoose = require('mongoose');
const Shema = mongoose.Schema;

const ChatShema = new Shema({
    chatId: {
        type: Number,
        required: true
    },
    chatTitle: {
        type: String,
        required: true
    },
    chatNikName: {
        type:String
    },
    userId: {
        type: [Number],
        default: []
    },
    userIdLeft: {
        type: [Number],
        default: []
    },
    userIdKick: {
        type: [Number],
        default: []
    },
    userIdDel: {
        type: [Number],
        default: []
    },
    welcome: {
        type: String
    },
    welcomeMsgId: {
        type: Number
    },
    rulesMsgId: {
        type: Number
    },
    notActivUser: {
        type: Boolean,
        default: false
    },
    reminderDay: {
        type: Number,
        default: 30
    },
    reputation: {
        type: Boolean,
        default: false
    },
    level: {
        type: Boolean,
        default: false
    },
    cleanData: {
        type: Boolean,
        default: false
    },
    count: {
        type: Number,
        default: 0
    }
});
mongoose.model('chats', ChatShema);