const express = require('express');
const mongoose = require('mongoose');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10kb' }));

const studentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        age: { type: Number, required: true, min: 1, max: 120 },
        course: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);
const studentsRouter = express.Router();

studentsRouter.post('/', async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

studentsRouter.get('/', async (_req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

studentsRouter.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

studentsRouter.put('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

studentsRouter.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.use('/api/students', studentsRouter);
app.use('/students', studentsRouter);

const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
}

app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

app.get(/.*/, (_req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.status(404).send('Frontend build not found. Start the Vite development server or run npm run build.');
});

async function startServer() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing. Add it to the .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
}

if (require.main === module) {
    startServer().catch((err) => {
        console.error('Server startup failed:', err);
        process.exit(1);
    });
}

module.exports = app;
