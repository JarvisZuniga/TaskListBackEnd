const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
require ("dotenv").config();

app.use(express.json());
const PORT = process.env.PORT;

//uri
const uri = process.env.URI_ATLAS;
const client = new MongoClient(uri);

// Función para conectarse a la base de datos
async function connectToDatabase() {
    await client.connect();
    return client.db("task").collection("user");
}

// Ruta para obtener todos los usuarios
app.get('/', async (req, res) => {
    try {
        const collection = await connectToDatabase();
        const users = await collection.find({}).toArray();
        res.json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Ruta para crear un nuevo usuario
app.post('/', async (req, res) => {
    const newUser = req.body;
    try {
        const collection = await connectToDatabase();
        const result = await collection.insertOne(newUser);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Ruta para actualizar la contraseña o usuario
app.put('/user/:username', async (req, res) => {
    const { username } = req.params;
    const newPassword = req.body;
    try {
        const collection = await connectToDatabase();
        const result = await collection.updateOne({ username: username }, { $set: newPassword });
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
});

// Ruta para eliminar un usuario
app.delete('/user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const collection = await connectToDatabase();
        const result = await collection.deleteOne({ username: username });
        if (result.deletedCount === 1) {
            res.json({ message: 'Usuario eliminado correctamente' });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
