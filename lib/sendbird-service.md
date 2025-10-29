import SendBirdCall from '@sendbird/calls-react-native';
import { Alert } from 'react-native';

class SendBirdCallService {
  private currentCall: any = null;
  private appId: string = process.env.EXPO_PUBLIC_SENDBIRD_APP_ID || '';

  async initialize() {
    try {
      if (!this.appId) {
        throw new Error('SendBird App ID not found in .env');
      }
      await SendBirdCall.init(this.appId);
      console.log('✅ SendBird initialized');
    } catch (error) {
      console.error('❌ SendBird init failed:', error);
      throw error;
    }
  }

  async authenticate(userId: string) {
    try {
      await SendBirdCall.authenticate({ userId });
      console.log('✅ Authenticated:', userId);
    } catch (error) {
      console.error('❌ Auth failed:', error);
      throw error;
    }
  }

  async createCall(calleeId: string, isVideoCall: boolean = true) {
    try {
      this.currentCall = await SendBirdCall.dial({
        calleeId,
        isVideoCall,
        callOption: {
          audioEnabled: true,
          videoEnabled: isVideoCall,
        },
      });
      console.log('✅ Call created');
      return this.currentCall;
    } catch (error) {
      console.error('❌ Call failed:', error);
      throw error;
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.currentCall) {
      enabled ? this.currentCall.startVideo() : this.currentCall.stopVideo();
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.currentCall) {
      enabled ? this.currentCall.unmuteMicrophone() : this.currentCall.muteMicrophone();
    }
  }

  async endCall() {
    if (this.currentCall) {
      await this.currentCall.end();
      this.currentCall = null;
    }
  }

  getCurrentCall() {
    return this.currentCall;
  }
}

export default new SendBirdCallService();