import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as heicConvert from 'heic-convert';
import admin from 'firebase-admin';
import RetryHelper from '../../helpers/retry';
const sharp = require('sharp');

const serviceAccount = require('../../../firebase-admin-credential.json');

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name); // Create a logger instance
  private firebaseApp: admin.app.App;
  private fireStore: FirebaseFirestore.Firestore;
  private storage: admin.storage.Storage;

  constructor(
    private readonly configService: ConfigService,
    private readonly retryHelper: RetryHelper,
  ) {
    this.retryHelper = new RetryHelper(3, 1000);
  }

  async onModuleInit() {
    try {
      // Retry Firebase initialization
      await this.retryHelper.execute(async () => {
        if (admin.apps.length === 0) {
          const databaseURL = this.configService.get<string>(
            'FIREBASE_DATABASE_URL',
          );
          const storageBucket = this.configService.get<string>(
            'FIREBASE_STORAGE_BUCKET',
          );

          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket,
            databaseURL,
          });
          this.logger.log('Firebase App initialized successfully.');
        } else {
          const app = admin.apps[0];
          if (app) {
            this.firebaseApp = app;
            this.logger.log(
              'Firebase App already initialized. Using existing app.',
            );
          } else {
            throw new Error(
              'Firebase app initialization failed. No apps available.',
            );
          }
        }

        this.fireStore = admin.firestore();
        this.storage = admin.storage();
      });
    } catch (error) {
      this.logger.error(
        'Firebase initialization failed after retries',
        error.stack,
      );
      throw error; // Rethrow after logging
    }
  }

  public async uploadFile(
    file: Express.Multer.File, // Use express.Multer.File type
    options: {
      destinationPath?: string; // Optional: custom destination path
      resizeWidth?: number; // Optional: resize width
      resizeHeight?: number; // Optional: resize height
      quality?: number; // Optional: image quality for compression (0-100)
    } = {}, // Default empty options object
  ): Promise<string | undefined> {
    try {
      let fileBuffer: Buffer;
      let destinationPath: string;
      let contentType: string;

      console.log('options', options);

      // Set the destination path, default to a folder structure if not provided
      destinationPath =
        options.destinationPath && options.destinationPath.trim() !== ''
          ? options.destinationPath
          : 'uploads';

      // Default resize dimensions (optional resizing)
      const resizeWidth =
        options.resizeWidth &&
        !isNaN(Number(options.resizeWidth)) &&
        Number(options.resizeWidth) > 1
          ? Number(options.resizeWidth)
          : 800; // Default to 800px if not specified or invalid value

      const resizeHeight =
        options.resizeHeight &&
        !isNaN(Number(options.resizeHeight)) &&
        Number(options.resizeHeight) > 1
          ? Number(options.resizeHeight)
          : null; // No resizing on height by default if it's not a valid value

      const quality =
        options.quality &&
        !isNaN(Number(options.quality)) &&
        Number(options.quality) > 1 &&
        Number(options.quality) <= 100
          ? Number(options.quality)
          : 80; // Default to 80% quality if not provided or invalid value

      // Check if the file is an image (JPEG, PNG, GIF, HEIC, etc.)
      if (file.mimetype.startsWith('image/')) {
        if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
          // Convert HEIC to PNG using heic-convert
          const convertedImage = await heicConvert({
            buffer: file.buffer,
            format: 'PNG',
          });

          // Resize and convert to PNG with sharp
          fileBuffer = await sharp(convertedImage)
            .resize(resizeWidth, resizeHeight) // Resize image to specified dimensions
            .png({ quality }) // Convert to PNG with specified quality
            .toBuffer();
          contentType = 'image/png';
          destinationPath = `${destinationPath}/${Date.now()}.png`;
        } else {
          // If it's an image (JPEG, PNG, etc.), compress and resize
          fileBuffer = await sharp(file.buffer)
            .resize(resizeWidth, resizeHeight) // Resize image to specified dimensions
            .toFormat('png', { quality }) // Convert to PNG with specified quality
            .toBuffer();
          contentType = 'image/png';
          destinationPath = `${destinationPath}/${file.originalname.split('.')[1]}`;
        }
      } else {
        // For non-image files (PDFs, documents, etc.), handle them as regular files
        fileBuffer = file.buffer;
        contentType = file.mimetype; // Use the original content type
        destinationPath = `${destinationPath}/${Date.now()}.${file.originalname.split('.')[1]}`;
      }

      // Execute retry logic if necessary
      const fileUrl = await this.retryHelper.execute(async () => {
        const bucket = this.storage.bucket();
        const fileRef = bucket.file(destinationPath);

        // Upload the processed file/image to Firebase Storage
        await fileRef.save(fileBuffer, {
          resumable: false,
          contentType, // Set the appropriate content type (image/png, application/pdf, etc.)
          metadata: {
            firebaseStorageDownloadTokens: destinationPath, // Set a token for download
          },
        });

        // Get the signed URL for accessing the file
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: '01-01-2030', // Set a long expiration for access
        });

        return url;
      });

      if (!fileUrl) {
        throw new Error('File URL generation failed');
      }

      this.logger.log('File uploaded successfully! File URL:', fileUrl);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading file:', error.message || error);
      return undefined; // Return undefined in case of failure
    }
  }
}
