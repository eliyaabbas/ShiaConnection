# Job Service

**Service name:** Job Service

**Service description:** Provides a job board mechanism where Recruiter roles can post job listings, and job seekers (Professionals/Students) can apply with documents.

**Service endpoints:** 
(Firestore SDK/Functions)
- `GET /jobs` - Filterable paginated list of active jobs
- `POST /jobs` - Post a new job (Recruiters only)
- `POST /jobs/{jobId}/apply` - Candidate appends application to job
- `GET /jobs/{jobId}/applications` - Recruiter views candidate packets

**Service database schema:** 
Firestore Collection: `jobs`
Fields:
- `recruiterId` (string)
- `title` (string)
- `description` (long text string)
- `requirements` (array of strings)
- `salaryRange` (string)
- `createdAt` (timestamp)
- `isActive` (boolean)

Subcollection: `applications`
Fields:
- `applicantId` (string)
- `resumeUrl` (Firebase Storage reference)
- `coverLetter` (text)
- `status` ('applied', 'reviewed', 'archived', 'rejected')

**Service security rules:** 
```javascript
match /jobs/{jobId} {
  allow read: if request.auth != null; // Everyone can see active jobs
  // Only Recruiters can author job postings
  allow create, update, delete: if request.auth != null && 
                                request.auth.token.role == 'Recruiter' && 
                                request.resource.data.recruiterId == request.auth.uid;
  
  match /applications/{appId} {
    // Applicants drop their data, Recruiters & the specific Applicant can read
    allow create: if request.auth != null && request.auth.uid == request.resource.data.applicantId;
    allow read: if request.auth != null && (
      request.auth.uid == resource.data.applicantId || 
      request.auth.uid == get(/databases/$(database)/documents/jobs/$(jobId)).data.recruiterId
    );
  }
}
```

**Service testing procedures:** 
- Write unit test checking access denial if a 'Student' tries writing to the `/jobs` collection.
- Test large file submission workflows in the `resumeUrl` mechanism (Storage + Firestore linking).
- Confirm applicant cannot overwrite or spoof applications for others.
