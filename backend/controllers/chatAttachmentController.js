import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";
import { singleUpload } from "../middleware/multer.js";

export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    const fileUri = getDataUri(req.file);
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: "chat-attachments",
      resource_type: "auto",
    });

    return res.status(200).json({
      success: true,
      attachment: {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};

export const uploadAttachmentMiddleware = singleUpload;

