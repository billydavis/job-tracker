export type JobSalaryPeriod = 'yearly' | 'hourly';

/** At least one of lowEnd / highEnd should be set when this object is stored. */
export interface JobSalaryRange {
    lowEnd?: number;
    highEnd?: number;
    period: JobSalaryPeriod;
}

export interface Job {
    _id?: string;
    userId: string; // owner user id (reference to User._id)
    companyId: string; // reference to Company._id
    title: string;
    description?: string;
    contact?: string;
    location: 'on-site' | 'remote' | 'hybrid';
    /** Legacy single value; prefer salaryRange for new data. */
    salary?: number;
    salaryRange?: JobSalaryRange;
    url?: string;
    status: 'waiting' | 'applied' | 'interview' | 'offer' | 'negotiation' | 'rejected' | 'ghosted';
    dateApplied?: string; // ISO date string
    createdAt?: string;
}