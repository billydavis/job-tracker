export interface Job {
    _id?: string;
    userId: string; // owner user id (reference to User._id)
    companyId: string; // reference to Company._id
    title: string;
    description?: string;
    contact?: string;
    location: 'on-site' | 'remote' | 'hybrid';
    salary?: number;
    url?: string;
    status: 'waiting' | 'applied' | 'interview' | 'offer' | 'negotiation' | 'rejected' | 'ghosted';
    dateApplied?: string; // ISO date string
    createdAt?: string;
}