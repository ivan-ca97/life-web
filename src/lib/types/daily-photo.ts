export interface DailyPhoto {
  id: string;
  date: string;
  url: string;
  name: string;
  is_primary: boolean;
  created_at: string;
}

export interface DailyPhotoListResponse {
  items: DailyPhoto[];
}

export interface CreateDailyPhotoRequest {
  date: string;
  url: string;
  name?: string;
  is_primary?: boolean;
}

export interface UpdateDailyPhotoRequest {
  name?: string;
  is_primary?: boolean;
}

export interface UploadURLRequest {
  filename: string;
  content_type: string;
}

export interface UploadURLResponse {
  upload_url: string;
  public_url: string;
}
