import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SaveRoomImageResponse {
  roomId: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoomDesignApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Uploads the room image with dimensions as multipart/form-data.
   */
  uploadRoomImage(file: File, width: number, length: number, height: number): Observable<SaveRoomImageResponse> {
    const formData = new FormData();
    formData.append('EmptyRoom', file, file.name);
    formData.append('Width', String(width));
    formData.append('Length', String(length));
    formData.append('Height', String(height));

    return this.http.post<SaveRoomImageResponse>(`${this.apiUrl}room-design/save-image`, formData);
  }
}
