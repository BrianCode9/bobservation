// userProfile.ts — type definitions + re-exports from db.ts
//
// All persistence now goes through IndexedDB (db.ts).

export interface LikedQuestion {
  question: string;
  company: string;
  role: string;
  likedAt: string;
}

export interface UserProfile {
  name: string;
  targetRole: string;
  likedQuestions: LikedQuestion[];
}

// Re-export all async DB helpers under the same names
export {
  loadProfile,
  saveProfile,
  updateProfile,
  likeQuestion,
  unlikeQuestion,
  isQuestionLiked,
} from './db';
