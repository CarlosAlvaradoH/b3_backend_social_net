// Metodo de prueba del controlador user
export const testUser = (req, res) => {
    return res.status(200).send({
        mesaage: "Mensaje enviado desde el controlador de usuarios"
    })
};
