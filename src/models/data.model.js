const mongoose = require('mongoose');
const Shema = mongoose.Schema;

const UserShema = new Shema({
    userId: {
        type: Number,
        required: true
    },
    chatId: {
        type: Number,
        required: true
    },
    reputation: {
        type: Number,
        default: 0
    },
    date: {
        type: Number,
        default: 0
    },
    dateRep: {
        type: Number,
        default: 0
    },
    reminder: {
        type: Boolean,
        default: false
    },
    level: {
        type: Number,
        default: 0
    },
    carma: {
        type: Number,
        default: 0
    }
});

mongoose.model('usrData', UserShema);