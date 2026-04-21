import api from "./api";

/**
 * Uploads a file (blob) to Google Drive.
 * Requires the user to have authorized the Google Drive scope.
 */
export async function uploadToGoogleDrive(blob: Blob, filename: string, accessToken: string) {
    const metadata = {
        name: filename,
        mimeType: blob.type,
    };

    const formData = new FormData();
    formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formData.append("file", blob);

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to upload to Google Drive");
    }

    return response.json();
}
