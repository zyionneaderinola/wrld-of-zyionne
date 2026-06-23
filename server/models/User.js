const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  appearance: {
   mode: {
      type: String,
     enum: ['light', 'dark'],
     default: 'dark'
    },
    primaryColor: {
      type: String,
      default: '#FFD700'
    },
   backgroundColor: {
      type: String,
     default: '#0D0D0D'
    },
    accentColor: {
      type: String,
      default: '#FFD700'
   },
   font: {
      type: String,
     default: 'Montserrat'   // ← confirm this is here
    },
   typingFont: {
      type: String,
     default: 'Montserrat'   // ← and this
   },
    customFontUrl: {
      type: String,
     default: ''
   }
  },
  verified: {
    type: Boolean,
    default: false
  },
  friendId: {
    type: String,
    unique: true,
    sparse: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    initiatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'default'
  },
  pinnedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  closeFriends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  activityStatus: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  profileViews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  postSchedule: [{
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    publishAt: {
      type: Date
    }
  }],
  analytics: [{
    totalImpressions: { type: Number, default: 0 },
    totalReach: { type: Number, default: 0 },
    totalProfileVisits: { type: Number, default: 0 }
  }],

  worlds: [{
    type: String,
    enum: [
      'stem',
      'arts_humanities',
      'finance',
      'law',
      'business',
      'medicine_health',
      'education',
      'creative',
      'sports',
      'gaming',
      'faith_spirituality',
      'politics_society',
      'entertainment',
      'food',
      'travel',
      'careers',
      'kids',
    ]
  }],
  careerProfile: {
    sector: { type: String, default: '' },
    role: { type: String, default: '' },
    experience: {
      type: String,
      enum: [
        'student',
        'entry_level',
        'mid_level',
        'senior',
        'executive',
        'freelance',
        'entrepreneur',
        'not_sure'
      ],
    default: 'not_sure'
  },

  purpose: [{
   type: String,
    enum: [
      'just_having_fun',
      'building_career',
      'learning',
      'networking',
      'building_business',
      'creating_content',
     'finding_community',
      'dating',
      'shopping',
      'staying_informed',
      'fitness',
      'gaming',
      'finding_work',
      'mentoring_others',
      'being_mentored',
     'exploring'
    ]
  }],
  skills: [{ type: String }],
  open_to_opportunities: { type: Boolean, default: false }
},
interests: [{ type: String }],
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)