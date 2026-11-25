// Life cycle: UPLOADED -> PROCESSING -> PROCESSED, or FAILED if something went wrong.
export type DocumentStatus = "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";

// A document as returned by the API. Dates come as ISO strings; uploadedBy may be missing.
export type ProjectDocument = {
  id: string;
  projectId: string;
  fileName: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
};
