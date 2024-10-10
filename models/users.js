import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const UserSchema = Schema ({
    name:{
        type: String,
        requiere: true
    },
    last_name:{
        type: String,
        requiere: true
    },
    nick: {
        type: String,
        requiere: true,
        unique: true
    },
    email: {
        type: String,
        requiere: true,
        unique:true
    },
    bio: String,
    password: {
        type: String,
        requiere: true
    },
    role: {
        type: String,
        default: "role_user"
    },
    image: {
        type: String,
        default: "default_user.png"
    },
    create_at: {
        type: Date,
        defaulr: Date.now
    }
});

//Configurar plugin de paginacion de Mongo
UserSchema.plugin(mongoosePaginate);

export default model("User", UserSchema, "users")