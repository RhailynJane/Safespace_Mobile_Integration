const db = require('./db'); 
const fs = require('fs');
const path = require('path');

interface FileInfo {
  message_id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
}

class FileUploadService {
  
  // Save file information to database
  async saveFileUpload(fileInfo: FileInfo) {
    const {
      message_id,
      original_name,
      stored_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by
    } = fileInfo;

    const query = `
      INSERT INTO file_uploads 
        (message_id, original_name, stored_name, file_path, file_size, mime_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      message_id,
      original_name,
      stored_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Update message with file attachment info
  async updateMessageWithAttachment(messageId: string, attachmentInfo: { attachment_url: string; file_name: string; file_size: number }) {
    const {
      attachment_url,
      file_name,
      file_size
    } = attachmentInfo;

    const query = `
      UPDATE messages 
      SET 
        attachment_url = $1,
        file_name = $2,
        file_size = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const values = [
      attachment_url,
      file_name,
      file_size,
      messageId
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Get file upload by message ID
  async getFileUploadByMessageId(messageId: string) {
    const query = `
      SELECT * FROM file_uploads 
      WHERE message_id = $1 AND deleted_at IS NULL
    `;
    
    const result = await db.query(query, [messageId]);
    return result.rows[0];
  }

  // Delete file upload (soft delete)
  async softDeleteFileUpload(uploadId: string) {
    const query = `
      UPDATE file_uploads 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await db.query(query, [uploadId]);
  }
}

module.exports = new FileUploadService();