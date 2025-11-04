import SendbirdCalls from '@sendbird/calls-react-native';
import Constants from 'expo-constants';

// typescript won't stop complaining about missing types for SendbirdCalls
declare module '@sendbird/calls-react-native' {
  export default class SendbirdCalls {
    static init(appId: string): void;
    static authenticate(options: any): Promise<any>;
    static dial(params: any): Promise<any>;
  }
}

class SendBirdCallService {
  private currentCall: any = null;
  private appId: string = Constants.expoConfig?.extra?.sendbirdAppId || '';

  async initialize() {
    try {
      if (!this.appId) {
        throw new Error('SendBird App ID not found in app.json. Please add it to extra.sendbirdAppId');
      }
      
      SendbirdCalls.init(this.appId);
      console.log('✅ SendBird initialized with App ID:', this.appId);
    } catch (error) {
      console.error('❌ SendBird init failed:', error);
      throw error;
    }
  }

  async authenticate(userId: string, accessToken?: string) {
    try {
      const authOption: any = { userId };
      if (accessToken) {
        authOption.accessToken = accessToken;
      }
      
      const user = await SendbirdCalls.authenticate(authOption);
      console.log('✅ Authenticated:', userId);
      return user;
    } catch (error) {
      console.error('❌ Auth failed:', error);
      throw error;
    }
  }

  async createCall(calleeId: string, isVideoCall: boolean = true) {
    try {
      const dialParams: any = {
        calleeId,
        isVideoCall,
        callOption: {
          audioEnabled: true,
          videoEnabled: isVideoCall,
        },
      };

      const call = await SendbirdCalls.dial(dialParams);
      this.currentCall = call;
      console.log('✅ Call created to:', calleeId);
      return this.currentCall;
    } catch (error) {
      console.error('❌ Call failed:', error);
      throw error;
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.currentCall) {
      if (enabled) {
        this.currentCall.startVideo();
      } else {
        this.currentCall.stopVideo();
      }
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.currentCall) {
      if (enabled) {
        this.currentCall.unmuteMicrophone();
      } else {
        this.currentCall.muteMicrophone();
      }
    }
  }

  async endCall() {
    if (this.currentCall) {
      try {
        await this.currentCall.end();
        this.currentCall = null;
        console.log('✅ Call ended');
      } catch (error) {
        console.error('❌ Error ending call:', error);
        this.currentCall = null;
      }
    }
  }

  getCurrentCall() {
    return this.currentCall;
  }
}

export default new SendBirdCallService();