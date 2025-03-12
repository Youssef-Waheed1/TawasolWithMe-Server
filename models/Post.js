const mongoose = require("mongoose");
// create the schema
//Schema عباره عن object من ضمن ال  mongoose library
const PostSchema = new mongoose.Schema({
    // اضافه ال fields
    user: { //ضيفت key اسمه user وال value بتاعتها عباره عن object 
        // هنربط ال Post model مع ال User model عشان نعرف كل post مين عمله create
        // هنحط ال userid كأنه Foreign Key
        type: mongoose.Schema.Types.ObjectId
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    likes: [  
        {  //عملت array وكل array هيكون فيها object وبدخله key اسمه user وال value بتاعه ال user 
            user: {
                type: mongoose.Schema.Types.ObjectId   //بربط كل like بال user والربط هيكون من خلال ال user_id
            }
        }
    ],
    comments: [   //عباره عن array لان كل post ممكن يحتوي علي اكثر من Comment
        {
            user: {
                type: mongoose.Schema.Types.ObjectId
            },
            text: {
                type: String,
                required: true
            },
            name: {
                type: String
            },
            date: {    //عاوز اعمل date لكل comment 
                type: Date,
                default: Date.now
            }
        }
    ],
    date: {   //عاوز اعمل date لكل post 
        type: Date,
        default: Date.now
    }
})

module.exports = Post = mongoose.model("post", PostSchema);