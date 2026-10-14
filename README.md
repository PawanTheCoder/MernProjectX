# Campusly Student Management

A MERN application for managing a student directory. The React dashboard supports adding, searching, filtering, editing, and deleting student records. Express and Mongoose expose the API and store records in MongoDB.

## Requirements

- Node.js 18 or newer
- MongoDB connection string

## Configure

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/student-management
PORT=3000
```

Use your own MongoDB URI. Keep `.env` private; it is excluded from version control.

## Run in development

```powershell
npm install
npm install --prefix client
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` requests to the Express server on port 3000.

## Build and run

```powershell
npm run build
npm start
```

Open <http://localhost:3000>. Express serves the production frontend from `client/dist`.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/students` | List students |
| GET | `/api/students/:id` | Get a student |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

Student records contain `name`, `age`, and `course`. The original `/students` endpoints remain available for compatibility.
