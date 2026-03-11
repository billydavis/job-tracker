export interface Company {
    _id?: string;
    userId: string; // reference to User._id
    name: string;
    website?: string;
    description?: string;
    createdAt?: string;
}