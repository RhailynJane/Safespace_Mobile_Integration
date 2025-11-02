/**
 * API Load Testing Script using Artillery
 * Tests backend API performance under load
 */

// artillery.yml configuration for SafeSpace API load testing
const artilleryConfig = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      {
        duration: 60,
        arrivalRate: 5,
        name: 'Warm up'
      },
      {
        duration: 120,
        arrivalRate: 10,
        rampTo: 50,
        name: 'Ramp up load'
      },
      {
        duration: 60,
        arrivalRate: 50,
        name: 'Sustained load'
      }
    ],
    processor: './load-test-processor.js'
  },
  scenarios: [
    {
      name: 'Authentication Flow',
      flow: [
        {
          post: {
            url: '/api/auth/signup',
            json: {
              email: 'test{{ $randomString() }}@example.com',
              password: 'SecurePass123!',
              firstName: 'Load',
              lastName: 'Test'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        {
          think: 2
        },
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'SecurePass123!'
            }
          }
        }
      ]
    },
    {
      name: 'Mood Tracking Flow',
      flow: [
        {
          get: {
            url: '/api/mood',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 1
        },
        {
          post: {
            url: '/api/mood',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            },
            json: {
              mood: 'happy',
              intensity: 4,
              note: 'Load test entry'
            }
          }
        }
      ]
    },
    {
      name: 'Journal Flow',
      flow: [
        {
          get: {
            url: '/api/journal',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 2
        },
        {
          post: {
            url: '/api/journal',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            },
            json: {
              title: 'Load Test Journal',
              content: 'This is a load test journal entry',
              mood: 'calm'
            }
          }
        }
      ]
    },
    {
      name: 'Appointments Flow',
      flow: [
        {
          get: {
            url: '/api/appointments',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 3
        },
        {
          post: {
            url: '/api/appointments',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            },
            json: {
              therapistName: 'Dr. Test',
              date: new Date(Date.now() + 86400000).toISOString(),
              time: '10:00 AM',
              type: 'Therapy Session'
            }
          }
        }
      ]
    },
    {
      name: 'Resources Browse',
      flow: [
        {
          get: {
            url: '/api/resources',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 1
        },
        {
          get: {
            url: '/api/resources/1',
            headers: {
              Authorization: 'Bearer {{ authToken }}'
            }
          }
        }
      ]
    }
  ]
};

// Export Artillery configuration
module.exports = artilleryConfig;

/**
 * Load Test Performance Targets
 * 
 * Response Time Targets:
 * - p50 (median): < 200ms
 * - p95: < 500ms
 * - p99: < 1000ms
 * 
 * Throughput Targets:
 * - Requests per second: > 100
 * - Concurrent users: 50
 * 
 * Error Rate:
 * - < 0.1% error rate
 * 
 * Resource Usage:
 * - CPU: < 70%
 * - Memory: < 80%
 * - Database connections: < 90% of pool
 */

// Artillery CLI commands to run tests:
// npm install -g artillery
// artillery run load-test-config.js --output report.json
// artillery report report.json --output report.html
