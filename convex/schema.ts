import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * UNIFIED Convex Schema for SafeSpace Mobile & Web
 * 
 * This schema integrates:
 * 1. SafeSpace Mobile (Android) - personal wellness & community
 * 2. SafeSpace Web - enterprise management & multi-tenancy
 * 
 * Strategy:
 * - Users: Merged (clerkId is primary, all optional fields supported)
 * - Appointments: Merged (normalized field names)
 * - Notifications: Merged (unified structure)
 * - Other tables: Preserved as-is
 * 
 * KEY CHANGE: All user references use clerkId (string), not numeric IDs
 */

export default defineSchema({
	// ============================================
	// ORGANIZATIONS & ACCESS CONTROL
	// ============================================
	
	organizations: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),
		contactEmail: v.optional(v.string()),
		contactPhone: v.optional(v.string()),
		address: v.optional(v.string()),
		website: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		status: v.string(), // 'active' | 'inactive' | 'suspended'
		settings: v.optional(v.object({
			maxUsers: v.optional(v.number()),
			features: v.optional(v.array(v.string())),
			customBranding: v.optional(v.boolean()),
		})),
		createdAt: v.number(),
		updatedAt: v.number(),
		createdBy: v.optional(v.string()), // clerk user id
	})
		.index("by_slug", ["slug"])
		.index("by_status", ["status"])
		.index("by_createdAt", ["createdAt"]),

	roles: defineTable({
		slug: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		permissions: v.array(v.string()),
		level: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_level", ["level"]),

	featurePermissions: defineTable({
		orgId: v.string(),
		featureKey: v.string(),
		enabled: v.boolean(),
		updatedAt: v.number(),
		updatedBy: v.optional(v.string()),
	})
		.index("by_org", ["orgId"])
		.index("by_org_and_feature", ["orgId", "featureKey"]),

	// ============================================
	// UNIFIED USERS TABLE (Mobile + Web)
	// ============================================
	
	/**
	 * CRITICAL: This table merges mobile and web users
	 * 
	 * Mobile users have:
	 * - clerkId, email, firstName, lastName, imageUrl, orgId (optional)
	 * 
	 * Web users additionally have:
	 * - roleId, status, phoneNumber, address, emergency contacts, CMHA demographics
	 * 
	 * All fields are optional to support both platforms during migration
	 */
	users: defineTable({
		// === PRIMARY IDENTIFIER ===
		clerkId: v.string(), // Clerk user ID (unique)
		
		// === BASIC PROFILE ===
		email: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		imageUrl: v.optional(v.string()), // Mobile field name
		profileImageUrl: v.optional(v.string()), // Web field name (kept for compatibility)
		
		// === ORGANIZATION & ROLE ===
		orgId: v.optional(v.string()), // Organization slug
		roleId: v.optional(v.string()), // Role slug: 'superadmin', 'admin', 'team_leader', 'support_worker', 'peer_support', 'client'
		status: v.optional(v.string()), // 'active' | 'inactive' | 'suspended' | 'deleted'
		
		// === WEB-SPECIFIC FIELDS ===
		phoneNumber: v.optional(v.string()),
		address: v.optional(v.string()),
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
		
		// === CMHA DEMOGRAPHICS (Web) ===
		pronouns: v.optional(v.string()),
		isLGBTQ: v.optional(v.string()), // 'yes' | 'no' | 'prefer_not_to_answer'
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		canadaStatus: v.optional(v.string()),
		dateCameToCanada: v.optional(v.string()), // YYYY-MM-DD
		
		// === AVAILABILITY (Web - for scheduling) ===
		availability: v.optional(v.array(v.object({
			day: v.string(),
			startTime: v.string(), // HH:mm
			endTime: v.string(), // HH:mm
			enabled: v.boolean(),
		}))),
		
		// === CLIENT ASSIGNMENT (Web - for support workers) ===
		assignedUserId: v.optional(v.string()), // Legacy field for backward compatibility
		
		// === TIMESTAMPS ===
		lastLogin: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerkId", ["clerkId"])
		.index("by_email", ["email"])
		.index("by_orgId", ["orgId"])
		.index("by_roleId", ["roleId"])
		.index("by_org_and_role", ["orgId", "roleId"])
		.index("by_status", ["status"]),

	// ============================================
	// CLIENTS (Enterprise Feature - Web)
	// ============================================
	
	/**
	 * Separate client records for web enterprise
	 * Link to users table via clerkId (if they log in)
	 */
	clients: defineTable({
		firstName: v.string(),
		lastName: v.string(),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.optional(v.string()),
		dateOfBirth: v.optional(v.string()), // YYYY-MM-DD
		gender: v.optional(v.string()),
		status: v.optional(v.string()), // 'active' | 'inactive' | 'discharged'
		riskLevel: v.optional(v.string()), // 'low' | 'medium' | 'high' | 'critical'
		lastSessionDate: v.optional(v.number()),
		
		// Links
		clerkId: v.optional(v.string()), // Link to user if they authenticate
		assignedUserId: v.optional(v.string()), // Clerk ID of assigned support worker
		orgId: v.optional(v.string()),
		
		// Emergency contact
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
		
		// Demographics
		pronouns: v.optional(v.string()),
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerkId", ["clerkId"])
		.index("by_email", ["email"])
		.index("by_assignedUser", ["assignedUserId"])
		.index("by_orgId", ["orgId"])
		.index("by_status", ["status"])
		.index("by_riskLevel", ["riskLevel"]),

	// ============================================
	// SUPPORT WORKERS
	// ============================================
	
	supportWorkers: defineTable({
		// Link to user if they're a platform user
		clerkId: v.optional(v.string()),
		
		name: v.string(),
		title: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		
		// Specialization
		specialization: v.optional(v.string()),
		specialties: v.optional(v.array(v.string())),
		bio: v.optional(v.string()),
		
		// Experience & qualifications
		yearsOfExperience: v.optional(v.number()),
		hourlyRate: v.optional(v.number()),
		languagesSpoken: v.optional(v.array(v.string())),
		
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_name", ["name"])
		.index("by_clerkId", ["clerkId"])
		.index("by_orgId", ["orgId"]),

	// ============================================
	// UNIFIED APPOINTMENTS (Mobile + Web)
	// ============================================
	
	/**
	 * MERGED TABLE: Supports both:
	 * - Mobile: user.id → appointments for self
	 * - Web: client.id → appointments assigned by team leaders
	 * 
	 * Uses consistent field naming (camelCase)
	 */
	appointments: defineTable({
		// === CLIENT/USER REFERENCE ===
		userId: v.optional(v.string()), // Clerk ID (mobile user or web client user)
		clientId: v.optional(v.string()), // Clerk ID or clients table ID (flexible for cross-platform sync)
		
		// === SUPPORT WORKER ===
		supportWorkerId: v.optional(v.string()), // Clerk ID of support worker
		supportWorkerName: v.optional(v.string()), // Denormalized name (fallback)
		supportWorker: v.optional(v.string()), // Legacy mobile field name
		
		// === SCHEDULING ===
		appointmentDate: v.optional(v.string()), // ISO date: YYYY-MM-DD (made optional for migration)
		appointmentTime: v.optional(v.string()), // HH:mm format (made optional for migration)
		date: v.optional(v.string()), // Legacy mobile field name
		time: v.optional(v.string()), // Legacy mobile field name
		durationMinutes: v.optional(v.number()),
		duration: v.optional(v.number()), // Legacy mobile field name for durationMinutes
		
		// === DETAILS ===
		appointmentType: v.optional(v.string()), // 'video' | 'phone' | 'in_person' | 'initial_assessment' | 'follow_up' (made optional for migration)
		type: v.optional(v.string()), // Legacy mobile field name for appointmentType
		status: v.string(), // 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
		meetingLink: v.optional(v.string()),
		
		// === NOTES & METADATA ===
		notes: v.optional(v.string()),
		details: v.optional(v.string()),
		cancellationReason: v.optional(v.string()),
		
		// === LEGACY FIELDS (for backward compatibility) ===
		avatarUrl: v.optional(v.string()), // Support worker avatar (legacy)
		specialization: v.optional(v.string()), // Support worker specialization (legacy)
		
		// === ORGANIZATION SCOPING ===
		orgId: v.optional(v.string()),
		
		// === WHO SCHEDULED IT ===
		scheduledByUserId: v.optional(v.string()), // Clerk ID
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_clientId", ["clientId"])
		.index("by_supportWorkerId", ["supportWorkerId"])
		.index("by_appointmentDate", ["appointmentDate"])
		.index("by_status", ["status"])
		.index("by_orgId", ["orgId"])
		.index("by_user_and_date", ["userId", "appointmentDate"])
		.index("by_client_and_date", ["clientId", "appointmentDate"]),

	// ============================================
	// SESSION NOTES (Web Enterprise)
	// ============================================
	
	notes: defineTable({
		clientId: v.string(), // Reference to client
		authorUserId: v.string(), // Clerk ID of note author
		noteDate: v.string(), // ISO date
		
		sessionType: v.optional(v.string()), // 'individual' | 'group' | 'family' | 'assessment'
		durationMinutes: v.optional(v.number()),
		
		summary: v.optional(v.string()),
		detailedNotes: v.optional(v.string()),
		riskAssessment: v.optional(v.string()),
		nextSteps: v.optional(v.string()),
		
		activities: v.optional(v.array(v.object({
			type: v.string(),
			minutes: v.union(v.number(), v.string()),
		}))),
		
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clientId", ["clientId"])
		.index("by_authorUserId", ["authorUserId"])
		.index("by_noteDate", ["noteDate"])
		.index("by_orgId", ["orgId"])
		.index("by_client_and_date", ["clientId", "noteDate"]),

	// ============================================
	// VIDEO CALL SESSIONS
	// ============================================
	
	videoCallSessions: defineTable({
		appointmentId: v.optional(v.id("appointments")),
		userId: v.string(), // Clerk ID
		supportWorkerName: v.string(),
		supportWorkerId: v.optional(v.string()),
		
		sessionStatus: v.string(), // 'connecting' | 'connected' | 'ended' | 'failed'
		joinedAt: v.number(),
		connectedAt: v.optional(v.number()),
		endedAt: v.optional(v.number()),
		duration: v.optional(v.number()), // seconds
		
		audioOption: v.optional(v.string()),
		cameraEnabled: v.optional(v.boolean()),
		micEnabled: v.optional(v.boolean()),
		qualityIssues: v.optional(v.array(v.string())),
		endReason: v.optional(v.string()),
		metadata: v.optional(v.any()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_appointmentId", ["appointmentId"])
		.index("by_status", ["sessionStatus"])
		.index("by_support_worker", ["supportWorkerId"]),

	// ============================================
	// REFERRALS & INTAKE (Web Enterprise)
	// ============================================
	
	referrals: defineTable({
		clientId: v.optional(v.string()),
		clientFirstName: v.string(),
		clientLastName: v.string(),
		age: v.optional(v.number()),
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		address: v.optional(v.string()),
		
		emergencyFirstName: v.optional(v.string()),
		emergencyLastName: v.optional(v.string()),
		emergencyPhone: v.optional(v.string()),
		
		referralSource: v.string(),
		reasonForReferral: v.string(),
		additionalNotes: v.optional(v.string()),
		
		submittedDate: v.optional(v.number()),
		status: v.string(), // 'pending' | 'in_review' | 'accepted' | 'rejected' | 'completed'
		processedDate: v.optional(v.number()),
		processedByUserId: v.optional(v.string()), // Clerk ID
		
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clientId", ["clientId"])
		.index("by_status", ["status"])
		.index("by_processedByUserId", ["processedByUserId"])
		.index("by_orgId", ["orgId"])
		.index("by_submittedDate", ["submittedDate"]),

	referralTimeline: defineTable({
		referralId: v.id("referrals"),
		message: v.string(),
		createdBy: v.optional(v.string()), // Clerk ID
		createdAt: v.number(),
	})
		.index("by_referralId", ["referralId"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// CRISIS EVENTS & RESOURCES
	// ============================================
	
	crisisEvents: defineTable({
		clientId: v.optional(v.string()),
		initiatorUserId: v.optional(v.string()), // Clerk ID
		
		eventType: v.string(), // 'hotline_call' | 'emergency_call' | 'supervisor_contact' | 'client_contact'
		eventDate: v.number(),
		description: v.optional(v.string()),
		riskLevelAtEvent: v.optional(v.string()),
		interventionDetails: v.optional(v.string()),
		
		contactMethod: v.optional(v.string()),
		contactPurpose: v.optional(v.string()),
		urgencyLevel: v.optional(v.string()),
		
		supervisorContactedUserId: v.optional(v.string()),
		outcome: v.optional(v.string()),
		followUpRequired: v.optional(v.boolean()),
		
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clientId", ["clientId"])
		.index("by_initiatorUserId", ["initiatorUserId"])
		.index("by_eventDate", ["eventDate"])
		.index("by_orgId", ["orgId"])
		.index("by_riskLevel", ["riskLevelAtEvent"]),

	crisisResources: defineTable({
		slug: v.string(),
		title: v.string(),
		subtitle: v.optional(v.string()),
		type: v.string(), // 'phone' | 'website' | 'resource'
		value: v.string(), // phone number or URL
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		
		region: v.optional(v.string()), // e.g., 'CA-AB'
		country: v.optional(v.string()), // e.g., 'CA'
		priority: v.optional(v.string()),
		sortOrder: v.optional(v.number()),
		active: v.boolean(),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_region", ["region"])
		.index("by_country", ["country"])
		.index("by_type", ["type"])
		.index("by_active", ["active"]),

	crisisEventsLog: defineTable({
		resourceId: v.id("crisisResources"),
		userId: v.optional(v.string()),
		action: v.string(), // 'view' | 'call' | 'visit'
		createdAt: v.number(),
	})
		.index("by_resourceId", ["resourceId"])
		.index("by_userId", ["userId"]),

	// ============================================
	// UNIFIED NOTIFICATIONS (Mobile + Web)
	// ============================================
	
	notifications: defineTable({
		userId: v.string(), // Clerk ID
		
		type: v.string(), // 'message' | 'appointment' | 'system' | 'reminder' | 'mood' | 'journaling' | 'post_reactions' | 'self_assessment' | 'referral' | 'crisis'
		title: v.string(),
		message: v.string(),
		
		isRead: v.boolean(),
		relatedId: v.optional(v.string()), // ID of related entity (appointment, post, etc.)
		
		orgId: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_user_and_read", ["userId", "isRead"])
		.index("by_type", ["type"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// AUDIT LOGS & MONITORING (Enterprise)
	// ============================================
	
	auditLogs: defineTable({
		userId: v.optional(v.string()), // Clerk ID
		action: v.string(),
		entityType: v.optional(v.string()),
		entityId: v.optional(v.string()),
		details: v.optional(v.string()), // JSON
		
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		
		orgId: v.optional(v.string()),
		timestamp: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_action", ["action"])
		.index("by_entityType", ["entityType"])
		.index("by_orgId", ["orgId"])
		.index("by_timestamp", ["timestamp"]),

	systemAlerts: defineTable({
		message: v.string(),
		type: v.string(), // 'info' | 'warning' | 'error' | 'critical'
		severity: v.optional(v.string()),
		isRead: v.boolean(),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_type", ["type"])
		.index("by_isRead", ["isRead"])
		.index("by_orgId", ["orgId"])
		.index("by_createdAt", ["createdAt"]),

	reports: defineTable({
		title: v.string(),
		reportType: v.string(),
		sizeBytes: v.optional(v.number()),
		
		createdBy: v.optional(v.string()), // Clerk ID
		orgId: v.optional(v.string()),
		
		dataJson: v.optional(v.any()),
		fileStorageId: v.optional(v.id("_storage")),
		fileMimeType: v.optional(v.string()),
		chartStorageId: v.optional(v.id("_storage")),
		chartMimeType: v.optional(v.string()),
		
		createdAt: v.number(),
	})
		.index("by_orgId", ["orgId", "createdAt"])
		.index("by_createdAt", ["createdAt"])
		.index("by_type", ["reportType", "createdAt"])
		.index("by_creator", ["createdBy", "createdAt"]),

	metricsBuckets: defineTable({
		orgId: v.string(),
		minute: v.number(),
		
		users: v.number(),
		sessions: v.number(),
		dbOk: v.boolean(),
		authOk: v.boolean(),
		apiMs: v.number(),
		alerts: v.number(),
		uptime: v.number(),
		
		createdAt: v.number(),
	})
		.index("by_org_minute", ["orgId", "minute"])
		.index("by_minute", ["minute"]),

	// ============================================
	// MESSAGING (Mobile + Web)
	// ============================================
	
	presence: defineTable({
		userId: v.string(),
		status: v.string(), // 'online' | 'away' | 'offline'
		lastSeen: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_lastSeen", ["lastSeen"]),

	conversations: defineTable({
		title: v.optional(v.string()),
		createdBy: v.string(), // Clerk ID
		
		participantKey: v.optional(v.string()), // sorted unique participants for dedup
		orgId: v.optional(v.string()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_createdBy", ["createdBy"])
		.index("by_createdAt", ["createdAt"])
		.index("by_participantKey", ["participantKey"])
		.index("by_orgId", ["orgId"]),

	conversationParticipants: defineTable({
		conversationId: v.id("conversations"),
		userId: v.string(),
		
		role: v.optional(v.string()),
		joinedAt: v.number(),
		lastReadAt: v.optional(v.number()),
	})
		.index("by_conversationId", ["conversationId"])
		.index("by_userId", ["userId"]),

	messages: defineTable({
		conversationId: v.id("conversations"),
		senderId: v.string(),
		body: v.string(),
		
		messageType: v.optional(v.string()), // 'text' | 'image' | 'file'
		attachmentUrl: v.optional(v.string()),
		fileName: v.optional(v.string()),
		fileSize: v.optional(v.number()),
		storageId: v.optional(v.id("_storage")),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_conversationId", ["conversationId"])
		.index("by_senderId", ["senderId"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// MOOD TRACKING (Mobile)
	// ============================================
	
	moods: defineTable({
		userId: v.string(),
		
		moodType: v.string(),
		moodEmoji: v.optional(v.string()),
		moodLabel: v.optional(v.string()),
		intensity: v.optional(v.number()),
		
		factors: v.optional(v.array(v.string())),
		shareWithSupportWorker: v.optional(v.boolean()),
		notes: v.optional(v.string()),
		
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	})
		.index("by_userId", ["userId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_user_and_date", ["userId", "createdAt"]),

	// ============================================
	// JOURNALING (Mobile)
	// ============================================
	
	journalEntries: defineTable({
		clerkId: v.string(),
		
		title: v.string(),
		content: v.string(),
		emotionType: v.optional(v.string()),
		emoji: v.optional(v.string()),
		
		templateId: v.optional(v.number()),
		tags: v.optional(v.array(v.string())),
		shareWithSupportWorker: v.optional(v.boolean()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["clerkId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_user_and_createdAt", ["clerkId", "createdAt"]),

	journalTemplates: defineTable({
		tplId: v.number(),
		name: v.string(),
		description: v.optional(v.string()),
		prompts: v.array(v.string()),
		icon: v.string(),
		active: v.boolean(),
		sortOrder: v.optional(v.number()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_tplId", ["tplId"])
		.index("by_active", ["active"])
		.index("by_sortOrder", ["sortOrder"]),

	// ============================================
	// COMMUNITY POSTS (Mobile)
	// ============================================
	
	communityPosts: defineTable({
		authorId: v.string(),
		
		title: v.string(),
		content: v.string(),
		category: v.optional(v.string()),
		isDraft: v.boolean(),
		imageUrls: v.optional(v.array(v.string())),
		
		mood: v.optional(v.object({
			id: v.string(),
			emoji: v.string(),
			label: v.string(),
		})),
		
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_authorId", ["authorId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_category", ["category", "createdAt"])
		.index("by_orgId", ["orgId"]),

	postReactions: defineTable({
		postId: v.id("communityPosts"),
		userId: v.string(),
		emoji: v.string(),
		createdAt: v.number(),
	})
		.index("by_postId", ["postId"])
		.index("by_userId", ["userId"])
		.index("by_user_and_post", ["userId", "postId"]),

	postBookmarks: defineTable({
		postId: v.id("communityPosts"),
		userId: v.string(),
		createdAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_postId", ["postId"])
		.index("by_user_and_post", ["userId", "postId"]),

	// ============================================
	// RESOURCES (Mobile)
	// ============================================
	
	resources: defineTable({
		title: v.string(),
		type: v.string(), // 'Affirmation' | 'Quote' | 'Article' | 'Exercise' | 'Guide'
		duration: v.string(),
		category: v.string(),
		content: v.string(),
		author: v.optional(v.string()),
		
		imageEmoji: v.string(),
		backgroundColor: v.string(),
		tags: v.optional(v.array(v.string())),
		
		isExternal: v.optional(v.boolean()),
		active: v.boolean(),
		sortOrder: v.optional(v.number()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_category", ["category"])
		.index("by_type", ["type"])
		.index("by_active", ["active"])
		.index("by_sortOrder", ["sortOrder"]),

	resourceBookmarks: defineTable({
		userId: v.string(),
		resourceId: v.id("resources"),
		createdAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_resourceId", ["resourceId"])
		.index("by_user_and_resource", ["userId", "resourceId"]),

	// ============================================
	// ASSESSMENTS & WELLBEING (Mobile)
	// ============================================
	
	assessments: defineTable({
		userId: v.string(),
		
		assessmentType: v.string(),
		responses: v.any(),
		totalScore: v.number(),
		completedAt: v.number(),
		
		nextDueDate: v.optional(v.number()),
		notes: v.optional(v.string()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_user_and_completed", ["userId", "completedAt"])
		.index("by_nextDueDate", ["nextDueDate"]),

	profiles: defineTable({
		clerkId: v.string(),
		
		phoneNumber: v.optional(v.string()),
		location: v.optional(v.string()),
		bio: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
		
		dateOfBirth: v.optional(v.string()),
		gender: v.optional(v.string()),
		pronouns: v.optional(v.string()),
		isLGBTQ: v.optional(v.string()),
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		canadaStatus: v.optional(v.string()),
		dateCameToCanada: v.optional(v.string()),
		
		address: v.optional(v.string()),
		city: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		country: v.optional(v.string()),
		
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
		
		preferences: v.optional(v.object({
			theme: v.optional(v.string()),
			notifications: v.optional(v.boolean()),
			darkMode: v.optional(v.boolean()),
			textSize: v.optional(v.string()),
			notificationsEnabled: v.optional(v.boolean()),
			notifMoodTracking: v.optional(v.boolean()),
			notifJournaling: v.optional(v.boolean()),
			notifMessages: v.optional(v.boolean()),
			notifPostReactions: v.optional(v.boolean()),
			notifAppointments: v.optional(v.boolean()),
			notifSelfAssessment: v.optional(v.boolean()),
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
	})
		.index("by_clerkId", ["clerkId"]),

	settings: defineTable({
		userId: v.string(),
		
		darkMode: v.boolean(),
		textSize: v.string(),
		notificationsEnabled: v.boolean(),
		notifMoodTracking: v.boolean(),
		notifJournaling: v.boolean(),
		notifMessages: v.boolean(),
		notifPostReactions: v.boolean(),
		notifAppointments: v.boolean(),
		notifSelfAssessment: v.boolean(),
		
		reminderFrequency: v.string(),
		moodReminderEnabled: v.boolean(),
		moodReminderTime: v.string(),
		moodReminderFrequency: v.string(),
		moodReminderCustomSchedule: v.any(),
		
		journalReminderEnabled: v.boolean(),
		journalReminderTime: v.string(),
		journalReminderFrequency: v.string(),
		journalReminderCustomSchedule: v.any(),
		
		appointmentReminderEnabled: v.boolean(),
		appointmentReminderAdvanceMinutes: v.number(),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["userId"]),

	activities: defineTable({
		userId: v.string(),
		activityType: v.string(),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_type", ["activityType"])
		.index("by_user_and_date", ["userId", "createdAt"])
		.index("by_user_type", ["userId", "activityType"]),

	// ============================================
	// HELP & SUPPORT (Mobile)
	// ============================================
	
	helpSections: defineTable({
		slug: v.string(),
		title: v.string(),
		icon: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		priority: v.optional(v.string()),
		sortOrder: v.optional(v.number()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_sortOrder", ["sortOrder"]),

	helpItems: defineTable({
		sectionId: v.id("helpSections"),
		
		title: v.string(),
		content: v.string(),
		title_lc: v.optional(v.string()),
		content_lc: v.optional(v.string()),
		
		type: v.optional(v.string()),
		sortOrder: v.optional(v.number()),
		related_features: v.optional(v.array(v.string())),
		estimated_read_time: v.optional(v.number()),
		last_updated: v.optional(v.string()),
		
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_sectionId", ["sectionId"])
		.index("by_title", ["title"])
		.index("by_title_lc", ["title_lc"])
		.index("by_sortOrder", ["sortOrder"]),

	// ============================================
	// ANNOUNCEMENTS (Mobile + Web)
	// ============================================
	
	announcements: defineTable({
		orgId: v.string(),
		
		title: v.string(),
		body: v.string(),
		
		visibility: v.optional(v.string()), // 'org' | 'public'
		priority: v.optional(v.string()),
		active: v.boolean(),
		images: v.optional(v.array(v.string())),
		
		authorId: v.optional(v.string()),
		readBy: v.optional(v.array(v.string())),
		
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	})
		.index("by_org_created", ["orgId", "createdAt"])
		.index("by_org_active", ["orgId", "active"])
		.index("by_active", ["active"])
		.index("by_createdAt", ["createdAt"]),
});
