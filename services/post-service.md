# Post Service

**Service name:** Post Service

**Service description:** Manages the system's core content generation features: text posts, long-form articles, multimedia attachments, and user engagement (likes, comments).

**Service endpoints:** 
(Firestore Subscriptions and Mutations)
- `GET /posts` - Fetch infinite scrolling feed (paginated)
- `POST /posts` - Publish new post/article
- `DELETE /posts/{postId}` - Remove content
- `POST /posts/{postId}/like` - Toggle like status
- `POST /posts/{postId}/comments` - Add a comment to an existing post

**Service database schema:** 
Firestore Collection: `posts`
Fields:
- `authorId` (string)
- `content` (string)
- `mediaUrls` (array of Firebase Storage URLs)
- `type` ('post', 'article')
- `createdAt` (timestamp)
- `likesCount` (number)
- `commentsCount` (number)
Subcollections: `comments`, `likes`

**Service security rules:** 
```javascript
match /posts/{postId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.authorId == request.auth.uid;
  allow update, delete: if request.auth != null && resource.data.authorId == request.auth.uid; // Only author can alter content
}
```

**Service testing procedures:** 
- Verify descending timestamp ordering for the feed using query limits and pagination cursors.
- Write tests confirming non-authors cannot edit/delete posts.
- Perform high concurrency testing on `likesCount` updates utilizing Firestore FieldValue increments.
