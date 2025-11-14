import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Initial Convex schema: simple presence tracking
export default defineSchema({
	users: defineTable({
		clerkId: v.string(),
		email: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_clerkId", ["clerkId"]),
	presence: defineTable({
		userId: v.string(),
		status: v.string(), // e.g., 'online' | 'away'
		lastSeen: v.number(), // Date.now()
	})
		.index("by_userId", ["userId"]) // fast upsert by user
		.index("by_lastSeen", ["lastSeen"]), // list online recently
	conversations: defineTable({
		title: v.optional(v.string()),
		createdBy: v.string(), // clerk user id
		createdAt: v.number(),
		updatedAt: v.number(),
		participantKey: v.optional(v.string()), // sorted unique participants key for dedupe
	})
		.index("by_createdBy", ["createdBy"]) 
		.index("by_createdAt", ["createdAt"]) 
		.index("by_participantKey", ["participantKey"]),
	conversationParticipants: defineTable({
		conversationId: v.id("conversations"),
		userId: v.string(),
		role: v.optional(v.string()),
		joinedAt: v.number(),
		lastReadAt: v.optional(v.number()),
	})
		.index("by_conversation", ["conversationId"]) 
		.index("by_user", ["userId"]),
	messages: defineTable({
		conversationId: v.id("conversations"),
		senderId: v.string(),
		body: v.string(),
		// Optional attachment and metadata fields
		messageType: v.optional(v.string()), // 'text' | 'image' | 'file' etc.
		attachmentUrl: v.optional(v.string()),
		fileName: v.optional(v.string()),
		fileSize: v.optional(v.number()),
		storageId: v.optional(v.id("_storage")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_conversation", ["conversationId"]) 
		.index("by_createdAt", ["createdAt"]),
	communityPosts: defineTable({
		authorId: v.string(),
		title: v.string(),
		content: v.string(),
		category: v.optional(v.string()), // Post category (Stress, Support, Stories, etc.)
		isDraft: v.boolean(),
		imageUrls: v.optional(v.array(v.string())), // Array of image URIs (max 3)
		mood: v.optional(v.object({
			id: v.string(),
			emoji: v.string(),
			label: v.string(),
		})), // Optional mood/feeling
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_author", ["authorId"]) 
		.index("by_createdAt", ["createdAt"])
		.index("by_category", ["category", "createdAt"]),
	postReactions: defineTable({
		postId: v.id("communityPosts"),
		userId: v.string(),
		emoji: v.string(),
		createdAt: v.number(),
	})
		.index("by_post", ["postId"]) 
		.index("by_user", ["userId"])
		.index("by_user_and_post", ["userId", "postId"]),
	postBookmarks: defineTable({
		postId: v.id("communityPosts"),
		userId: v.string(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_post", ["postId"])
		.index("by_user_and_post", ["userId", "postId"]),
	
	// Mood tracking
	moods: defineTable({
		userId: v.string(),
		moodType: v.string(), // 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad'
		moodEmoji: v.optional(v.string()),
		moodLabel: v.optional(v.string()),
		intensity: v.optional(v.number()),
		factors: v.optional(v.array(v.string())),
		shareWithSupportWorker: v.optional(v.boolean()),
		notes: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_user_and_date", ["userId", "createdAt"]),
	
	// Appointments
	appointments: defineTable({
		userId: v.string(),
		supportWorker: v.string(),
		supportWorkerId: v.optional(v.number()), // Backend API support worker ID
		date: v.string(), // ISO date string (YYYY-MM-DD)
		time: v.string(), // HH:mm format
		duration: v.optional(v.number()), // Duration in minutes
		type: v.string(), // 'video' | 'phone' | 'in_person'
		status: v.string(), // 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
		meetingLink: v.optional(v.string()), // Video call link
		notes: v.optional(v.string()),
		specialization: v.optional(v.string()), // Support worker specialization
		avatarUrl: v.optional(v.string()), // Support worker avatar
		cancellationReason: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_date", ["date"])
		.index("by_user_and_date", ["userId", "date"])
		.index("by_status", ["status"])
		.index("by_user_and_status", ["userId", "status"]),
	
	// Video Call Sessions (track call history and analytics)
	videoCallSessions: defineTable({
		appointmentId: v.optional(v.id("appointments")), // Link to appointment if scheduled
		userId: v.string(), // Clerk user ID of the client
		supportWorkerName: v.string(), // Support worker name
		supportWorkerId: v.optional(v.string()), // Support worker ID
		sessionStatus: v.string(), // 'connecting' | 'connected' | 'ended' | 'failed'
		joinedAt: v.number(), // When user joined the pre-call screen
		connectedAt: v.optional(v.number()), // When call actually connected
		endedAt: v.optional(v.number()), // When call ended
		duration: v.optional(v.number()), // Call duration in seconds
		audioOption: v.optional(v.string()), // 'phone' | 'none'
		cameraEnabled: v.optional(v.boolean()),
		micEnabled: v.optional(v.boolean()),
		qualityIssues: v.optional(v.array(v.string())), // Track any reported issues
		endReason: v.optional(v.string()), // 'user_left' | 'error' | 'completed'
		metadata: v.optional(v.any()), // Additional session data
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_appointment", ["appointmentId"])
		.index("by_status", ["sessionStatus"])
		.index("by_user_and_date", ["userId", "createdAt"])
		.index("by_support_worker", ["supportWorkerId"]),
	
	// User profiles (extended)
	profiles: defineTable({
		clerkId: v.string(),
		phoneNumber: v.optional(v.string()),
		location: v.optional(v.string()),
		bio: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
		// Extended profile fields for pure Convex profile management
		dateOfBirth: v.optional(v.string()), // YYYY-MM-DD
		gender: v.optional(v.string()),
		pronouns: v.optional(v.string()),
		isLGBTQ: v.optional(v.string()),
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		canadaStatus: v.optional(v.string()),
		dateCameToCanada: v.optional(v.string()), // YYYY-MM-DD
		// Address
		address: v.optional(v.string()),
		city: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		country: v.optional(v.string()),
		// Emergency contact
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
		preferences: v.optional(v.object({
			theme: v.optional(v.string()),
			notifications: v.optional(v.boolean()),
			// Display settings
			darkMode: v.optional(v.boolean()),
			textSize: v.optional(v.string()),
			// Notification toggles
			notificationsEnabled: v.optional(v.boolean()),
			notifMoodTracking: v.optional(v.boolean()),
			notifJournaling: v.optional(v.boolean()),
			notifMessages: v.optional(v.boolean()),
			notifPostReactions: v.optional(v.boolean()),
			notifAppointments: v.optional(v.boolean()),
			notifSelfAssessment: v.optional(v.boolean()),
			// Reminder settings
			reminderFrequency: v.optional(v.string()),
			moodReminderEnabled: v.optional(v.boolean()),
			moodReminderTime: v.optional(v.string()),
			moodReminderFrequency: v.optional(v.string()),
			moodReminderCustomSchedule: v.optional(v.any()),
			journalReminderEnabled: v.optional(v.boolean()),
			journalReminderTime: v.optional(v.string()),
			journalReminderFrequency: v.optional(v.string()),
			journalReminderCustomSchedule: v.optional(v.any()),
			appointmentReminderEnabled: v.optional(v.boolean()),
			appointmentReminderAdvanceMinutes: v.optional(v.number()),
		})),
		updatedAt: v.number(),
	}).index("by_clerkId", ["clerkId"]),
	
	// Activity tracking (for home screen)
	activities: defineTable({
		userId: v.string(),
		activityType: v.string(), // 'login' | 'logout' | 'mood_entry' | 'post_created' | etc.
		metadata: v.optional(v.any()),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_type", ["activityType"])
		.index("by_user_and_date", ["userId", "createdAt"]),

	// Help & Support content
	helpSections: defineTable({
		slug: v.string(),
		title: v.string(),
		icon: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()), // getting_started | features | support | privacy | troubleshooting
		priority: v.optional(v.string()), // high | medium | low
		sort_order: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_slug", ["slug"]).index("by_sort", ["sort_order"]),

	helpItems: defineTable({
		sectionId: v.id("helpSections"),
		title: v.string(),
		content: v.string(),
		// denormalized lowercase fields for faster search/prefix checks
		title_lc: v.optional(v.string()),
		content_lc: v.optional(v.string()),
		type: v.optional(v.string()), // guide | faq | contact
		sort_order: v.optional(v.number()),
		related_features: v.optional(v.array(v.string())),
		estimated_read_time: v.optional(v.number()),
		last_updated: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_section", ["sectionId"]).index("by_title", ["title"]).index("by_title_lc", ["title_lc"]).index("by_sort", ["sort_order"]),

	// Optional: store Convex Storage references for attachments
	// (used by conversations.sendAttachmentFromStorage)

	// Crisis Support resources
	crisisResources: defineTable({
		slug: v.string(),
		title: v.string(),
		subtitle: v.optional(v.string()),
		type: v.string(), // 'phone' | 'website'
		value: v.string(), // phone number or URL
		icon: v.optional(v.string()), // Ionicons name
		color: v.optional(v.string()), // hex color string
		region: v.optional(v.string()), // e.g., 'CA-AB' or 'US-CA'
		country: v.optional(v.string()), // e.g., 'CA', 'US'
		priority: v.optional(v.string()), // high | medium | low
		sort_order: v.optional(v.number()),
		active: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"]) 
		.index("by_region", ["region"]) 
		.index("by_country", ["country"]) 
		.index("by_type", ["type"]) 
		.index("by_sort", ["sort_order"]) 
		.index("by_active", ["active"]),

	crisisEvents: defineTable({
		resourceId: v.id("crisisResources"),
		userId: v.optional(v.string()),
		action: v.string(), // 'view' | 'call' | 'visit'
		createdAt: v.number(),
	})
		.index("by_resource", ["resourceId"]) 
		.index("by_user", ["userId"]),

	// Journal entries
	journalEntries: defineTable({
		clerkId: v.string(),
		title: v.string(),
		content: v.string(),
		emotionType: v.optional(v.string()), // very-sad | sad | neutral | happy | very-happy
		emoji: v.optional(v.string()),
		templateId: v.optional(v.number()),
		tags: v.optional(v.array(v.string())),
		shareWithSupportWorker: v.optional(v.boolean()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["clerkId"]) 
		.index("by_createdAt", ["createdAt"]) 
		.index("by_user_and_createdAt", ["clerkId", "createdAt"]),

	// Journal templates (Convex-backed; keeps numeric id for UI compatibility)
	journalTemplates: defineTable({
		// Numeric identifier to match existing REST/UI expectations
		tplId: v.number(),
		name: v.string(),
		description: v.optional(v.string()),
		prompts: v.array(v.string()),
		icon: v.string(),
		active: v.boolean(),
		sort_order: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_tplId", ["tplId"]) 
		.index("by_active", ["active"]) 
		.index("by_sort", ["sort_order"]),

	// Notifications
	notifications: defineTable({
		userId: v.string(), // Clerk user ID
		type: v.string(), // 'message' | 'appointment' | 'system' | 'reminder' | 'mood' | 'journaling' | 'post_reactions' | 'self_assessment'
		title: v.string(),
		message: v.string(),
		isRead: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_read", ["userId", "isRead"])
		.index("by_createdAt", ["createdAt"]),

	// Resources (mental health content)
	resources: defineTable({
		title: v.string(),
		type: v.string(), // 'Affirmation' | 'Quote' | 'Article' | 'Exercise' | 'Guide'
		duration: v.string(),
		category: v.string(), // 'stress' | 'anxiety' | 'depression' | 'sleep' | 'motivation' | 'mindfulness'
		content: v.string(),
		author: v.optional(v.string()),
		imageEmoji: v.string(),
		backgroundColor: v.string(),
		tags: v.optional(v.array(v.string())),
		isExternal: v.optional(v.boolean()), // true for API-fetched content
		active: v.boolean(),
		sortOrder: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_category", ["category"])
		.index("by_type", ["type"])
		.index("by_active", ["active"])
		.index("by_sort", ["sortOrder"]),

	// Resource bookmarks (favorites)
	resourceBookmarks: defineTable({
		userId: v.string(), // Clerk user ID
		resourceId: v.id("resources"),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"]) // list all favorites for a user
		.index("by_resource", ["resourceId"]) // (optional) reverse lookup
		.index("by_user_and_resource", ["userId", "resourceId"]), // ensure uniqueness

	// Self-Assessments (Mental Wellbeing Scale)
	assessments: defineTable({
		userId: v.string(), // Clerk user ID
		assessmentType: v.string(), // 'pre-survey' | 'short-warwick-edinburgh' | etc
		responses: v.any(), // JSON object of question_id: answer_value
		totalScore: v.number(), // Calculated total score
		completedAt: v.number(), // Timestamp when completed
		nextDueDate: v.optional(v.number()), // When next assessment is due (6 months later)
		notes: v.optional(v.string()), // Optional notes or interpretation
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_completed", ["userId", "completedAt"])
		.index("by_next_due", ["nextDueDate"]),

	// User Settings (Display, Notifications, Reminders)
	settings: defineTable({
		userId: v.string(), // Clerk user ID
		// Display & Accessibility
		darkMode: v.boolean(),
		textSize: v.string(), // 'Small' | 'Medium' | 'Large' | 'Extra Large'
		// Notifications
		notificationsEnabled: v.boolean(),
		notifMoodTracking: v.boolean(),
		notifJournaling: v.boolean(),
		notifMessages: v.boolean(),
		notifPostReactions: v.boolean(),
		notifAppointments: v.boolean(),
		notifSelfAssessment: v.boolean(),
		reminderFrequency: v.string(), // 'Daily' | 'Weekly' | 'Custom'
		// Mood Reminders
		moodReminderEnabled: v.boolean(),
		moodReminderTime: v.string(), // HH:mm format
		moodReminderFrequency: v.string(), // 'Daily' | 'Custom'
		moodReminderCustomSchedule: v.any(), // JSON object { monday: "09:00", ... }
		// Journal Reminders
		journalReminderEnabled: v.boolean(),
		journalReminderTime: v.string(), // HH:mm format
		journalReminderFrequency: v.string(), // 'Daily' | 'Custom'
		journalReminderCustomSchedule: v.any(), // JSON object { monday: "20:00", ... }
		// Appointment Reminders
		appointmentReminderEnabled: v.boolean(),
		appointmentReminderAdvanceMinutes: v.number(), // Minutes before appointment
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"]),

	// Dedicated Support Workers (initial hardcoded seed + future expansion)
	supportWorkers: defineTable({
		name: v.string(),
		title: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		specialization: v.optional(v.string()), // comma-separated specialties string
		specialties: v.optional(v.array(v.string())), // normalized list
		bio: v.optional(v.string()),
		yearsOfExperience: v.optional(v.number()),
		hourlyRate: v.optional(v.number()),
		languagesSpoken: v.optional(v.array(v.string())),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_name", ["name"]),
});
