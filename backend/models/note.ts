export interface Note {
    _id?: string;
    jobId: string; // reference to Job._id
    content: string;
    createdAt?: string;
}