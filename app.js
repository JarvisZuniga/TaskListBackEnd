const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conexión exitosa a MongoDB Atlas'))
    .catch(err => console.error('Error de conexión a MongoDB Atlas:', err));

// Middleware para verificar el token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ error: 'Token JWT no proporcionado' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token JWT inválido' });
        }
        req.user = user;
        next();
    });
}

// Esquema de Usuario
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

// Esquema de Tarea
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

app.use(express.json());

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }
        // Crear un nuevo usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        // Generar token JWT
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Ruta para hacer login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Verificar si el usuario existe
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
        }
        // Verificar la contraseña
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
        }
        // Generar token JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al hacer login' });
    }
});

//CRUD
// Ruta para crear una nueva tarea
app.post('/tasks', async (req, res) => {
    try {
        const { title, description, completed, userId } = req.body;
        const task = new Task({
            title,
            description,
            completed,
            user: userId
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear tarea' });
    }
});

// Ruta para obtener todas las tareas de un usuario
app.get('/tasks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = await Task.find({ user: userId });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// Ruta para actualizar una tarea
app.put('/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, completed } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(taskId, {
            title,
            description,
            completed
        }, { new: true });
        res.json(updatedTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// Ruta para eliminar una tarea
app.delete('/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const deletedTask = await Task.findByIdAndDelete(taskId);
        if (!deletedTask) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        res.json({ message: 'Tarea eliminada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
