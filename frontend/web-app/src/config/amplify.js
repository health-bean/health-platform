// Amplify configuration for Cognito authentication
import { Amplify } from '@aws-amplify/core';

const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_8lWGDfv0w',
      userPoolClientId: '20gj35c0vmamtm4qgtk3euoh27',
      // No hosted UI - we're using custom forms
      loginWith: {
        email: true,
        username: false
      }
    }
  }
};

// Configure Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig;