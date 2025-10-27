import SendbirdCalls from 'sendbird-calls';

const APP_ID = process.env.EXPO_PUBLIC_SENDBIRD_APP_ID || 'E30F2BDE-F34E-464F-9689-7D5C443231A3';

class SendBirdCallService {
  private static instance: SendBirdCallService;
  private initialized = false;
  private currentCall: any = null;

  private constructor() {}

  static getInstance(): SendBirdCallService {
    if (!SendBirdCallService.instance) {
      SendBirdCallService.instance = new SendBirdCallService();
    }
    return SendBirdCallService.instance;
  }

  // Initialize SendBird Calls
  async initialize() {
    if (this.initialized) {
      console.log('SendBird already initialized');
      return;
    }

    try {
      await SendbirdCalls.init(APP_ID);
      this.initialized = true;
      console.log('SendBird Calls initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SendBird Calls:', error);
      throw error;
    }
  }

  // Authenticate user with SendBird
  async authenticate(userId: string, accessToken?: string) {
    try {
      const authOption = accessToken 
        ? { userId, accessToken }
        : { userId };
      
      await SendbirdCalls.authenticate(authOption);
      console.log('User authenticated:', userId);
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  // Create a direct call (1:1 video call)
  async createCall(calleeId: string, isVideoCall: boolean = true) {
    try {
      const callOptions = {
        calleeId,
        isVideoCall,
        callOption: {
          localMediaView: null, // Will be set in the component
          remoteMediaView: null, // Will be set in the component
          audioEnabled: true,
          videoEnabled: isVideoCall,
        },
      };

      const call = await SendbirdCalls.dial(callOptions);
      this.currentCall = call;
      console.log('Call created:', call.callId);
      return call;
    } catch (error) {
      console.error('Failed to create call:', error);
      throw error;
    }
  }

  // Accept incoming call
  async acceptCall(call: any) {
    try {
      await call.accept({
        callOption: {
          localMediaView: null,
          remoteMediaView: null,
          audioEnabled: true,
          videoEnabled: true,
        },
      });
      this.currentCall = call;
      console.log('Call accepted');
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  // End current call
  async endCall() {
    try {
      if (this.currentCall) {
        await this.currentCall.end();
        this.currentCall = null;
        console.log('Call ended');
      }
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }

  // Toggle video
  toggleVideo(enabled: boolean) {
    if (this.currentCall) {
      if (enabled) {
        this.currentCall.startVideo();
      } else {
        this.currentCall.stopVideo();
      }
    }
  }

  // Toggle audio
  toggleAudio(enabled: boolean) {
    if (this.currentCall) {
      if (enabled) {
        this.currentCall.unmute();
      } else {
        this.currentCall.mute();
      }
    }
  }

  // Get current call
  getCurrentCall() {
    return this.currentCall;
  }

  // Add incoming call listener
  addListener(eventName: string, handler: Function) {
    SendbirdCalls.addListener(eventName, handler);
  }

  // Remove listener
  removeListener(eventName: string) {
    SendbirdCalls.removeListener(eventName);
  }
}

export default SendBirdCallService.getInstance();
