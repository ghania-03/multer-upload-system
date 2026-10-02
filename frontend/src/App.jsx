import { useState } from "react";
import api from "./api";
import ProfileUpload from "./components/ProfileUpload";
import DocumentUpload from "./components/DocumentUpload";
import "./App.css";


function App() {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await api.get("/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  return (
    <div className="app">
      <h1>Multer File Upload System</h1>

      <ProfileUpload onUpload={fetchUser} />

      <DocumentUpload documents={user?.documents || []} onUpload={fetchUser} />

      <button className="load-button" onClick={fetchUser}>
        Load User Data
      </button>

      {user && (
        <section className="user-data">
          <h2>User Data</h2>

          <p>
            <strong>Name:</strong> {user.fullName}
          </p>

          <p>
            <strong>Email:</strong> {user.email}
          </p>

          {user.profileImage && (
            <div className="profile-preview">
              <h3>Profile Image</h3>
              <img src={user.profileImage} alt="Profile" />
            </div>
          )}

          {user.documents.length > 0 && (
            <div>
              <h3>Documents</h3>

              <ul>
                {user.documents.map((document) => (
                  <li key={document._id}>
                    <a href={document.url} target="_blank" rel="noreferrer">
                      {document.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
