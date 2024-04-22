import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
@Injectable()
export class GoogleDriveService {
  private drive: any;
  private readonly CLIENT_ID = process.env.CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.CLIENT_SECRET;
  private readonly REDIRECT_URL = process.env.REDIRECT_URL;
  private readonly REFRESH_TOKEN = process.env.REFRESH_TOKEN;

  constructor() {
    this.initializeJwtClient();
  }

  private async initializeJwtClient() {
    const jwtClient = new google.auth.OAuth2(
      this.CLIENT_ID,
      this.CLIENT_SECRET,
      this.REDIRECT_URL,
    );
    jwtClient.setCredentials({ refresh_token: this.REFRESH_TOKEN });
    this.drive = google.drive({ version: 'v3', auth: jwtClient });
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
  ): Promise<string> {
    const originalExtension = path.extname(file.originalname);
    const fileNameWithExtension = fileName + originalExtension;

    const listResponse = await this.drive.files.list({
      q: `name='${fileNameWithExtension}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    });

    // Tạo tên file mới với phần mở rộng gốc
    const fileMetadata = {
      name: fileNameWithExtension,
    };
    const media = {
      mimeType: file.mimetype,
      body:
        // fs.createReadStream(path.join(__dirname, 'a.png')),
        new Readable({
          read() {
            this.push(file.buffer);
            this.push(null); // Khi không còn dữ liệu để đọc, đẩy null để kết thúc luồng
          },
        }),
    };

    try {
      let response;
      if (listResponse.data.files.length > 0) {
        // If file is exist
        const existingFileId = listResponse.data.files[0].id;
        response = await this.drive.files.update({
          fileId: existingFileId,
          media: media,
          resource: fileMetadata,
        });
      } else {
        response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id',
        });
      }
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      const result = await this.drive.files.get({
        fileId: response.data.id,
        fields: 'webContentLink',
      });

      console.log('File webViewLink: ', result.data.webContentLink);
      return result.data.webContentLink;
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw new Error('Unable to upload file: ' + error.message);
    }
  }
}
