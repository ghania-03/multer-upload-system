# Multer Upload System

A full-stack file upload application built with React, Express, Multer, MongoDB, and Cloudinary. It provides a simple interface for uploading a profile image and managing user documents, with uploaded file metadata stored in MongoDB and file content stored in Cloudinary.

## Features

- Upload and replace a profile image.
- Upload up to five documents per request.
- Accept PDF, JPG, JPEG, and PNG documents.
- View uploaded profile images and documents.
- Rename and delete uploaded documents.
- Validate file types and enforce upload size limits.
- Store files in Cloudinary and associate their URLs and metadata with a MongoDB user record.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Axios |
| Backend | Node.js, Express 5, Multer |
| Database | MongoDB, Mongoose |
| File storage | Cloudinary |

## Project Structure

```text
multer-upload-system/
├── backend/
│   ├── config/          # MongoDB and Cloudinary setup
│   ├── controllers/     # Upload and document operations
│   ├── middleware/     # Multer configuration and file validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Upload API routes
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Profile and document upload forms
        └── App.jsx
```

## Prerequisites

- Node.js 24.x
- npm
- A MongoDB instance (local or hosted)
- A Cloudinary account

## Getting Started

### 1. Configure the backend

From the project root, install the backend dependencies:

```bash
cd backend
npm install
```

Add the following variables to `backend/.env` and replace the placeholders with your own values:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/multer-upload-system
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the API:

```bash
npm run dev
```

The backend runs at `http://localhost:5000` by default. Use `npm start` to start it without Nodemon.

### 2. Configure the frontend

In a second terminal opened at the project root, install the frontend dependencies:

```bash
cd frontend
npm install
```

Create `frontend/.env` with the API base URL:

```dotenv
VITE_API_URL=http://localhost:5000/api/uploads
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite in your browser. If you change the frontend environment variables, restart the Vite server.

## API

All upload routes are mounted under `/api/uploads`.

| Method | Endpoint | Description | Request |
| --- | --- | --- | --- |
| `GET` | `/` | API health check | — |
| `GET` | `/api/uploads/me` | Get the demo user's profile and document metadata | — |
| `POST` | `/api/uploads/profile` | Upload or replace the profile image | `multipart/form-data`, file field: `profile` |
| `POST` | `/api/uploads/documents` | Upload documents | `multipart/form-data`, repeated file field: `documents` |
| `PATCH` | `/api/uploads/documents/:documentId/rename` | Rename a document | JSON: `{ "newName": "report.pdf" }` |
| `DELETE` | `/api/uploads/documents/:documentId` | Delete a document | — |

### Upload limits and file types

- Profile images: image MIME types, maximum size **2 MB**.
- Documents: PDF, JPEG, or PNG, maximum size **10 MB per file**.
- Up to **5 documents** per request.

## Demo User

The backend currently assigns requests to a built-in test user (`John Doe`, `john@example.com`). This is intended for development and demonstration: authentication and per-user authorization are not implemented. Add an authentication and authorization layer before using this project with real users or private uploads.

## Scripts

Run each command from its respective directory (`backend/` or `frontend/`).

| Directory | Command | Description |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start the API with Nodemon |
| `backend/` | `npm start` | Start the API |
| `frontend/` | `npm run dev` | Start the Vite development server |
| `frontend/` | `npm run build` | Build the frontend for production |
| `frontend/` | `npm run lint` | Run ESLint |

## Deployment

The backend includes a Vercel configuration in `backend/vercel.json`. Configure the backend environment variables in the hosting provider and set the frontend's `VITE_API_URL` to the deployed API base URL (including `/api/uploads`). The frontend can be deployed to any static hosting provider that supports Vite builds.

## License

This project is currently marked as ISC in the backend package metadata.
