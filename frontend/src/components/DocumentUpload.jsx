import { useState } from "react";
import api from "../api";

function DocumentUpload({ documents, onUpload }) {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const uploadFile = async (file, replace = false) => {
    const formData = new FormData();

    formData.append("documents", file);

    const url = replace ? "/documents?replace=true" : "/documents";

    return api.post(url, formData);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (files.length === 0) {
      setMessage("Please select at least one document.");
      return;
    }

    if (files.length > 5) {
      setMessage("You can upload a maximum of 5 documents.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      for (const file of Array.from(files)) {
        const existingDocument = documents.find(
          (document) => document.originalName === file.name,
        );

        if (existingDocument) {
          const shouldReplace = window.confirm(
            `"${file.name}" already exists. Do you want to replace the existing file?`,
          );

          if (!shouldReplace) {
            continue;
          }

          await uploadFile(file, true);
        } else {
          await uploadFile(file);
        }
      }

      setMessage("Documents uploaded successfully.");

      setFiles([]);

      event.target.reset();

      onUpload();
    } catch (error) {
      console.error("Document upload error:", error);

      setMessage(
        error.response?.data?.message ||
          "Document upload failed. Check the backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (documentId, currentName) => {
    const newName = window.prompt("Enter the new file name:", currentName);

    if (!newName || !newName.trim()) {
      return;
    }

    try {
      setMessage("");

      const response = await api.patch(`/documents/${documentId}/rename`, {
        newName: newName.trim(),
      });

      setMessage(response.data.message);

      onUpload();
    } catch (error) {
      console.error("Rename document error:", error);

      setMessage(error.response?.data?.message || "Document rename failed.");
    }
  };

  const handleDelete = async (documentId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this document?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(documentId);
      setMessage("");

      const response = await api.delete(`/documents/${documentId}`);

      setMessage(response.data.message);

      onUpload();
    } catch (error) {
      console.error("Document delete error:", error);

      setMessage(error.response?.data?.message || "Document deletion failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="upload-section">
      <h2>Documents</h2>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(event) => {
            setFiles(event.target.files);
            setMessage("");
          }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Documents"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <div>
        <h3>Uploaded Documents</h3>

        {documents.length === 0 ? (
          <p>No documents uploaded.</p>
        ) : (
          <ul>
            {documents.map((document) => (
              <li key={document._id}>
                <a href={document.url} target="_blank" rel="noreferrer">
                  {document.originalName}
                </a>

                <button
                  type="button"
                   className="rename-button"
                  onClick={() =>
                    handleRename(document._id, document.originalName)
                  }
                >
                  Rename
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(document._id)}
                  disabled={deletingId === document._id}
                  className="delete-button"
                >
                  {deletingId === document._id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default DocumentUpload;
