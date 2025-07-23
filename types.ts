
export interface SignVideo {
  id: string;
  dataUrl: string; // Base64 encoded video data or Blob URL
  timestamp: number;
}

export interface Word {
  id: string;
  name: string;
  signs: SignVideo[];
}
