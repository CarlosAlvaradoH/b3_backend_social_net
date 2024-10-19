import jwt from "jwt-simple";
import moment from "moment";

//Clave secreta para poder generar le token
const secret = "CL4V3_S3CR3T4_R3D_S0C14L";

//Metodo para generar tokens
const createToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    iat: moment.unix(),
    exp: moment().add(7, "days").unix()
  };

  //Devolver Token codificaco
  return jwt.encode(payload, secret);
};

export {
    secret,
    createToken
};
