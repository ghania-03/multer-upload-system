import { useState } from "react";
import api from "../api";

function ProfileUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage("Please select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("profile", file);

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post("/profile", formData);

      setMessage(response.data.message);
      setFile(null);

      event.target.reset();

      onUpload();
    } catch (error) {
      console.error("Profile upload error:", error);

      setMessage(
        error.response?.data?.message ||
          "Profile upload failed. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="upload-section">
      <h2>Profile Image</h2>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            setFile(event.target.files[0]);
            setMessage("");
          }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Profile"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}

export default ProfileUpload;