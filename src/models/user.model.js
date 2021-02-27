const mongoose = require('mongoose');
const Shema = mongoose.Schema;

const UserShema = new Shema({
    userId: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    nikName: {
        type: String
    },
    TIM: {
        type: String
    },
    PI: {
        type: String
    },
    comment: {
      type: String
    },
    chats: {
        type: [],
        default: []
    }
});

mongoose.model('users', UserShema);