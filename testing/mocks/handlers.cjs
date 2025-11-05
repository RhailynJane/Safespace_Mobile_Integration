/* eslint-disable no-undef */
// MSW handlers for API mocking
const { http, HttpResponse } = require('msw');

// Get base URL from environment or use localhost
// testing/mocks/handlers.cjs
// MSW mock handlers for API endpoints

/* eslint-env node */
/* eslint-disable no-unused-vars */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const handlers = [
  // ==================== AUTH ENDPOINTS ====================
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 1,
        email: body.email,
        firstName: 'Test',
        lastName: 'User'
      }
    }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/api/auth/signup`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      user: {
        id: 1,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName
      }
    }, { status: 201 });
  }),

  // ==================== MOOD TRACKING ====================
  http.get(`${API_BASE_URL}/api/mood`, () => {
    return HttpResponse.json({
      success: true,
      moods: [
        {
          id: 1,
          userId: 1,
          mood: 'happy',
          intensity: 4,
          note: 'Great day!',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          userId: 1,
          mood: 'anxious',
          intensity: 3,
          note: 'Work stress',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/api/mood`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      mood: {
        id: 3,
        ...body,
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  // ==================== JOURNAL ENTRIES ====================
  http.get(`${API_BASE_URL}/api/journal`, () => {
    return HttpResponse.json({
      success: true,
      entries: [
        {
          id: 1,
          userId: 1,
          title: 'My First Journal Entry',
          content: 'Today was a good day...',
          mood: 'happy',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: 1,
          title: 'Reflections',
          content: 'Thinking about my progress...',
          mood: 'calm',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/api/journal`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      entry: {
        id: 3,
        userId: 1,
        ...body,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  http.get(`${API_BASE_URL}/api/journal/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      entry: {
        id: parseInt(params.id),
        userId: 1,
        title: 'Journal Entry Detail',
        content: 'Full content here...',
        mood: 'happy',
        createdAt: new Date().toISOString()
      }
    }, { status: 200 });
  }),

  http.put(`${API_BASE_URL}/api/journal/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      entry: {
        id: parseInt(params.id),
        userId: 1,
        ...body,
        updatedAt: new Date().toISOString()
      }
    }, { status: 200 });
  }),

  http.delete(`${API_BASE_URL}/api/journal/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    }, { status: 200 });
  }),

  // ==================== APPOINTMENTS ====================
  http.get(`${API_BASE_URL}/api/appointments`, () => {
    return HttpResponse.json({
      success: true,
      appointments: [
        {
          id: 1,
          userId: 1,
          therapistName: 'Dr. Sarah Smith',
          date: new Date(Date.now() + 86400000).toISOString(),
          time: '10:00 AM',
          type: 'Therapy Session',
          status: 'confirmed'
        },
        {
          id: 2,
          userId: 1,
          therapistName: 'Dr. John Doe',
          date: new Date(Date.now() + 172800000).toISOString(),
          time: '2:00 PM',
          type: 'Check-in',
          status: 'pending'
        }
      ]
    }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/api/appointments`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      appointment: {
        id: 3,
        userId: 1,
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  // ==================== PROFILE ====================
  http.get(`${API_BASE_URL}/api/profile`, () => {
    return HttpResponse.json({
      success: true,
      profile: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '0987654321'
        }
      }
    }, { status: 200 });
  }),

  http.put(`${API_BASE_URL}/api/profile`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      profile: {
        id: 1,
        ...body,
        updatedAt: new Date().toISOString()
      }
    }, { status: 200 });
  }),

  // ==================== RESOURCES ====================
  http.get(`${API_BASE_URL}/api/resources`, () => {
    return HttpResponse.json({
      success: true,
      resources: [
        {
          id: 1,
          title: 'Understanding Anxiety',
          description: 'A comprehensive guide to managing anxiety',
          category: 'Mental Health',
          url: 'https://example.com/anxiety',
          type: 'article'
        },
        {
          id: 2,
          title: 'Meditation Basics',
          description: 'Learn meditation techniques',
          category: 'Wellness',
          url: 'https://example.com/meditation',
          type: 'video'
        }
      ]
    }, { status: 200 });
  }),

  // ==================== CRISIS SUPPORT ====================
  http.get(`${API_BASE_URL}/api/crisis-support`, () => {
    return HttpResponse.json({
      success: true,
      contacts: [
        {
          id: 1,
          name: 'National Suicide Prevention Lifeline',
          phone: '988',
          available: '24/7'
        },
        {
          id: 2,
          name: 'Crisis Text Line',
          phone: 'Text HOME to 741741',
          available: '24/7'
        }
      ]
    }, { status: 200 });
  }),

  // ==================== SELF ASSESSMENT ====================
  http.get(`${API_BASE_URL}/api/assessments`, () => {
    return HttpResponse.json({
      success: true,
      assessments: [
        {
          id: 1,
          title: 'Depression Screening',
          description: 'PHQ-9 Assessment',
          questions: 9,
          duration: '5 minutes'
        },
        {
          id: 2,
          title: 'Anxiety Screening',
          description: 'GAD-7 Assessment',
          questions: 7,
          duration: '3 minutes'
        }
      ]
    }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/api/assessments/:id/submit`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      result: {
        assessmentId: parseInt(params.id),
        score: 12,
        severity: 'Moderate',
        recommendations: [
          'Consider speaking with a mental health professional',
          'Practice daily self-care activities'
        ],
        submittedAt: new Date().toISOString()
      }
    }, { status: 200 });
  }),

  // ==================== NOTIFICATIONS ====================
  http.get(`${API_BASE_URL}/api/notifications`, () => {
    return HttpResponse.json({
      success: true,
      notifications: [
        {
          id: 1,
          userId: 1,
          title: 'Appointment Reminder',
          message: 'Your appointment is tomorrow at 10:00 AM',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: 1,
          title: 'New Resource Available',
          message: 'Check out our new meditation guide',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }, { status: 200 });
  }),

  http.put(`${API_BASE_URL}/api/notifications/:id/read`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Notification marked as read'
    }, { status: 200 });
  })
];

module.exports = { handlers };
