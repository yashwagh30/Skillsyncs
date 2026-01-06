import { type User, type InsertUser, type InterviewInput } from "@shared/schema";
import mongoose, { Schema, Document } from "mongoose";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  createInterview(userId: string, interview: InterviewInput & { score: number, feedback: string }): Promise<any>;
  getInterviews(userId: string): Promise<any[]>;
}

// Mongoose Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  industry: { type: String, default: null },
  experienceLevel: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const AnswerSchema = new Schema({
  questionId: { type: String, required: true },
  text: { type: String, required: true },
  audio: { type: String } // Base64
});

const InterviewSchema = new Schema({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  answers: [AnswerSchema],
  score: { type: Number, required: true },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Transform _id to id
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const UserModel = mongoose.model("User", UserSchema);
const InterviewModel = mongoose.model("Interview", InterviewSchema);

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
      const user = await UserModel.findById(id);
      return user ? (user.toJSON() as unknown as User) : undefined;
    } catch (err) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email });
    return user ? (user.toJSON() as unknown as User) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel(insertUser);
    await user.save();
    return user.toJSON() as unknown as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
    return user ? (user.toJSON() as unknown as User) : undefined;
  }

  async createInterview(userId: string, interview: InterviewInput & { score: number, feedback: string }): Promise<any> {
    const newInterview = new InterviewModel({
      userId,
      ...interview
    });
    await newInterview.save();
    return newInterview.toJSON();
  }

  async getInterviews(userId: string): Promise<any[]> {
    return InterviewModel.find({ userId }).sort({ createdAt: -1 });
  }
}

export const storage = new MongoStorage();
